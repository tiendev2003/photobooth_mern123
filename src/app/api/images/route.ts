import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { writeFile } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Set custom config for the route
export const config = {
  api: {
    // Disable body parsing (Next.js will not parse the body as we'll handle it ourselves)
    bodyParser: false,
    // Increase the limit to 10MB
    responseLimit: '10mb',
  },
};

// GET /api/images - Get all images with pagination
export async function GET(req: NextRequest) {
  try {
    // Get pagination parameters from URL
    const searchParams = req.nextUrl.searchParams;
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    const searchQuery = searchParams.get('search') || '';
    
    // Set default pagination values
    const page = pageParam ? parseInt(pageParam) : 1;
    const limit = limitParam ? parseInt(limitParam) : 10;
    const skip = (page - 1) * limit;
      // Filter criteria
    const where: Prisma.ImageWhereInput = searchQuery
  ? {
      filename: {
        contains: searchQuery,
      },
    }
  : {};


    // Get total count for pagination metadata
    const totalImages = await prisma.image.count({ where });
    
    // Get paginated images
    const images = await prisma.image.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalImages / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return NextResponse.json({
      images,
      pagination: {
        total: totalImages,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/images - Upload a new image
export async function POST(req: NextRequest) {
  try {
    // Check Content-Type header
    const contentType = req.headers.get('content-type');
    console.log('Content-Type:', contentType);
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return NextResponse.json({ 
        error: `Invalid Content-Type: ${contentType}. Must be multipart/form-data for file uploads.` 
      }, { status: 400 });
    }
    
    // Parse the request body as formData with a try-catch to handle potential large file uploads
    let formData;
    try {
      formData = await req.formData();
    } catch (error) {
      console.error("Error parsing formData:", error);
      return NextResponse.json({ 
        error: 'Uploaded file is too large. Maximum file size is 10MB.' 
      }, { status: 413 });
    }
    
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ 
        error: 'File size too large. Maximum file size is 10MB.' 
      }, { status: 413 });
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only jpeg, png, webp, and svg are allowed. Use /api/images/gif for GIFs or /api/images/video for videos.'
      }, { status: 400 });
    }

    // Generate a unique filename
    const uniqueFilename = `${uuidv4()}_${file.name.replace(/\s+/g, '_')}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'images');
    const filePath = path.join(uploadsDir, uniqueFilename);
    const relativePath = `/uploads/images/${uniqueFilename}`;

    // Ensure the uploads directory exists
    await createDirIfNotExists(uploadsDir);

    // Write the file to disk
    await writeFile(filePath, buffer);

    // Save the file information to the database
    const newImage = await prisma.image.create({
      data: {
        filename: uniqueFilename,
        path: relativePath,
        fileType: 'IMAGE',
        size: buffer.length,
       }
    });

    return NextResponse.json({ 
      success: true, 
      data: {
        ...newImage,
        url: process.env.API_BASE_URL + newImage.path
      } 
    }, { status: 201 });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Helper function to create directory if it doesn't exist
async function createDirIfNotExists(dirPath: string) {
  const fs = await import('fs').then(module => module.promises);
  try {
    await fs.access(dirPath);
  } catch (error) {
    console.error(error)
    await fs.mkdir(dirPath, { recursive: true });
  }
}
