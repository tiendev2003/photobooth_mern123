import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
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

 
// Function to upload an image and return its details
async function uploadImage(file: File) {
  try {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      console.error('Invalid file type:', file.type);
      return null;
    }

    // Upload to external API (giống PUT)
    // Sử dụng uploadFrameToExternalAPI để đồng bộ với PUT
    const { uploadFrameToExternalAPI } = await import('@/lib/utils/uploadApi');
    const imageUrl = await uploadFrameToExternalAPI(file);
    if (!imageUrl) {
      throw new Error('Image upload failed');
    }

    // Extract filename from URL
    const urlParts = imageUrl.split('/');
    const filename = urlParts[urlParts.length - 1];

    // Save the file information to the database
    await prisma.image.create({
      data: {
        filename: filename,
        path: imageUrl,
        fileType: 'IMAGE',
        size: file.size
      }
    });

    return {
      filename: filename,
      path: imageUrl
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
    const sortBy = searchParams.get('sortBy') || 'position';
    
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
      orderBy: (() => {
        // Xác định thứ tự sắp xếp dựa trên sortBy
        switch (sortBy) {
          case 'name':
            return [
              { isGlobal: "asc" },  // Templates của store trước
              { name: "asc" }       // Sắp xếp theo tên A-Z
            ];
          case 'date':
            return [
              { isGlobal: "asc" },  // Templates của store trước
              { createdAt: "desc" } // Sắp xếp theo ngày tạo mới nhất
            ];
          case 'position':
          default:
            return [
              { isGlobal: "asc" },  // Templates của store trước
              { position: "asc" },  // Sắp xếp theo position
              { createdAt: "desc" } // Nếu position bằng nhau thì sắp xếp theo ngày tạo
            ];
        }
      })(),
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
        search,
        sortBy
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
    const positionValue = formData.get('position') as string;
    let isGlobal = isGlobalValue === 'true';
    const backgroundFile = formData.get('backgroundFile') as File;
    const overlayFile = formData.get('overlayFile') as File;
    // Parse position value to number or use default value 0
    const position = positionValue ? parseInt(positionValue) : 0;

    console.log('Frame template creation data:', {
      name,
      frameTypeId,
      storeId,
      isGlobal,
      position,
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

    // Check for duplicate positions if this is a store template (not global)
    if (!isGlobal && storeId && position !== undefined) {
      // Check if there is already a template with this position for this store and frame type
      const existingTemplateWithSamePosition = await prisma.frameTemplate.findFirst({
        where: {
          position: position,
          storeId: storeId,
          frameTypeId: frameTypeId
        }
      });
      
      if (existingTemplateWithSamePosition) {
        return NextResponse.json(
          {
            success: false,
            error: `Vị trí ${position} đã được sử dụng cho template ${existingTemplateWithSamePosition.name}. Vui lòng chọn vị trí khác.`
          },
          { status: 400 }
        );
      }
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
        position,
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
