import { NextRequest, NextResponse } from 'next/server';
import { generateIssueResidentUpdate } from '@/lib/issues';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.status) {
      return NextResponse.json(
        { error: 'Missing required field: status' },
        { status: 400 }
      );
    }

    const update = await generateIssueResidentUpdate(id, body.status);

    return NextResponse.json({
      success: true,
      residentUpdate: update,
    });
  } catch (error) {
    console.error('Resident update error:', error);
    return NextResponse.json(
      { error: 'Failed to generate resident update', message: 'An internal error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
