import { cleanupExpiredSessions, generateSessionCode, mediaSessions } from '@/lib/media-session-storage';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/media-session-temp - Create a temporary media session
export async function POST(req: NextRequest) {
  try {
    const { mediaUrls } = await req.json();

    if (!mediaUrls || !Array.isArray(mediaUrls) || mediaUrls.length === 0) {
      return NextResponse.json({ error: 'mediaUrls array is required' }, { status: 400 });
    }

    // Filter out empty URLs
    const validUrls = mediaUrls.filter(url => url && url.trim() !== '');
    
    if (validUrls.length === 0) {
      return NextResponse.json({ error: 'No valid media URLs found' }, { status: 404 });
    }

    // Clean up expired sessions first
    cleanupExpiredSessions();

    // Generate session code
    const sessionCode = generateSessionCode();
    
    // Create media session with 72 hour expiration
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 72);

    const mediaSession = {
      id: sessionCode,
      sessionCode,
      mediaUrls: validUrls,
      createdAt: new Date(),
      expiresAt
    };

    // Store in shared storage
    mediaSessions.set(sessionCode, mediaSession);
    
    console.log(`Created session ${sessionCode} with ${validUrls.length} media URLs`);
    console.log('Current sessions:', Array.from(mediaSessions.keys()));

    return NextResponse.json(mediaSession, { status: 201 });
  } catch (error) {
    console.error('Error creating media session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// GET /api/media-session-temp/[code] - Get media session by code
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.pathname.split('/').pop();

    if (!code) {
      return NextResponse.json({ error: 'Session code is required' }, { status: 400 });
    }

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
