import { z } from 'zod';
import { nimJsonChat } from './nim';
import type { TownIssue, Zone } from '../schemas';

const SummaryResultSchema = z.object({
  overview: z.string().max(300),
  criticalCount: z.number(),
  topPriorities: z.array(z.string()),
  trends: z.string().max(300),
});

export async function generateZoneSummary(
  issues: TownIssue[],
  zone: Zone
): Promise<string> {
  const openIssues = issues.filter(i => i.status !== 'resolved');
  const criticalIssues = openIssues.filter(i => i.severity === 'critical' || i.severity === 'high');

  const issuesText = openIssues
    .slice(0, 15)
    .map(i => `- [${i.severity.toUpperCase()}] ${i.title} (Status: ${i.status}, Type: ${i.type.replace(/_/g, ' ')})`)
    .join('\n');

  try {
    const { result } = await nimJsonChat(
      [
        {
          role: 'system',
          content: 'You are a municipal operations analyst for NANDA Town. Generate concise, actionable summaries of town issues by zone. Focus on what needs attention and why.',
        },
        {
          role: 'user',
          content: `Generate a zone summary for ${zone.replace(/_/g, ' ')} zone in NANDA Town.

Total open issues: ${openIssues.length}
Critical/high issues: ${criticalIssues.length}
Issue breakdown: ${JSON.stringify(
            openIssues.reduce((acc, i) => {
              acc[i.type] = (acc[i.type] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          )}

Issues:
${issuesText || 'No open issues'}

Respond with JSON:
{
  "overview": "2-3 sentence overview of the zone's current state",
  "criticalCount": number of critical issues,
  "topPriorities": ["list", "of", "top 3 priorities"],
  "trends": "1-2 sentences about trends or patterns"
}`,
        },
      ],
      SummaryResultSchema,
      { temperature: 0.3, max_tokens: 400 }
    );

    return `**${zone.replace(/_/g, ' ')} Zone Summary**\n\n${result.overview}\n\n**Top Priorities:**\n${result.topPriorities.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n**Trends:** ${result.trends}`;
  } catch {
    // Fallback
    return `**${zone.replace(/_/g, ' ')} Zone Summary**\n\nTotal open issues: ${openIssues.length}. Critical issues: ${criticalIssues.length}. Most common issue type: ${openIssues[0]?.type?.replace(/_/g, ' ') || 'N/A'}.`;
  }
}
