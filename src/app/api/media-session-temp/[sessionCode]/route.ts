import { cleanupExpiredSessions, mediaSessions } from '@/lib/media-session-storage';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/media-session-temp/[sessionCode] - Get media session by code
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionCode: string }> }
) {
  try {
    const { sessionCode } = await params;

    if (!sessionCode) {
      return NextResponse.json({ error: 'Session code is required' }, { status: 400 });
    }

    // Clean up expired sessions first
    cleanupExpiredSessions();

    console.log(`Looking for session ${sessionCode}`);
    console.log('Available sessions:', Array.from(mediaSessions.keys()));

    const mediaSession = mediaSessions.get(sessionCode);

    if (!mediaSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if session has expired
    if (new Date() > mediaSession.expiresAt) {
      mediaSessions.delete(sessionCode);
      return NextResponse.json({ error: 'Session has expired' }, { status: 410 });
    }

    return NextResponse.json(mediaSession, { status: 200 });
  } catch (error) {
    console.error('Error fetching media session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
