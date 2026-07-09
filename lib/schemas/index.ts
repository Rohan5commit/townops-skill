import { z } from 'zod';

// Issue Types
export const IssueType = z.enum([
  'water_leak',
  'streetlight_outage',
  'trash_overflow',
  'pothole',
  'unsafe_crossing',
  'park_maintenance',
  'noise_complaint',
  'graffiti',
  'broken_sidewalk',
  'tree_hazard',
]);
export type IssueType = z.infer<typeof IssueType>;

// Severity Levels
export const Severity = z.enum(['low', 'medium', 'high', 'critical']);
export type Severity = z.infer<typeof Severity>;

// Urgency Levels
export const Urgency = z.enum(['routine', 'soon', 'urgent', 'emergency']);
export type Urgency = z.infer<typeof Urgency>;

// Issue Status
export const IssueStatus = z.enum([
  'reported',
  'triaged',
  'assigned',
  'in_progress',
  'resolved',
  'blocked',
]);
export type IssueStatus = z.infer<typeof IssueStatus>;

// Zones in NANDA Town
export const Zone = z.enum([
  'downtown',
  'northside',
  'southside',
  'eastend',
  'westend',
  'industrial',
  'residential_north',
  'residential_south',
  'park_district',
  'waterfront',
]);
export type Zone = z.infer<typeof Zone>;

// Departments
export const Department = z.enum([
  'public_works',
  'utilities',
  'parks_rec',
  'safety',
  'sanitation',
  'transportation',
  'code_enforcement',
  'general',
]);
export type Department = z.infer<typeof Department>;

// Core Issue Schema
export const TownIssueSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
  type: IssueType,
  severity: Severity,
  urgency: Urgency,
  status: IssueStatus,
  zone: Zone,
  location: z.string().min(3).max(300),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  reportedBy: z.string(),
  assignedTo: Department.nullable(),
  priorityScore: z.number().min(0).max(100),
  affectedResidents: z.number().min(0).optional(),
  isRepeat: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  resolvedAt: z.string().datetime().nullable(),
  tags: z.array(z.string()).default([]),
});
export type TownIssue = z.infer<typeof TownIssueSchema>;

// Issue Classification
export const IssueClassificationSchema = z.object({
  issueId: z.string().uuid(),
  type: IssueType,
  severity: Severity,
  urgency: Urgency,
  suggestedDepartment: Department,
  recommendedSLA: z.string(),
  summary: z.string().max(200),
  reasoning: z.string().max(500),
  confidence: z.number().min(0).max(1),
});
export type IssueClassification = z.infer<typeof IssueClassificationSchema>;

// Priority Score
export const PriorityScoreSchema = z.object({
  issueId: z.string().uuid(),
  score: z.number().min(0).max(100),
  factors: z.array(z.object({
    name: z.string(),
    weight: z.number(),
    value: z.number(),
    description: z.string(),
  })),
  explanation: z.string().max(500),
  recommendedPriority: Severity,
});
export type PriorityScore = z.infer<typeof PriorityScoreSchema>;

// Assignment Decision
export const AssignmentDecisionSchema = z.object({
  issueId: z.string().uuid(),
  department: Department,
  reason: z.string().max(300),
  estimatedResponseTime: z.string(),
  slaDeadline: z.string().datetime(),
  escalationPath: z.array(z.string()),
});
export type AssignmentDecision = z.infer<typeof AssignmentDecisionSchema>;

// Status Update
export const StatusUpdateSchema = z.object({
  issueId: z.string().uuid(),
  previousStatus: IssueStatus,
  newStatus: IssueStatus,
  updatedBy: z.string(),
  note: z.string().max(500).optional(),
  timestamp: z.string().datetime(),
});
export type StatusUpdate = z.infer<typeof StatusUpdateSchema>;

// Zone Summary
export const ZoneSummarySchema = z.object({
  zone: Zone,
  totalIssues: z.number(),
  openIssues: z.number(),
  criticalIssues: z.number(),
  avgResponseTime: z.string(),
  topIssueType: IssueType,
  recentIssues: z.array(TownIssueSchema.pick({
    id: true,
    title: true,
    type: true,
    severity: true,
    status: true,
    createdAt: true,
  })),
});
export type ZoneSummary = z.infer<typeof ZoneSummarySchema>;

// Resident Update
export const ResidentUpdateSchema = z.object({
  issueId: z.string().uuid(),
  message: z.string().max(500),
  status: IssueStatus,
  nextStep: z.string().max(200),
  estimatedResolution: z.string().max(200).optional(),
  generatedAt: z.string().datetime(),
});
export type ResidentUpdate = z.infer<typeof ResidentUpdateSchema>;

// Agent Action Log
export const AgentActionLogSchema = z.object({
  id: z.string().uuid(),
  action: z.string(),
  issueId: z.string().uuid().optional(),
  agentId: z.string(),
  input: z.record(z.string(), z.unknown()),
  output: z.record(z.string(), z.unknown()),
  success: z.boolean(),
  error: z.string().optional(),
  timestamp: z.string().datetime(),
});
export type AgentActionLog = z.infer<typeof AgentActionLogSchema>;

// API Request Schemas
export const CreateIssueRequestSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
  type: IssueType,
  zone: Zone,
  location: z.string().min(3).max(300),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  reportedBy: z.string().default('agent'),
  affectedResidents: z.number().min(0).optional(),
  tags: z.array(z.string()).default([]),
});

export const ClassifyIssueRequestSchema = z.object({
  issueId: z.string().uuid(),
});

export const AssignIssueRequestSchema = z.object({
  issueId: z.string().uuid(),
  department: Department.optional(),
});

export const UpdateStatusRequestSchema = z.object({
  issueId: z.string().uuid(),
  status: IssueStatus,
  updatedBy: z.string().default('agent'),
  note: z.string().max(500).optional(),
});

export const ListIssuesRequestSchema = z.object({
  zone: Zone.optional(),
  status: IssueStatus.optional(),
  type: IssueType.optional(),
  severity: Severity.optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export const ZonePrioritiesRequestSchema = z.object({
  zone: Zone.optional(),
});

// Valid state transitions
export const VALID_TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
  reported: ['triaged', 'blocked'],
  triaged: ['assigned', 'blocked'],
  assigned: ['in_progress', 'blocked'],
  in_progress: ['resolved', 'blocked'],
  resolved: [],
  blocked: ['reported', 'triaged', 'assigned', 'in_progress'],
};

export function isValidTransition(from: IssueStatus, to: IssueStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to as IssueStatus) ?? false;
}
