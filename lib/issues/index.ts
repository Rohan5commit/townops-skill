import { v4 as uuidv4 } from 'uuid';
import { ensureDb } from '../db';
import type {
  TownIssue,
  IssueStatus,
  IssueClassification,
  AssignmentDecision,
  ResidentUpdate,
  ZoneSummary,
  StatusUpdate,
} from '../schemas';
import { isValidTransition, VALID_TRANSITIONS } from '../schemas';
import { classifyIssue } from '../ai/classify';
import { generateResidentUpdate } from '../ai/resident-update';
import { computePriority } from '../priority';
import { assignIssue } from '../assignment';
import { generateZoneSummary } from '../ai/summary';

// ---------- helpers ----------
function rowToIssue(row: Record<string, unknown>): TownIssue {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    type: row.type as TownIssue['type'],
    severity: row.severity as TownIssue['severity'],
    urgency: row.urgency as TownIssue['urgency'],
    status: row.status as TownIssue['status'],
    zone: row.zone as TownIssue['zone'],
    location: row.location as string,
    latitude: row.latitude as number | undefined,
    longitude: row.longitude as number | undefined,
    reportedBy: row.reported_by as string,
    assignedTo: row.assigned_to as TownIssue['assignedTo'],
    priorityScore: row.priority_score as number,
    affectedResidents: row.affected_residents as number | undefined,
    isRepeat: Boolean(row.is_repeat),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    resolvedAt: row.resolved_at as string | null,
    tags: JSON.parse((row.tags as string) || '[]'),
  };
}

