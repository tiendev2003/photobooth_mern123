import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

// GET /api/images/[id] - Get a specific image, video or GIF by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // First, try direct ID lookup
    let media = await prisma.image.findUnique({
      where: { id }
    });

    // If not found, try to find by UUID prefix in filename (for media page URLs)
    if (!media) {
      const images = await prisma.image.findMany({
        where: {
          filename: {
            startsWith: `${id}_`,
          },
        },
      });
      
      if (images.length > 0) {
        media = images[0]; // Use the first matching image
      }
    }

    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    // Add the full URL to the response but don't modify the media object
    const baseUrl = process.env.API_BASE_URL || '';
    
    return NextResponse.json({
      ...media,
      fullUrl: `${baseUrl}${media.path}`
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/images/[id] - Delete a specific image by ID
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;

    // Check if image exists
    const existingImage = await prisma.image.findUnique({
      where: { id }
    });

    if (!existingImage) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Delete the image file from disk
    try {
      const filePath = path.join(process.cwd(), 'public', existingImage.path);
      await fs.unlink(filePath);
    } catch (fileError) {
      console.error('Error deleting image file:', fileError);
      // Continue with deleting the database record even if file deletion fails
    }

    // Delete image record from database
    await prisma.image.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Image deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
