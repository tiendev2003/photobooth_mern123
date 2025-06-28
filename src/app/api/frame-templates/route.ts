import { CreateFrameTemplateInput } from '@/lib/models';
import { getAllFrameTemplates } from '@/lib/models/FrameTemplate';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

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
    const body: CreateFrameTemplateInput = await request.json();
    
    // Validate required fields
    if (!body.name || !body.filename || !body.path || !body.frameTypeId) {
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
      where: { id: body.frameTypeId },
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
        name: body.name,
        filename: body.filename,
        path: body.path,
        preview: body.preview,
        frameTypeId: body.frameTypeId,
        isActive: body.isActive ?? true,
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
