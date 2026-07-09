import { NextRequest, NextResponse } from 'next/server';
import { updateIssueStatus } from '@/lib/issues';
import { UpdateStatusRequestSchema } from '@/lib/schemas';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = UpdateStatusRequestSchema.safeParse({ issueId: id, ...body });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const update = updateIssueStatus(
      id,
      parsed.data.status,
      parsed.data.updatedBy,
      parsed.data.note
    );

    return NextResponse.json({
      success: true,
      update,
    });
  } catch (error) {
    console.error('Update status error:', error);
    return NextResponse.json(
      { error: 'Status update failed', message: 'An internal error occurred. Please try again.' },
      { status: 400 }
    );
  }
}
