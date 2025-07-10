import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/media-session - Tạo session mới
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storeId } = body;

    // Tạo session code ngẫu nhiên
    const sessionCode = nanoid(10);
    
    // Tạo thời gian hết hạn (72 giờ)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 72);

    // Tạo session trong database
    const mediaSession = await prisma.mediaSession.create({
      data: {
        sessionCode,
        expiresAt,
        status: 'PROCESSING',
        storeId: storeId || null
      }
    });

    console.log(`Created media session: ${sessionCode}`);

    return NextResponse.json({
      sessionCode: mediaSession.sessionCode,
      status: mediaSession.status,
      expiresAt: mediaSession.expiresAt
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating media session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/media-session - Cập nhật session với URLs
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionCode, imageUrl, videoUrl, gifUrl } = body;

    if (!sessionCode) {
      return NextResponse.json({ error: 'Session code is required' }, { status: 400 });
    }

    // Tìm session trong database
    const session = await prisma.mediaSession.findUnique({
      where: { sessionCode }
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Kiểm tra hết hạn
    if (new Date() > session.expiresAt) {
      return NextResponse.json({ error: 'Session has expired' }, { status: 410 });
    }

    // Cập nhật session
    const updatedSession = await prisma.mediaSession.update({
      where: { sessionCode },
      data: {
        imageUrl: imageUrl || session.imageUrl,
        videoUrl: videoUrl || session.videoUrl,
        gifUrl: gifUrl || session.gifUrl,
        status: 'COMPLETED'
      }
    });

    console.log(`Updated media session: ${sessionCode}`);

    return NextResponse.json(updatedSession, { status: 200 });

  } catch (error) {
    console.error('Error updating media session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
