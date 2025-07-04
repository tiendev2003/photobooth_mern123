import { cleanupExpiredSessions, mediaSessions } from '@/lib/media-session-storage';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/media-session-temp/[code] - Get media session by code
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    if (!code) {
      return NextResponse.json({ error: 'Session code is required' }, { status: 400 });
    }

    // Clean up expired sessions first
    cleanupExpiredSessions();

    console.log(`Looking for session ${code}`);
    console.log('Available sessions:', Array.from(mediaSessions.keys()));

    const mediaSession = mediaSessions.get(code);

    if (!mediaSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if session has expired
    if (new Date() > mediaSession.expiresAt) {
      mediaSessions.delete(code);
      return NextResponse.json({ error: 'Session has expired' }, { status: 410 });
    }

    return NextResponse.json(mediaSession, { status: 200 });
  } catch (error) {
    console.error('Error fetching media session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
