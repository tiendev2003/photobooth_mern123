import { CreateFrameTemplateInput } from '@/lib/models';
import { getAllFrameTemplates } from '@/lib/models/FrameTemplate';
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
    const newImage = await prisma.image.create({
      data: {
        filename: uniqueFilename,
        path: relativePath,
        fileType: 'IMAGE',
        size: buffer.length
      }
    });

    return newImage;
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
    
    // Use the model function to get paginated templates
    const { templates, pagination } = await getAllFrameTemplates(options);
    
    return NextResponse.json({
      success: true,
      data: templates,
      templates: templates,  // Add this to ensure backward compatibility
      frameTemplates: templates,  // Add this to support the client-side expected format
      pagination: pagination
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
    let templateImage, previewImage;
    
    // Handle multipart/form-data (file uploads) and application/json differently
    if (contentType && contentType.includes("multipart/form-data")) {
      // Process form data with file uploads
      const formData = await request.formData();
      
      templateData = {
        name: formData.get("name") as string,
        filename: '',  // Will be set from the uploaded file
        path: '',      // Will be set from the uploaded file
        frameTypeId: formData.get("frameTypeId") as string,
        isActive: formData.get("isActive") ? 
          (formData.get("isActive") === "true") : true,
        preview: ''    // Will be set if preview file is uploaded
      };
      
      // Get template image file (required)
      const templateFile = formData.get("templateFile") as File;
      if (templateFile && templateFile.size > 0) {
        // Upload template file
        templateImage = await uploadImage(templateFile);
        if (templateImage) {
          templateData.path = templateImage.path;
          templateData.filename = templateImage.filename;
        } else {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Không thể tải lên tệp template' 
            },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Thiếu tệp template' 
          },
          { status: 400 }
        );
      }
      
      // Get preview image file if provided
      const previewFile = formData.get("previewFile") as File;
      if (previewFile && previewFile.size > 0) {
        // Upload preview file
        previewImage = await uploadImage(previewFile);
        if (previewImage) {
          templateData.preview = previewImage.path;
        }
      }
    } else {
      // Handle JSON data
      templateData = await request.json();
    }
    
    // Validate required fields
    if (!templateData.name || !templateData.filename || !templateData.path || !templateData.frameTypeId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Thiếu thông tin bắt buộc: name, filename, path, frameTypeId' 
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

    const frameTemplate = await prisma.frameTemplate.create({
      data: {
        name: templateData.name,
        filename: templateData.filename,
        path: templateData.path,
        preview: templateData.preview,
        frameTypeId: templateData.frameTypeId,
        isActive: templateData.isActive ?? true,
      },
      include: {
        frameType: true,
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
