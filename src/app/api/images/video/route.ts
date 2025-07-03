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

    // Log file info for debugging
    console.log(`Received video upload - Type: ${file.type}, Size: ${file.size} bytes, Name: ${file.name}`);

    // Accept a wider range of video types for compatibility
    const validTypes = [
      'video/mp4', 
      'video/webm', 
      'video/quicktime', 
      'video/x-msvideo',
      'video/ogg',
      'application/octet-stream'  // For cases where type isn't detected correctly
    ];
    
    if (!validTypes.includes(file.type) && file.size > 0) {
      console.warn(`Non-standard video type received: ${file.type}`);
      // Continue anyway since we'll try to determine the format from content
    }

    // Ensure filename has a valid extension based on content type
    let filename = file.name.replace(/\s+/g, '_');
    if (!filename.includes('.')) {
      if (file.type.includes('webm')) {
        filename += '.webm';
      } else if (file.type.includes('mp4')) {
        filename += '.mp4';
      } else {
        filename += '.webm'; // Default to webm if type is unknown
      }
    }

    // Generate a unique filename
    const uniqueFilename = `${uuidv4()}_${filename}`;
    
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      
      if (buffer.length === 0) {
        return NextResponse.json({ error: 'Empty file received' }, { status: 400 });
      }
      
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'videos');
      const filePath = path.join(uploadsDir, uniqueFilename);
      const relativePath = `/uploads/videos/${uniqueFilename}`;

      // Ensure the uploads directory exists
      await createDirIfNotExists(uploadsDir);

      // Write the file to disk
      await writeFile(filePath, buffer);
      console.log(`Video file written successfully: ${filePath}`);

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

      console.log(`Video file saved to database with ID: ${newImage.id}`);
      return NextResponse.json(newImage, { status: 201 });
    } catch (fileError) {
      console.error('Error processing video file:', fileError);
      return NextResponse.json({ error: 'Failed to process video file' }, { status: 500 });
    }
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
    console.log(`Creating directory: ${dirPath}`);
    await fs.mkdir(dirPath, { recursive: true });
  }
}
