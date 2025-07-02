import { CreateFrameTypeInput } from '@/lib/models';
import { getAllFrameTypes } from '@/lib/models/FrameType';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

// Helper function to ensure directory exists
async function createDirIfNotExists(dirPath: string) {
  try {
    await fs.access(dirPath);
  } catch (err) {
    console.log(`Directory ${err} does not exist, creating...`);
    await fs.mkdir(dirPath, { recursive: true });
  }
}

// GET - Get frame types with pagination using the model function
export async function GET(req: NextRequest) {
  try {
    // Get pagination parameters from URL
    const searchParams = req.nextUrl.searchParams;
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    const search = searchParams.get('search') || '';
    
    // Set options for the getAllFrameTypes function
    const options = {
      page: pageParam ? parseInt(pageParam) : 1,
      limit: limitParam ? parseInt(limitParam) : 10,
      search
    };
    
    // Use the model function to get paginated frame types
    const { frameTypes, pagination } = await getAllFrameTypes(options);
    
    return NextResponse.json({
      success: true,
      data: frameTypes,
      pagination: pagination
    });
  } catch (err) {
    console.error('Error fetching frame types:', err);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Không thể lấy danh sách frame types' 
      },
      { status: 500 }
    );
  }
}

// POST - Create new frame type
export async function POST(request: NextRequest) {
  try {
    const body: CreateFrameTypeInput = await request.json();
    
    // Validate required fields
    if (!body.name || !body.columns || !body.rows) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Thiếu thông tin bắt buộc: name, columns, rows' 
        },
        { status: 400 }
      );
    }

    // Calculate totalImages if not provided
    const totalImages = body.totalImages || (body.columns * body.rows);
    
    // Generate frame type image filename based on columns x rows
    const typeImageFilename = `${body.columns}x${body.rows}.png`;
    const typeImagePath = `/uploads/type/${typeImageFilename}`;
    
    try {
      // Check if the image already exists in uploads/type directory
      const publicDir = path.join(process.cwd(), "public");
      const destPath = path.join(publicDir, "uploads", "type", typeImageFilename);
      
      // Try to find an existing template in the type directory to use as source
      const typeDir = path.join(publicDir, "uploads", "type");
      let sourcePath = '';
      
      // Check if user provided a specific image to use
      if (body.image && body.image.startsWith('/uploads/')) {
        const providedImagePath = path.join(publicDir, body.image.substring(1)); // Remove leading slash
        try {
          await fs.access(providedImagePath);
          sourcePath = providedImagePath;
        } catch (error) {
          console.log('Provided image not found, will use default template', error);
        }
      }
      
      // If no source path set yet, try to use default template
      if (!sourcePath) {
        sourcePath = path.join(typeDir, "1x1.png"); // Default template
      }
      
      // Create directories if they don't exist
      await createDirIfNotExists(path.join(publicDir, "uploads", "type"));
      
      // Check if the file already exists at the destination
      try {
        await fs.access(destPath);
        console.log(`File ${typeImageFilename} already exists.`);
      } catch (error) {
        console.log(`File ${error} does not exist, creating...`);
        // File doesn't exist, copy from template
        try {
          await fs.copyFile(sourcePath, destPath);
          console.log(`Created frame type image: ${typeImageFilename}`);
        } catch (copyError) {
          console.error("Error copying template file:", copyError);
        }
      }
    } catch (fileError) {
      console.error("Error handling frame type image:", fileError);
    }

    const frameType = await prisma.frameType.create({
      data: {
        name: body.name,
        description: body.description,
        image: typeImagePath, // Use the generated image path
        columns: body.columns,
        rows: body.rows,
        totalImages,
        isActive: body.isActive ?? true,
      },
      include: {
        templates: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: frameType,
    }, { status: 201 });
  } catch (err) {
    console.error('Error creating frame type:', err);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Không thể tạo frame type' 
      },
      { status: 500 }
    );
  }
}
