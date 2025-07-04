import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/media-session - Create a new media session
export async function POST(req: NextRequest) {
  try {
    const { imageIds } = await req.json();

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return NextResponse.json({ error: 'imageIds array is required' }, { status: 400 });
    }

    // First, check which media IDs actually exist in the database
    const existingImages = await prisma.image.findMany({
      where: {
        id: {
          in: imageIds
        }
      },
      select: {
        id: true
      }
    });

    const existingImageIds = existingImages.map(img => img.id);

    if (existingImageIds.length === 0) {
      return NextResponse.json({ error: 'No valid media found' }, { status: 404 });
    }

    // Create media session with 72 hour expiration
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 72);

    const mediaSession = await prisma.mediaSession.create({
      data: {
        sessionCode: generateSessionCode(),
        expiresAt,
        images: {
          connect: existingImageIds.map(id => ({ id }))
        }
      },
      include: {
        images: true
      }
    });

    return NextResponse.json(mediaSession, { status: 201 });
  } catch (error) {
    console.error('Error creating media session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Generate a unique session code
function generateSessionCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
