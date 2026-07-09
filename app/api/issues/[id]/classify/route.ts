import { NextRequest, NextResponse } from 'next/server';
import { classifyExistingIssue } from '@/lib/issues';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const classification = await classifyExistingIssue(id);

    return NextResponse.json({
      success: true,
      classification,
    });
  } catch (error) {
    console.error('Classify issue error:', error);
    return NextResponse.json(
      { error: 'Classification failed', message: (error as Error).message },
      { status: 500 }
    );
  }
}
