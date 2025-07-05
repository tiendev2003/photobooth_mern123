import { prisma } from '@/lib/prisma';
import { writeFile } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Type for Prisma where clause
interface FrameTemplateWhereClause {
  isActive: boolean;
  name?: { contains: string };
  frameTypeId?: string;
  storeId?: string;
  isGlobal?: boolean;
  OR?: Array<{
    storeId?: string;
    isGlobal?: boolean;
  }>;
}

// Function to ensure directory exists
async function createDirIfNotExists(dir: string) {
  try {
    const { access  } = await import('fs/promises');
    await access(dir);
  } catch {
    const { mkdir } = await import('fs/promises');
    await mkdir(dir, { recursive: true });
  }
}

// Function to upload an image and return its details
async function uploadImage(file: File) {
  try {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      console.error('Invalid file type:', file.type);
      return null;
    }

    // Properly sanitize the filename to remove all problematic characters
    const sanitizedFileName = file.name
      .replace(/\s+/g, '_')
      .replace(/[()[\]{}áàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữự]/g, '')
      .replace(/[^\w.-]/g, ''); // Remove any non-alphanumeric characters except underscores, dots, and hyphens

    // Generate a unique filename
    const uniqueFilename = `${uuidv4()}_${sanitizedFileName}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'images');
    const filePath = path.join(uploadsDir, uniqueFilename);
    const relativePath = `/uploads/images/${uniqueFilename}`;

    // Ensure the uploads directory exists
    await createDirIfNotExists(uploadsDir);

    // Write the file to disk
    await writeFile(filePath, buffer);

    // Save the file information to the database
    await prisma.image.create({
      data: {
        filename: uniqueFilename,
        path: relativePath,
        fileType: 'IMAGE',
        size: buffer.length
      }
    });

    return {
      filename: uniqueFilename,
      path: relativePath
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
}

// GET - Get frame templates with store filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const includeGlobal = searchParams.get('includeGlobal') === 'true';
    const frameTypeId = searchParams.get('frameTypeId');
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    const search = searchParams.get('search') || '';
    
    // Set pagination options
    const page = pageParam ? parseInt(pageParam) : 1;
    const limit = limitParam ? parseInt(limitParam) : 10;
    const skip = (page - 1) * limit;
    
    // Build where clause
    const whereClause: FrameTemplateWhereClause = { isActive: true };
    
    // Add search filter
    if (search) {
      whereClause.name = { contains: search };
    }
    
    // Add frameType filter
    if (frameTypeId) {
      whereClause.frameTypeId = frameTypeId;
    }
    
    // Add store filter
    if (storeId) {
      if (includeGlobal) {
        // Lấy templates của store và global templates
        whereClause.OR = [
          { storeId: storeId },
          { isGlobal: true }
        ];
      } else {
        // Chỉ lấy templates của store
        whereClause.storeId = storeId;
      }
    } else if (includeGlobal) {
      // Chỉ lấy global templates
      whereClause.isGlobal = true;
    }

    // Get total count for pagination
    const total = await prisma.frameTemplate.count({ where: whereClause });
    
    // Get paginated templates
    const templates = await prisma.frameTemplate.findMany({
      where: whereClause,
      include: {
        frameType: {
          select: {
            id: true,
            name: true,
            description: true,
            image: true,
            columns: true,
            rows: true,
            totalImages: true,
            isCircle: true,
            isHot: true,
            isCustom: true,
          }
        },
        store: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: [
        { isGlobal: "asc" },  // Templates của store trước
        { createdAt: "desc" }
      ],
      skip,
      take: limit
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: templates,
      templates: templates,
      frameTemplates: templates,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      filters: {
        storeId,
        includeGlobal,
        frameTypeId,
        search
      }
    });
  } catch (error) {
    console.error("Error fetching frame templates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create frame template
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const frameTypeId = formData.get('frameTypeId') as string;
    const storeId = formData.get('storeId') as string;
    const isGlobalValue = formData.get('isGlobal') as string;
    let isGlobal = isGlobalValue === 'true';
    const backgroundFile = formData.get('backgroundFile') as File;
    const overlayFile = formData.get('overlayFile') as File;

    console.log('Frame template creation data:', {
      name,
      frameTypeId,
      storeId,
      isGlobal,
      isGlobalValue,
      backgroundFile: backgroundFile ? backgroundFile.name : 'null',
      overlayFile: overlayFile ? overlayFile.name : 'null'
    });

    // Validate required fields
    if (!name || !frameTypeId) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: "Name and frameTypeId are required" },
        { status: 400 }
      );
    }

    // Validate files
    // For POST requests (new templates), we require a valid backgroundFile
    // For PUT requests (edit), it's handled differently in the route handler
    if (request.method === 'POST' && (!backgroundFile || !(backgroundFile instanceof File))) {
      console.log('Missing background file for new template');
      return NextResponse.json(
        { error: "Background file is required for new templates" },
        { status: 400 }
      );
    }

    // Kiểm tra frameType có tồn tại
    const frameType = await prisma.frameType.findUnique({
      where: { id: frameTypeId }
    });

    if (!frameType) {
      return NextResponse.json(
        { error: "Frame type not found" },
        { status: 404 }
      );
    }

    // Nếu không phải global template thì phải có storeId
    if (!isGlobal && (!storeId || storeId.trim() === '')) {
      console.log('Store validation failed:', { isGlobal, storeId: storeId || 'null' });
      // Change behavior to automatically make it global if no storeId is provided
      console.log('Setting isGlobal=true since no storeId was provided');
      // Instead of returning an error, we'll modify isGlobal
      const modifiedIsGlobal = true;
      isGlobal = modifiedIsGlobal;
    }

    // Upload background image if it's a valid File object
    let backgroundPath = '';
    if (backgroundFile && backgroundFile instanceof File && backgroundFile.size > 0) {
      const backgroundUpload = await uploadImage(backgroundFile);
      if (!backgroundUpload) {
        return NextResponse.json(
          { error: "Failed to upload background image" },
          { status: 500 }
        );
      }
      backgroundPath = backgroundUpload.path;
    } else if (request.method === 'POST') {
      // For new template creation, background is required
      return NextResponse.json(
        { error: "Valid background image is required" },
        { status: 400 }
      );
    }

    // Upload overlay image (optional)
    let overlayPath = '';
    if (overlayFile && overlayFile instanceof File && overlayFile.size > 0) {
      const overlayUpload = await uploadImage(overlayFile);
      if (!overlayUpload) {
        return NextResponse.json(
          { error: "Failed to upload overlay image" },
          { status: 500 }
        );
      }
      overlayPath = overlayUpload.path;
    }

    // Generate unique filename
    const filename = `${uuidv4()}_${name.replace(/\s+/g, '_')}`;

    // Tạo frame template mới
    const frameTemplate = await prisma.frameTemplate.create({
      data: {
        name,
        filename,
        background: backgroundPath,
        overlay: overlayPath,
        frameTypeId,
        storeId: isGlobal ? null : (storeId && storeId.trim() !== '' ? storeId : null),
        isGlobal,
        isActive: true
      },
      include: {
        frameType: {
          select: {
            id: true,
            name: true,
            description: true,
            image: true,
            columns: true,
            rows: true,
            totalImages: true,
            isCircle: true,
            isHot: true,
            isCustom: true,
          }
        },
        store: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      frameTemplate,
      message: "Frame template created successfully"
    });
  } catch (error) {
    console.error("Error creating frame template:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
