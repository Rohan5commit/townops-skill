import { NextRequest, NextResponse } from 'next/server';
import { getIssueSummary } from '@/lib/issues';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = getIssueSummary(id);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Get issue error:', error);
    return NextResponse.json(
      { error: 'Issue not found', message: (error as Error).message },
      { status: 404 }
    );
  }
}
