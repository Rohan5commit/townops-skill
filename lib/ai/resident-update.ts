import { z } from 'zod';
import { nimJsonChat } from './nim';
import type { TownIssue, ResidentUpdate, IssueStatus } from '../schemas';

const UpdateResultSchema = z.object({
  message: z.string().max(500),
  nextStep: z.string().max(200),
  estimatedResolution: z.string().max(200).optional(),
});

const SYSTEM_PROMPT = `You are a public communications assistant for NANDA Town municipal services.
Generate clear, concise, and reassuring resident-facing updates about town issues.
Use plain language. Be honest about status. Never make promises about specific times unless you have concrete data.
Keep updates under 200 words.`;

function buildUpdatePrompt(issue: TownIssue, newStatus: IssueStatus): string {
  return `Generate a resident-facing update for this town issue:

Issue: ${issue.title}
Description: ${issue.description}
Type: ${issue.type.replace(/_/g, ' ')}
Zone: ${issue.zone.replace(/_/g, ' ')}
Location: ${issue.location}
Current Status: ${issue.status} → New Status: ${newStatus}
Assigned Department: ${issue.assignedTo || 'Not yet assigned'}
Severity: ${issue.severity}

Respond with JSON:
{
  "message": "Short resident-facing update (2-3 sentences). Be reassuring and factual.",
  "nextStep": "What happens next with this issue (1 sentence)",
  "estimatedResolution": "Estimated timeline if known, otherwise null"
}`;
}

export async function generateResidentUpdate(
  issue: TownIssue,
  newStatus: IssueStatus
): Promise<ResidentUpdate> {
  try {
    const { result } = await nimJsonChat(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUpdatePrompt(issue, newStatus) },
      ],
      UpdateResultSchema,
      { temperature: 0.4, max_tokens: 300 }
    );

    return {
      issueId: issue.id,
      message: result.message,
      status: newStatus,
      nextStep: result.nextStep,
      estimatedResolution: result.estimatedResolution,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    return fallbackResidentUpdate(issue, newStatus);
  }
}

function fallbackResidentUpdate(issue: TownIssue, newStatus: IssueStatus): ResidentUpdate {
  const statusMessages: Record<IssueStatus, string> = {
    reported: `Your report about "${issue.title}" has been received and is being reviewed by our team.`,
    triaged: `The issue "${issue.title}" has been assessed and categorized. Our team is determining the appropriate response.`,
    assigned: `The issue "${issue.title}" has been assigned to the ${issue.assignedTo?.replace(/_/g, ' ') || 'appropriate'} department for action.`,
    in_progress: `Work is underway to address "${issue.title}". Our team is actively working on a resolution.`,
    resolved: `The issue "${issue.title}" has been resolved. Thank you for your report and patience.`,
    blocked: `The issue "${issue.title}" is currently blocked. We are working to resolve the blocking issue and will provide an update soon.`,
  };

  const nextSteps: Record<IssueStatus, string> = {
    reported: 'Our team will review and classify this issue within 24 hours.',
    triaged: 'An appropriate department will be assigned to handle this issue.',
    assigned: 'The assigned department will begin work according to their response schedule.',
    in_progress: 'Our team is actively working on a resolution. We will update you when complete.',
    resolved: 'No further action needed. Thank you for helping keep NANDA Town safe.',
    blocked: 'We are working to remove the blocking factor and will resume progress shortly.',
  };

  return {
    issueId: issue.id,
    message: statusMessages[newStatus],
    status: newStatus,
    nextStep: nextSteps[newStatus],
    generatedAt: new Date().toISOString(),
  };
}
