import { CreateFrameTemplateInput } from '@/lib/models';
import { prisma } from '@/lib/prisma';
import { writeFile } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Function to upload an image and return its details
async function uploadImage(file: File) {
  try {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      console.error('Invalid file type:', file.type);
      return null;
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

// Helper function to create directory if it doesn't exist
async function createDirIfNotExists(dirPath: string) {
  const fs = await import('fs').then(module => module.promises);
  try {
    await fs.access(dirPath);
  } catch (error) {
    console.log(error);
    await fs.mkdir(dirPath, { recursive: true });
  }
}

// GET - Get frame templates with pagination using the model function
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const frameTypeId = searchParams.get('frameTypeId');
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    const search = searchParams.get('search') || '';
    
    // Set options for getAllFrameTemplates function
    const options = {
      page: pageParam ? parseInt(pageParam) : 1,
      limit: limitParam ? parseInt(limitParam) : 10,
      search,
      frameTypeId: frameTypeId || undefined
    };
    
    // Manually fetch templates with the required relations
    const skip = (options.page - 1) * options.limit;
    const where: {
      frameTypeId?: string;
      OR?: Array<{ name: { contains: string } }>;
    } = {};
    
    if (options.frameTypeId) {
      where.frameTypeId = options.frameTypeId;
    }
    
    if (options.search) {
      where.OR = [
        { name: { contains: options.search } }
      ];
    }
    
    // Get total count for pagination
    const total = await prisma.frameTemplate.count({ where });
    
    // Get paginated templates with frame type only (remove user relation until migration is complete)
    const templates = await prisma.frameTemplate.findMany({
      where,
      include: {
        frameType: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: options.limit
    });
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(total / options.limit);
    
    return NextResponse.json({
      success: true,
      data: templates,
      templates: templates,  // Add this to ensure backward compatibility
      frameTemplates: templates,  // Add this to support the client-side expected format
      pagination: {
        total,
        page: options.page,
        limit: options.limit,
        totalPages,
        hasNextPage: options.page < totalPages,
        hasPrevPage: options.page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching frame templates:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Không thể lấy danh sách frame templates' 
      },
      { status: 500 }
    );
  }
}

// POST - Create new frame template
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type");
    
    let templateData: CreateFrameTemplateInput;
    let backgroundImage, overlayImage;
    
    // Handle multipart/form-data (file uploads) and application/json differently
    if (contentType && contentType.includes("multipart/form-data")) {
      // Process form data with file uploads
      const formData = await request.formData();
      
      templateData = {
        name: formData.get("name") as string,
        filename: '',  // Will be set from the uploaded file
        background: '', // Will be set from the background file
        overlay: '',   // Will be set from the overlay file
        frameTypeId: formData.get("frameTypeId") as string,
        userId: formData.get("userId") as string || null,
        isActive: formData.get("isActive") ? 
          (formData.get("isActive") === "true") : true
      };
      
      // Get background image file (required)
      const backgroundFile = formData.get("backgroundFile") as File;
      if (backgroundFile && backgroundFile.size > 0) {
        // Upload background file
        backgroundImage = await uploadImage(backgroundFile);
        if (backgroundImage) {
          templateData.background = backgroundImage.path;
          templateData.filename = backgroundImage.filename;
        } else {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Không thể tải lên ảnh nền (background)' 
            },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Thiếu ảnh nền (background)' 
          },
          { status: 400 }
        );
      }
      
      // Get overlay image file (required)
      const overlayFile = formData.get("overlayFile") as File;
      if (overlayFile && overlayFile.size > 0) {
        // Upload overlay file
        overlayImage = await uploadImage(overlayFile);
        if (overlayImage) {
          templateData.overlay = overlayImage.path;
        } else {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Không thể tải lên ảnh lớp phủ (overlay)' 
            },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Thiếu ảnh lớp phủ (overlay)' 
          },
          { status: 400 }
        );
      }
    } else {
      // Handle JSON data
      templateData = await request.json();
    }
    
    // Validate required fields
    if (!templateData.name || !templateData.filename || !templateData.background || !templateData.overlay || !templateData.frameTypeId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Thiếu thông tin bắt buộc: name, filename, background, overlay, frameTypeId' 
        },
        { status: 400 }
      );
    }

    // Check if frameType exists
    const frameType = await prisma.frameType.findUnique({
      where: { id: templateData.frameTypeId },
    });

    if (!frameType) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Frame type không tồn tại' 
        },
        { status: 404 }
      );
    }

    // Comment out userId validation until migration is complete
    // if (templateData.userId && templateData.userId !== 'null') {
    //   const user = await prisma.user.findUnique({
    //     where: { id: templateData.userId },
    //   });

    //   if (!user) {
    //     return NextResponse.json(
    //       { 
    //         success: false, 
    //         error: 'User không tồn tại' 
    //       },
    //       { status: 404 }
    //     );
    //   }
    // }
    
    // Tạo frame template với trường background và overlay
    // Create an object with the correct fields
    const createData = {
        name: templateData.name,
        filename: templateData.filename,
        background: templateData.background,
        overlay: templateData.overlay,
        frameTypeId: templateData.frameTypeId,
        isActive: templateData.isActive ?? true,
        // Remove userId until migration is complete
        // userId: templateData.userId === 'null' ? null : templateData.userId || null,
    };
    
    // Use type assertion at the call site level to avoid TypeScript errors
    // This is a temporary workaround for the schema/type mismatch during migration
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const frameTemplate = await (prisma.frameTemplate.create as any)({
      data: createData,
      include: {
        frameType: true,
        // Remove user relation until migration is complete
      },
    });

    return NextResponse.json({
      success: true,
      data: frameTemplate,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating frame template:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Không thể tạo frame template' 
      },
      { status: 500 }
    );
  }
}
