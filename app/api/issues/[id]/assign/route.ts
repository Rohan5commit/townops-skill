import { NextRequest, NextResponse } from 'next/server';
import { assignExistingIssue } from '@/lib/issues';
import { AssignIssueRequestSchema } from '@/lib/schemas';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = AssignIssueRequestSchema.safeParse({ issueId: id, ...body });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const decision = await assignExistingIssue(id, parsed.data.department);

    return NextResponse.json({
      success: true,
      assignment: decision,
    });
  } catch (error) {
    console.error('Assign issue error:', error);
    return NextResponse.json(
      { error: 'Assignment failed', message: (error as Error).message },
      { status: 500 }
    );
  }
}
