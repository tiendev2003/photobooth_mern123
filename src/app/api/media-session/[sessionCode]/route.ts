import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/media-session/[sessionCode] - Lấy thông tin session
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionCode: string }> }
) {
  try {
    const { sessionCode } = await params;

    if (!sessionCode) {
      return NextResponse.json({ error: 'Session code is required' }, { status: 400 });
    }

    console.log(`Looking for session: ${sessionCode}`);

    // Tìm session trong database
    const session = await prisma.mediaSession.findUnique({
      where: { sessionCode }
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Kiểm tra hết hạn
    if (new Date() > session.expiresAt) {
      // Cập nhật status thành EXPIRED
      await prisma.mediaSession.update({
        where: { sessionCode },
        data: { status: 'EXPIRED' }
      });
      return NextResponse.json({ error: 'Session has expired' }, { status: 410 });
    }

    return NextResponse.json(session, { status: 200 });

  } catch (error) {
    console.error('Error fetching media session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