// ---------- create ----------
export async function createIssue(input: {
  title: string;
  description: string;
  type: import('../schemas').IssueType;
  zone: import('../schemas').Zone;
  location: string;
  latitude?: number;
  longitude?: number;
  reportedBy?: string;
  affectedResidents?: number;
  tags?: string[];
}): Promise<{ issue: TownIssue; classification: IssueClassification; priority: ReturnType<typeof computePriority> }> {
  const db = await ensureDb();
  const id = uuidv4();
  const now = new Date().toISOString();

  const issue: TownIssue = {
    id,
    title: input.title,
    description: input.description,
    type: input.type,
    severity: 'medium',
    urgency: 'soon',
    status: 'reported',
    zone: input.zone,
    location: input.location,
    latitude: input.latitude,
    longitude: input.longitude,
    reportedBy: input.reportedBy || 'agent',
    assignedTo: null,
    priorityScore: 50,
    affectedResidents: input.affectedResidents,
    isRepeat: false,
    createdAt: now,
    updatedAt: now,
    resolvedAt: null,
    tags: input.tags || [],
  };

  await db.execute({
    sql: `INSERT INTO issues (id, title, description, type, severity, urgency, status, zone, location, latitude, longitude, reported_by, assigned_to, priority_score, affected_residents, is_repeat, created_at, updated_at, resolved_at, tags)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [issue.id, issue.title, issue.description, issue.type, issue.severity, issue.urgency, issue.status, issue.zone, issue.location, issue.latitude ?? null, issue.longitude ?? null, issue.reportedBy, issue.assignedTo, issue.priorityScore, issue.affectedResidents ?? 0, issue.isRepeat ? 1 : 0, issue.createdAt, issue.updatedAt, issue.resolvedAt, JSON.stringify(issue.tags)],
  });

  // Log creation
  await db.execute({
    sql: `INSERT INTO status_history (id, issue_id, previous_status, new_status, updated_by, note, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [uuidv4(), id, 'reported', 'reported', input.reportedBy || 'agent', 'Issue created', now],
  });

  // Auto-classify
  const rawClassification = await classifyIssue(input.title, input.description);
  const classification: IssueClassification = { ...rawClassification, issueId: id };
  const updatedIssue = { ...issue, severity: classification.severity, urgency: classification.urgency };
  const priority = computePriority(updatedIssue);

  // Update issue with classification results
  await db.execute({
    sql: `UPDATE issues SET severity=?, urgency=?, priority_score=?, updated_at=? WHERE id=?`,
    args: [classification.severity, classification.urgency, priority.score, new Date().toISOString(), id],
  });

  return {
    issue: { ...updatedIssue, priorityScore: priority.score },
    classification,
    priority,
  };
}

// ---------- classify ----------
export async function classifyExistingIssue(issueId: string): Promise<IssueClassification> {
  const db = await ensureDb();
  const result = await db.execute({ sql: 'SELECT * FROM issues WHERE id = ?', args: [issueId] });
  if (result.rows.length === 0) throw new Error(`Issue ${issueId} not found`);
  const issue = rowToIssue(result.rows[0] as Record<string, unknown>);
  const clsResult = await classifyIssue(issue.title, issue.description);
  return { ...clsResult, issueId };
}

// ---------- assign ----------
export async function assignExistingIssue(
  issueId: string,
  department?: import('../schemas').Department
): Promise<AssignmentDecision> {
  const db = await ensureDb();
  const result = await db.execute({ sql: 'SELECT * FROM issues WHERE id = ?', args: [issueId] });
  if (result.rows.length === 0) throw new Error(`Issue ${issueId} not found`);
  const issue = rowToIssue(result.rows[0] as Record<string, unknown>);
  return assignIssue(issue, department);
}

// ---------- status update ----------
export async function updateIssueStatus(
  issueId: string,
  newStatus: IssueStatus,
  updatedBy: string = 'agent',
  note?: string
): Promise<StatusUpdate> {
  const db = await ensureDb();
  const result = await db.execute({ sql: 'SELECT * FROM issues WHERE id = ?', args: [issueId] });
  if (result.rows.length === 0) throw new Error(`Issue ${issueId} not found`);
  const issue = rowToIssue(result.rows[0] as Record<string, unknown>);

  if (!isValidTransition(issue.status, newStatus)) {
    const validTargets = VALID_TRANSITIONS[issue.status] || [];
    throw new Error(`Invalid transition: ${issue.status} → ${newStatus}. Valid targets: ${validTargets.join(', ')}`);
  }

  const now = new Date().toISOString();
  const update: StatusUpdate = {
    issueId,
    previousStatus: issue.status,
    newStatus,
    updatedBy,
    note,
    timestamp: now,
  };

  if (newStatus === 'resolved') {
    await db.execute({
      sql: `UPDATE issues SET status=?, updated_at=?, resolved_at=? WHERE id=?`,
      args: [newStatus, now, now, issueId],
    });
  } else if (newStatus === 'assigned') {
    await db.execute({
      sql: `UPDATE issues SET status=?, updated_at=?, assigned_to=COALESCE(assigned_to, ?) WHERE id=?`,
      args: [newStatus, now, issue.assignedTo || 'general', issueId],
    });
  } else {
    await db.execute({
      sql: `UPDATE issues SET status=?, updated_at=? WHERE id=?`,
      args: [newStatus, now, issueId],
    });
  }

  await db.execute({
    sql: `INSERT INTO status_history (id, issue_id, previous_status, new_status, updated_by, note, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [uuidv4(), issueId, issue.status, newStatus, updatedBy, note || null, now],
  });

  return update;
}

// ---------- list ----------
export async function listIssues(filters: {
  zone?: string;
  status?: string;
  type?: string;
  severity?: string;
  limit?: number;
  offset?: number;
}): Promise<{ issues: TownIssue[]; total: number }> {
  const db = await ensureDb();
  const conditions: string[] = [];
  const args: (string | number | null | boolean)[] = [];

  if (filters.zone) { conditions.push('zone = ?'); args.push(filters.zone); }
  if (filters.status) {
    if (filters.status === 'open') {
      // 'open' is a special filter that returns all non-resolved issues
      conditions.push("status != 'resolved'");
    } else {
      conditions.push('status = ?');
      args.push(filters.status);
    }
  }
  if (filters.type) { conditions.push('type = ?'); args.push(filters.type); }
  if (filters.severity) { conditions.push('severity = ?'); args.push(filters.severity); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = filters.limit || 20;
  const offset = filters.offset || 0;

  const countResult = await db.execute({ sql: `SELECT COUNT(*) as count FROM issues ${where}`, args: args as (string | number | null | boolean)[] });
  const total = Number(countResult.rows[0]?.count ?? 0);

  const rowsResult = await db.execute({
    sql: `SELECT * FROM issues ${where} ORDER BY priority_score DESC, created_at DESC LIMIT ? OFFSET ?`,
    args: [...args, limit, offset] as (string | number | null | boolean)[],
  });

  return { issues: rowsResult.rows.map(r => rowToIssue(r as Record<string, unknown>)), total };
}

// ---------- get single ----------
export async function getIssue(issueId: string): Promise<TownIssue> {
  const db = await ensureDb();
  const result = await db.execute({ sql: 'SELECT * FROM issues WHERE id = ?', args: [issueId] });
  if (result.rows.length === 0) throw new Error(`Issue ${issueId} not found`);
  return rowToIssue(result.rows[0] as Record<string, unknown>);
}

// ---------- zone priorities ----------
export async function getZonePriorities(): Promise<ZoneSummary[]> {
  const db = await ensureDb();
  const zones = ['downtown', 'northside', 'southside', 'eastend', 'westend', 'industrial', 'residential_north', 'residential_south', 'park_district', 'waterfront'] as const;

  const summaries: ZoneSummary[] = [];
  for (const zone of zones) {
    const result = await db.execute({
      sql: `SELECT * FROM issues WHERE zone = ? AND status != 'resolved' ORDER BY priority_score DESC`,
      args: [zone],
    });
    const issues = result.rows.map(r => rowToIssue(r as Record<string, unknown>));
    if (issues.length === 0) continue;
    const criticalCount = issues.filter(i => i.severity === 'critical').length;

    const typeCounts = issues.reduce((acc, i) => {
      acc[i.type] = (acc[i.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as import('../schemas').IssueType || 'pothole';

    summaries.push({
      zone,
      totalIssues: issues.length,
      openIssues: issues.length,
      criticalIssues: criticalCount,
      avgResponseTime: criticalCount > 0 ? '< 24 hours' : '< 3 days',
      topIssueType: topType,
      recentIssues: issues.slice(0, 5).map(i => ({
        id: i.id,
        title: i.title,
        type: i.type,
        severity: i.severity,
        status: i.status,
        createdAt: i.createdAt,
      })),
    });
  }
  return summaries;
}

// ---------- resident update ----------
export async function generateIssueResidentUpdate(
  issueId: string,
  newStatus: IssueStatus
): Promise<ResidentUpdate> {
  const issue = await getIssue(issueId);
  return generateResidentUpdate(issue, newStatus);
}

// ---------- issue summary ----------
export async function getIssueSummary(issueId: string): Promise<{
  issue: TownIssue;
  history: StatusUpdate[];
  timeOpen: string;
}> {
  const issue = await getIssue(issueId);
  const db = await ensureDb();
  const historyResult = await db.execute({
    sql: 'SELECT * FROM status_history WHERE issue_id = ? ORDER BY timestamp ASC',
    args: [issueId] as (string | number | null | boolean)[],
  });

  const history: StatusUpdate[] = historyResult.rows.map(r => ({
    issueId: r.issue_id as string,
    previousStatus: r.previous_status as IssueStatus,
    newStatus: r.new_status as IssueStatus,
    updatedBy: r.updated_by as string,
    note: r.note as string | undefined,
    timestamp: r.timestamp as string,
  }));

  const timeOpen = issue.resolvedAt
    ? `Resolved in ${Math.round((new Date(issue.resolvedAt).getTime() - new Date(issue.createdAt).getTime()) / 3600000)} hours`
    : `Open for ${Math.round((Date.now() - new Date(issue.createdAt).getTime()) / 3600000)} hours`;

  return { issue, history, timeOpen };
}

// ---------- zone summary ----------
export async function getZoneSummary(zone: import('../schemas').Zone): Promise<string> {
  const { issues } = await listIssues({ zone, limit: 50 });
  return generateZoneSummary(issues, zone);
}
