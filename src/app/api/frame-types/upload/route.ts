import { prisma } from '@/lib/prisma';
import { writeFile } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Helper function to ensure directory exists
async function createDirIfNotExists(dirPath: string) {
  const fs = await import('fs').then(module => module.promises);
  try {
    await fs.access(dirPath);
  } catch (err) {
    console.log(`Directory ${err} does not exist, creating...`);
    await fs.mkdir(dirPath, { recursive: true });
  }
}

// POST - Upload a frame type image
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No file uploaded' 
        },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid file type. Only JPEG, PNG, WEBP and SVG are supported.' 
        },
        { status: 400 }
      );
    }

    // Get optional target columns and rows from the request
    const columns = formData.get('columns');
    const rows = formData.get('rows');

    // Generate a unique filename
    let uniqueFilename;
    let relativePath;

    // If columns and rows are provided, use them as filename
    if (columns && rows) {
      uniqueFilename = `${columns}x${rows}.png`;
      relativePath = `/uploads/type/${uniqueFilename}`;
    } else {
      // Otherwise, use a unique name
      uniqueFilename = `${uuidv4()}_${file.name.replace(/\s+/g, '_')}`;
      relativePath = `/uploads/type/${uniqueFilename}`;
    }

    // Buffer the file data
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Prepare the directory and file path
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'type');
    const filePath = path.join(uploadsDir, uniqueFilename);
    
    // Ensure the uploads/type directory exists
    await createDirIfNotExists(uploadsDir);
    
    // Write the file to disk
    await writeFile(filePath, buffer);
    
    // Check if an image with this filename already exists in the database
    let imageRecord;
    
    try {
      // Try to find an existing image with this filename
      const existingImage = await prisma.image.findUnique({
        where: {
          filename: uniqueFilename
        }
      });
      
      if (existingImage) {
        // Update the existing record
        imageRecord = await prisma.image.update({
          where: {
            id: existingImage.id
          },
          data: {
            path: relativePath,
            size: buffer.length,
            updatedAt: new Date()
          }
        });
        console.log(`Updated existing image record for ${uniqueFilename}`);
      } else {
        // Create a new record if none exists
        imageRecord = await prisma.image.create({
          data: {
            filename: uniqueFilename,
            path: relativePath,
            fileType: 'IMAGE',
            size: buffer.length
          }
        });
        console.log(`Created new image record for ${uniqueFilename}`);
      }
    } catch (dbError) {
      console.error('Error managing database record:', dbError);
      // Still return success since the file was written successfully
      return NextResponse.json({
        success: true,
        data: {
          path: relativePath
        }
      });
    }

    // Return the success response with the file path
    return NextResponse.json({
      success: true,
      data: {
        id: imageRecord.id,
        filename: imageRecord.filename,
        path: imageRecord.path
      }
    });
    
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to upload image' 
      },
      { status: 500 }
    );
  }
}
