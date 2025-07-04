import { mediaSessions } from '@/lib/media-session-storage';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/media-session-temp/debug - Debug endpoint to check sessions
export async function GET(req: NextRequest) {
  try {
    console.log('Debug endpoint called for media sessions',req.json());
    const sessions = Array.from(mediaSessions.entries()).map(([code, session]) => ({
      code,
      mediaCount: session.mediaUrls.length,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt
    }));

    return NextResponse.json({
      totalSessions: mediaSessions.size,
      sessions
    }, { status: 200 });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
