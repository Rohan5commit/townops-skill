import { NextRequest, NextResponse } from 'next/server';
import { getZoneSummary } from '@/lib/issues';
import { Zone } from '@/lib/schemas';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const zone = searchParams.get('zone');

    if (!zone) {
      return NextResponse.json(
        { error: 'Missing required parameter: zone' },
        { status: 400 }
      );
    }

    const summary = await getZoneSummary(zone as Zone);

    return NextResponse.json({
      success: true,
      zone,
      summary,
    });
  } catch (error) {
    console.error('Zone summary error:', error);
    return NextResponse.json(
      { error: 'Failed to get zone summary', message: (error as Error).message },
      { status: 500 }
    );
  }
}
