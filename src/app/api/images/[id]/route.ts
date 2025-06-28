import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

// GET /api/images/[id] - Get a specific image by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    const image = await prisma.image.findUnique({
      where: { id }
    });

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    return NextResponse.json(image, { status: 200 });
  } catch (error) {
    console.error('Error fetching image:', error);
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
