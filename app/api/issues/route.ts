import { NextRequest, NextResponse } from 'next/server';
import { createIssue, listIssues } from '@/lib/issues';
import { CreateIssueRequestSchema, ListIssuesRequestSchema } from '@/lib/schemas';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateIssueRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await createIssue(parsed.data);

    return NextResponse.json({
      success: true,
      issue: result.issue,
      classification: result.classification,
      priority: result.priority,
      nextAction: determineNextAction(result.issue),
    });
  } catch (error) {
    console.error('Create issue error:', error);
    return NextResponse.json(
      { error: 'Failed to create issue', message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => { params[key] = value; });

    const parsed = ListIssuesRequestSchema.safeParse({
      zone: params.zone,
      status: params.status,
      type: params.type,
      severity: params.severity,
      limit: params.limit ? Number(params.limit) : 20,
      offset: params.offset ? Number(params.offset) : 0,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = listIssues(parsed.data);

    return NextResponse.json({
      success: true,
      issues: result.issues,
      total: result.total,
      hasMore: (parsed.data.offset + parsed.data.limit) < result.total,
    });
  } catch (error) {
    console.error('List issues error:', error);
    return NextResponse.json(
      { error: 'Failed to list issues', message: (error as Error).message },
      { status: 500 }
    );
  }
}

function determineNextAction(issue: { status: string; severity: string; assignedTo: string | null }): string {
  if (issue.status === 'reported') return 'triage';
  if (issue.status === 'triaged') return 'assign';
  if (issue.status === 'assigned') return 'start_work';
  if (issue.status === 'in_progress') return 'resolve';
  return 'monitor';
}
