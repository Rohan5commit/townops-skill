import type { TownIssue, AssignmentDecision, Department } from '../schemas';

const DEPARTMENT_ISSUE_MAP: Record<string, Department[]> = {
  water_leak: ['utilities', 'public_works'],
  streetlight_outage: ['public_works', 'transportation'],
  trash_overflow: ['sanitation', 'parks_rec'],
  pothole: ['transportation', 'public_works'],
  unsafe_crossing: ['safety', 'transportation'],
  park_maintenance: ['parks_rec', 'code_enforcement'],
  noise_complaint: ['code_enforcement', 'safety'],
  graffiti: ['code_enforcement', 'parks_rec'],
  broken_sidewalk: ['public_works', 'transportation'],
  tree_hazard: ['parks_rec', 'utilities'],
};

const DEPARTMENT_RESPONSE_TIMES: Record<Department, string> = {
  public_works: '24-48 hours',
  utilities: '4-12 hours',
  parks_rec: '2-3 business days',
  safety: '2-4 hours',
  sanitation: '1-2 business days',
  transportation: '24-48 hours',
  code_enforcement: '3-5 business days',
  general: '2-3 business days',
};

const SLA_HOURS: Record<string, number> = {
  emergency: 4,
  urgent: 24,
  soon: 72,
  routine: 168,
};

export function assignIssue(
  issue: TownIssue,
  preferredDepartment?: Department
): AssignmentDecision {
  const department = preferredDepartment || selectDepartment(issue);

  if (!preferredDepartment && issue.assignedTo) {
    // Already assigned, keep current department
    return buildDecision(issue, issue.assignedTo);
  }

  return buildDecision(issue, department || 'general');
}

function selectDepartment(issue: TownIssue): Department | null {
  const candidates = DEPARTMENT_ISSUE_MAP[issue.type] || ['general'];

  // For critical/urgent issues, prefer the first candidate (usually faster response)
  if (issue.severity === 'critical' || issue.urgency === 'emergency') {
    return candidates[0];
  }

  // Check safety impact - route to safety department
  if (issue.type === 'unsafe_crossing' || issue.type === 'tree_hazard') {
    return 'safety';
  }

  return candidates[0];
}

function buildDecision(issue: TownIssue, department: Department): AssignmentDecision {
  const slaHours = SLA_HOURS[issue.urgency] || 72;
  const slaDeadline = new Date(Date.now() + slaHours * 3600000).toISOString();

  const escalationPath: string[] = [];
  if (issue.severity === 'critical') {
    escalationPath.push('Shift Supervisor', 'Department Head', 'Town Manager');
  } else if (issue.severity === 'high') {
    escalationPath.push('Shift Supervisor', 'Department Head');
  } else {
    escalationPath.push('Shift Supervisor');
  }

  return {
    issueId: issue.id,
    department,
    reason: `Based on issue type (${issue.type.replace(/_/g, ' ')}), severity (${issue.severity}), and department expertise.`,
    estimatedResponseTime: DEPARTMENT_RESPONSE_TIMES[department] || '2-3 business days',
    slaDeadline,
    escalationPath,
  };
}
