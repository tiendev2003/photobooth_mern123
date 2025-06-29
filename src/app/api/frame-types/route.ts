import { CreateFrameTypeInput } from '@/lib/models';
import { getAllFrameTypes } from '@/lib/models/FrameType';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

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
  } catch (error) {
    console.error('Error fetching frame types:', error);
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

    const frameType = await prisma.frameType.create({
      data: {
        name: body.name,
        description: body.description,
        image: body.image,
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
  } catch (error) {
    console.error('Error creating frame type:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Không thể tạo frame type' 
      },
      { status: 500 }
    );
  }
}
