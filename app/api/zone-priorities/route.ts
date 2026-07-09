import { NextRequest, NextResponse } from 'next/server';
import { getZonePriorities } from '@/lib/issues';

export async function GET(request: NextRequest) {
  try {
    const priorities = await getZonePriorities();

    return NextResponse.json({
      success: true,
      zones: priorities,
      summary: {
        totalZones: priorities.length,
        totalOpenIssues: priorities.reduce((sum, z) => sum + z.openIssues, 0),
        totalCriticalIssues: priorities.reduce((sum, z) => sum + z.criticalIssues, 0),
      },
    });
  } catch (error) {
    console.error('Zone priorities error:', error);
    return NextResponse.json(
      { error: 'Failed to get zone priorities', message: (error as Error).message },
      { status: 500 }
    );
  }
}
