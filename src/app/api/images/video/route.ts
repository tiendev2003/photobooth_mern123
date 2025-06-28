import { prisma } from '@/lib/prisma';
import { writeFile } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// POST /api/images/video - Upload a new video
export async function POST(req: NextRequest) {
  try {
    // Check Content-Type header
    const contentType = req.headers.get('content-type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return NextResponse.json({ 
        error: `Invalid Content-Type: ${contentType}. Must be multipart/form-data for file uploads.` 
      }, { status: 400 });
    }
    
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only mp4, webm, quicktime, and avi formats are allowed' 
      }, { status: 400 });
    }

    // Generate a unique filename
    const uniqueFilename = `${uuidv4()}_${file.name.replace(/\s+/g, '_')}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'videos');
    const filePath = path.join(uploadsDir, uniqueFilename);
    const relativePath = `/uploads/videos/${uniqueFilename}`;

    // Ensure the uploads directory exists
    await createDirIfNotExists(uploadsDir);

    // Write the file to disk
    await writeFile(filePath, buffer);

    // Get video duration (if we had ffmpeg installed, we would get it here)
    // For now, we'll set it as null or use a default
    const duration = null;

    // Save the file information to the database
    const newImage = await prisma.image.create({
      data: {
        filename: uniqueFilename,
        path: relativePath,
        fileType: 'VIDEO',
        size: buffer.length,
        duration
      }
    });

    return NextResponse.json(newImage, { status: 201 });
  } catch (error) {
    console.error('Error uploading video:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Helper function to create directory if it doesn't exist
async function createDirIfNotExists(dirPath: string) {
  const fs = await import('fs').then(module => module.promises);
  try {
    await fs.access(dirPath);
  } catch (error) {
    console.error(error);
    await fs.mkdir(dirPath, { recursive: true });
  }
}
