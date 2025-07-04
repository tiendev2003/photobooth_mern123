import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/media-session/[code] - Get media session by code
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    const mediaSession = await prisma.mediaSession.findUnique({
      where: { sessionCode: code },
      include: {
        images: true
      }
    });

    if (!mediaSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if session has expired
    if (new Date() > mediaSession.expiresAt) {
      return NextResponse.json({ error: 'Session has expired' }, { status: 410 });
    }

    return NextResponse.json(mediaSession, { status: 200 });
  } catch (error) {
    console.error('Error fetching media session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
