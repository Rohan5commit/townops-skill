import type { TownIssue, PriorityScore } from '../schemas';

const WEIGHTS = {
  severity: 0.30,
  urgency: 0.25,
  publicSafety: 0.15,
  affectedResidents: 0.15,
  isRepeat: 0.10,
  issueType: 0.05,
};

const SEVERITY_SCORES: Record<string, number> = {
  low: 25,
  medium: 50,
  high: 75,
  critical: 100,
};

const URGENCY_SCORES: Record<string, number> = {
  routine: 25,
  soon: 50,
  urgent: 75,
  emergency: 100,
};

const SAFETY_CRITICAL_TYPES = new Set([
  'unsafe_crossing', 'water_leak', 'tree_hazard', 'pothole',
]);

const SAFETY_HIGH_TYPES = new Set([
  'streetlight_outage', 'broken_sidewalk',
]);

function publicSafetyScore(issue: TownIssue): number {
  if (SAFETY_CRITICAL_TYPES.has(issue.type)) return 90;
  if (SAFETY_HIGH_TYPES.has(issue.type)) return 65;
  return 35;
}

function affectedScore(affectedResidents: number): number {
  if (affectedResidents >= 200) return 100;
  if (affectedResidents >= 100) return 80;
  if (affectedResidents >= 50) return 60;
  if (affectedResidents >= 20) return 40;
  if (affectedResidents >= 5) return 25;
  return 10;
}

function issueTypeScore(type: TownIssue['type']): number {
  const highTypes = new Set(['unsafe_crossing', 'water_leak', 'tree_hazard']);
  const medTypes = new Set(['pothole', 'streetlight_outage', 'broken_sidewalk']);
  if (highTypes.has(type)) return 90;
  if (medTypes.has(type)) return 60;
  return 35;
}

export function computePriority(issue: TownIssue): PriorityScore {
  const factors = [
    {
      name: 'severity',
      weight: WEIGHTS.severity,
      value: SEVERITY_SCORES[issue.severity] || 50,
      description: `Issue severity: ${issue.severity}`,
    },
    {
      name: 'urgency',
      weight: WEIGHTS.urgency,
      value: URGENCY_SCORES[issue.urgency] || 50,
      description: `Time sensitivity: ${issue.urgency}`,
    },
    {
      name: 'publicSafety',
      weight: WEIGHTS.publicSafety,
      value: publicSafetyScore(issue),
      description: SAFETY_CRITICAL_TYPES.has(issue.type)
        ? 'Direct public safety impact'
        : SAFETY_HIGH_TYPES.has(issue.type)
          ? 'Indirect safety impact'
          : 'Limited safety impact',
    },
    {
      name: 'affectedResidents',
      weight: WEIGHTS.affectedResidents,
      value: affectedScore(issue.affectedResidents || 0),
      description: `Affects approximately ${issue.affectedResidents || 0} residents`,
    },
    {
      name: 'isRepeat',
      weight: WEIGHTS.isRepeat,
      value: issue.isRepeat ? 100 : 20,
      description: issue.isRepeat ? 'Repeat issue - higher priority' : 'First report',
    },
    {
      name: 'issueType',
      weight: WEIGHTS.issueType,
      value: issueTypeScore(issue.type),
      description: `Issue type: ${issue.type.replace(/_/g, ' ')}`,
    },
  ];

  const rawScore = factors.reduce((sum, f) => sum + f.value * f.weight, 0);
  const score = Math.round(Math.min(100, Math.max(0, rawScore)));

  let recommendedPriority: TownIssue['severity'];
  if (score >= 80) recommendedPriority = 'critical';
  else if (score >= 60) recommendedPriority = 'high';
  else if (score >= 35) recommendedPriority = 'medium';
  else recommendedPriority = 'low';

  const explanation = `Priority score ${score}/100 based on: severity (${issue.severity}), urgency (${issue.urgency}), public safety impact, ${issue.affectedResidents || 0} affected residents${issue.isRepeat ? ', repeat issue' : ''}.`;

  return {
    issueId: issue.id,
    score,
    factors,
    explanation,
    recommendedPriority,
  };
}
