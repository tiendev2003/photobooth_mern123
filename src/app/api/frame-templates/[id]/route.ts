import { UpdateFrameTemplateInput } from "@/lib/models";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET - Lấy frame template theo ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const frameTemplate = await prisma.frameTemplate.findUnique({
      where: { id },
      include: {
        frameType: true,
      },
    });

    if (!frameTemplate) {
      return NextResponse.json(
        {
          success: false,
          error: "Không tìm thấy frame template",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: frameTemplate,
    });
  } catch (error) {
    console.error("Error fetching frame template:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Không thể lấy thông tin frame template",
      },
      { status: 500 }
    );
  }
}

// PUT - Cập nhật frame template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateFrameTemplateInput = await request.json();

    // Check if frameType exists when updating frameTypeId
    if (body.frameTypeId) {
      const frameType = await prisma.frameType.findUnique({
        where: { id: body.frameTypeId },
      });

      if (!frameType) {
        return NextResponse.json(
          {
            success: false,
            error: "Frame type không tồn tại",
          },
          { status: 404 }
        );
      }
    }

    const frameTemplate = await prisma.frameTemplate.update({
      where: { id },
      data: body,
      include: {
        frameType: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: frameTemplate,
    });
  } catch (error) {
    console.error("Error updating frame template:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Không thể cập nhật frame template",
      },
      { status: 500 }
    );
  }
}

// DELETE - Xóa frame template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.frameTemplate.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Xóa frame template thành công",
    });
  } catch (error) {
    console.error("Error deleting frame template:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Không thể xóa frame template",
      },
      { status: 500 }
    );
  }
}
