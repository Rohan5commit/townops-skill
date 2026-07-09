import { z } from 'zod';
import { nimJsonChat } from './nim';
import type { IssueType, Severity, Urgency, Department } from '../schemas';

const ClassificationResultSchema = z.object({
  type: z.enum([
    'water_leak', 'streetlight_outage', 'trash_overflow', 'pothole',
    'unsafe_crossing', 'park_maintenance', 'noise_complaint', 'graffiti',
    'broken_sidewalk', 'tree_hazard',
  ]),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  urgency: z.enum(['routine', 'soon', 'urgent', 'emergency']),
  suggestedDepartment: z.enum([
    'public_works', 'utilities', 'parks_rec', 'safety', 'sanitation',
    'transportation', 'code_enforcement', 'general',
  ]),
  recommendedSLA: z.string().max(100),
  summary: z.string().max(200),
  reasoning: z.string().max(500),
  confidence: z.number().min(0).max(1),
});

export type ClassificationResult = z.infer<typeof ClassificationResultSchema>;

const SYSTEM_PROMPT = `You are a municipal issue classifier for NANDA Town.
Given an issue title and description, classify it into structured fields.
Always respond with valid JSON matching the schema provided.
Be precise and consistent. Consider public safety implications carefully.`;

function buildClassifyPrompt(title: string, description: string): string {
  return `Classify this town issue:

Title: ${title}
Description: ${description}

Respond with JSON:
{
  "type": one of [water_leak, streetlight_outage, trash_overflow, pothole, unsafe_crossing, park_maintenance, noise_complaint, graffiti, broken_sidewalk, tree_hazard],
  "severity": one of [low, medium, high, critical] - consider public safety impact and affected population,
  "urgency": one of [routine, soon, urgent, emergency] - consider time sensitivity and risk of worsening,
  "suggestedDepartment": one of [public_works, utilities, parks_rec, safety, sanitation, transportation, code_enforcement, general],
  "recommendedSLA": "time estimate for resolution, e.g. '24 hours', '3 business days', '1 week'",
  "summary": "one sentence summary of the issue",
  "reasoning": "brief explanation of classification decisions",
  "confidence": number 0-1 indicating classification confidence
}`;
}

export async function classifyIssue(
  title: string,
  description: string
): Promise<ClassificationResult> {
  try {
    const { result } = await nimJsonChat(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildClassifyPrompt(title, description) },
      ],
      ClassificationResultSchema,
      { temperature: 0.2, max_tokens: 512 }
    );
    return result;
  } catch (error) {
    // Fallback: rule-based classification
    return fallbackClassify(title, description);
  }
}

function fallbackClassify(title: string, description: string): ClassificationResult {
  const combined = `${title} ${description}`.toLowerCase();

  let type: ClassificationResult['type'] = 'pothole';
  let department: ClassificationResult['suggestedDepartment'] = 'general';
  let severity: ClassificationResult['severity'] = 'medium';
  let urgency: ClassificationResult['urgency'] = 'soon';

  if (combined.includes('water') || combined.includes('leak') || combined.includes('flood') || combined.includes('drain')) {
    type = 'water_leak';
    department = 'utilities';
    severity = 'high';
    urgency = 'urgent';
  } else if (combined.includes('light') || combined.includes('streetlight') || combined.includes('lamp')) {
    type = 'streetlight_outage';
    department = 'public_works';
    severity = 'medium';
    urgency = 'soon';
  } else if (combined.includes('trash') || combined.includes('garbage') || combined.includes('overflow') || combined.includes('bin')) {
    type = 'trash_overflow';
    department = 'sanitation';
    severity = 'medium';
    urgency = 'soon';
  } else if (combined.includes('pothole') || combined.includes('road') || combined.includes('pavement')) {
    type = 'pothole';
    department = 'transportation';
    severity = 'high';
    urgency = 'urgent';
  } else if (combined.includes('crossing') || combined.includes('pedestrian') || combined.includes('crosswalk') || combined.includes('signal')) {
    type = 'unsafe_crossing';
    department = 'safety';
    severity = 'critical';
    urgency = 'emergency';
  } else if (combined.includes('park') || combined.includes('tree') || combined.includes('overgrown') || combined.includes('branch')) {
    type = 'park_maintenance';
    department = 'parks_rec';
    severity = 'medium';
    urgency = 'soon';
  } else if (combined.includes('graffiti') || combined.includes('vandal')) {
    type = 'graffiti';
    department = 'code_enforcement';
    severity = 'low';
    urgency = 'routine';
  } else if (combined.includes('sidewalk') || combined.includes('pavement crack')) {
    type = 'broken_sidewalk';
    department = 'public_works';
    severity = 'medium';
    urgency = 'soon';
  } else if (combined.includes('noise') || combined.includes('loud')) {
    type = 'noise_complaint';
    department = 'code_enforcement';
    severity = 'low';
    urgency = 'routine';
  }

  if (combined.includes('critical') || combined.includes('emergency') || combined.includes('danger') || combined.includes('hazard')) {
    severity = 'critical';
    urgency = 'emergency';
  }

  const slaMap: Record<string, string> = {
    critical: '4 hours',
    high: '24 hours',
    medium: '3 business days',
    low: '1 week',
  };

  return {
    type,
    severity,
    urgency,
    suggestedDepartment: department,
    recommendedSLA: slaMap[severity],
    summary: title.substring(0, 200),
    reasoning: 'Rule-based classification fallback (AI unavailable)',
    confidence: 0.6,
  };
}
