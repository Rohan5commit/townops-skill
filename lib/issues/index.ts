import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db';
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
  const db = getDb();
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

  db.prepare(`
    INSERT INTO issues (id, title, description, type, severity, urgency, status, zone, location, latitude, longitude, reported_by, assigned_to, priority_score, affected_residents, is_repeat, created_at, updated_at, resolved_at, tags)
    VALUES (@id, @title, @description, @type, @severity, @urgency, @status, @zone, @location, @latitude, @longitude, @reported_by, @assigned_to, @priority_score, @affected_residents, @is_repeat, @created_at, @updated_at, @resolved_at, @tags)
  `).run({
    ...issue,
    reported_by: issue.reportedBy,
    assigned_to: issue.assignedTo,
    priority_score: issue.priorityScore,
    affected_residents: issue.affectedResidents ?? 0,
    is_repeat: issue.isRepeat ? 1 : 0,
    created_at: issue.createdAt,
    updated_at: issue.updatedAt,
    resolved_at: issue.resolvedAt,
    tags: JSON.stringify(issue.tags),
  });

  // Log creation
  db.prepare(`INSERT INTO status_history (id, issue_id, previous_status, new_status, updated_by, note, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    uuidv4(), id, 'reported', 'reported', input.reportedBy || 'agent', 'Issue created', now
  );

  // Auto-classify
  const rawClassification = await classifyIssue(input.title, input.description);
  const classification: IssueClassification = { ...rawClassification, issueId: id };
  const updatedIssue = { ...issue, severity: classification.severity, urgency: classification.urgency };
  const priority = computePriority(updatedIssue);

  // Update issue with classification results
  db.prepare(`
    UPDATE issues SET severity=@severity, urgency=@urgency, priority_score=@priorityScore, updated_at=@updatedAt WHERE id=@id
  `).run({
    id,
    severity: classification.severity,
    urgency: classification.urgency,
    priorityScore: priority.score,
    updatedAt: new Date().toISOString(),
  });

  return {
    issue: { ...updatedIssue, priorityScore: priority.score },
    classification,
    priority,
  };
}

// ---------- classify ----------
export async function classifyExistingIssue(issueId: string): Promise<IssueClassification> {
  const db = getDb();
  const row = db.prepare('SELECT * FROM issues WHERE id = ?').get(issueId) as Record<string, unknown> | undefined;
  if (!row) throw new Error(`Issue ${issueId} not found`);
  const issue = rowToIssue(row);
  const result = await classifyIssue(issue.title, issue.description);
  return { ...result, issueId };
}

// ---------- assign ----------
export async function assignExistingIssue(
  issueId: string,
  department?: import('../schemas').Department
): Promise<AssignmentDecision> {
  const db = getDb();
  const row = db.prepare('SELECT * FROM issues WHERE id = ?').get(issueId) as Record<string, unknown> | undefined;
  if (!row) throw new Error(`Issue ${issueId} not found`);
  const issue = rowToIssue(row);
  return assignIssue(issue, department);
}

// ---------- status update ----------
export function updateIssueStatus(
  issueId: string,
  newStatus: IssueStatus,
  updatedBy: string = 'agent',
  note?: string
): StatusUpdate {
  const db = getDb();
  const row = db.prepare('SELECT * FROM issues WHERE id = ?').get(issueId) as Record<string, unknown> | undefined;
  if (!row) throw new Error(`Issue ${issueId} not found`);
  const issue = rowToIssue(row);

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

  const setFields: string[] = ['status = @newStatus', 'updated_at = @updatedAt'];
  if (newStatus === 'resolved') setFields.push('resolved_at = @resolvedAt');
  if (newStatus === 'assigned') setFields.push('assigned_to = COALESCE(assigned_to, @assignedTo)');

  db.prepare(`UPDATE issues SET ${setFields.join(', ')} WHERE id = @id`).run({
    id: issueId,
    newStatus,
    updatedAt: now,
    resolvedAt: newStatus === 'resolved' ? now : null,
    assignedTo: issue.assignedTo || 'general',
  });

  db.prepare(`INSERT INTO status_history (id, issue_id, previous_status, new_status, updated_by, note, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    uuidv4(), issueId, issue.status, newStatus, updatedBy, note || null, now
  );

  return update;
}

// ---------- list ----------
export function listIssues(filters: {
  zone?: string;
  status?: string;
  type?: string;
  severity?: string;
  limit?: number;
  offset?: number;
}): { issues: TownIssue[]; total: number } {
  const db = getDb();
  const conditions: string[] = [];
  const params: Record<string, unknown> = {
    limit: filters.limit || 20,
    offset: filters.offset || 0,
  };

  if (filters.zone) { conditions.push('zone = @zone'); params.zone = filters.zone; }
  if (filters.status) { conditions.push('status = @status'); params.status = filters.status; }
  if (filters.type) { conditions.push('type = @type'); params.type = filters.type; }
  if (filters.severity) { conditions.push('severity = @severity'); params.severity = filters.severity; }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const total = (db.prepare(`SELECT COUNT(*) as count FROM issues ${where}`).get(params) as { count: number }).count;
  const rows = db.prepare(`SELECT * FROM issues ${where} ORDER BY priority_score DESC, created_at DESC LIMIT @limit OFFSET @offset`).all(params) as Record<string, unknown>[];

  return { issues: rows.map(rowToIssue), total };
}

// ---------- get single ----------
export function getIssue(issueId: string): TownIssue {
  const db = getDb();
  const row = db.prepare('SELECT * FROM issues WHERE id = ?').get(issueId) as Record<string, unknown> | undefined;
  if (!row) throw new Error(`Issue ${issueId} not found`);
  return rowToIssue(row);
}

// ---------- zone priorities ----------
export function getZonePriorities(): ZoneSummary[] {
  const db = getDb();
  const zones = ['downtown', 'northside', 'southside', 'eastend', 'westend', 'industrial', 'residential_north', 'residential_south', 'park_district', 'waterfront'] as const;

  return zones.map(zone => {
    const rows = db.prepare(`SELECT * FROM issues WHERE zone = ? AND status != 'resolved' ORDER BY priority_score DESC`).all(zone) as Record<string, unknown>[];
    const issues = rows.map(rowToIssue);
    const criticalCount = issues.filter(i => i.severity === 'critical').length;

    const typeCounts = issues.reduce((acc, i) => {
      acc[i.type] = (acc[i.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as import('../schemas').IssueType || 'pothole';

    return {
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
    };
  }).filter(z => z.totalIssues > 0);
}

// ---------- resident update ----------
export async function generateIssueResidentUpdate(
  issueId: string,
  newStatus: IssueStatus
): Promise<ResidentUpdate> {
  const issue = getIssue(issueId);
  return generateResidentUpdate(issue, newStatus);
}

// ---------- issue summary ----------
export function getIssueSummary(issueId: string): {
  issue: TownIssue;
  history: StatusUpdate[];
  timeOpen: string;
} {
  const issue = getIssue(issueId);
  const db = getDb();
  const historyRows = db.prepare('SELECT * FROM status_history WHERE issue_id = ? ORDER BY timestamp ASC').all(issueId) as Record<string, unknown>[];

  const history: StatusUpdate[] = historyRows.map(r => ({
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
  const { issues } = listIssues({ zone, limit: 50 });
  return generateZoneSummary(issues, zone);
}
