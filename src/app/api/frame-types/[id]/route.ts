import { UpdateFrameTypeInput } from "@/lib/models";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

// GET - Lấy frame type theo ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const frameType = await prisma.frameType.findUnique({
      where: { id },
      include: {
        templates: true,
      },
    });

    if (!frameType) {
      return NextResponse.json(
        {
          success: false,
          error: "Không tìm thấy frame type",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: frameType,
    });
  } catch (error) {
    console.error("Error fetching frame type:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Không thể lấy thông tin frame type",
      },
      { status: 500 }
    );
  }
}

// PUT - Cập nhật frame type
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateFrameTypeInput = await request.json();

    // Create a clean update data object, ensuring no 'id' field is included
    const { id: bodyId, ...cleanBody } = body as UpdateFrameTypeInput & {
      id?: string;
    };
    console.log(bodyId);

    // Calculate totalImages if columns or rows are updated
    const updateData: UpdateFrameTypeInput & { totalImages?: number } = {
      ...cleanBody,
    };
    if (body.columns || body.rows) {
      const currentFrameType = await prisma.frameType.findUnique({
        where: { id },
      });

      if (currentFrameType) {
        const columns = body.columns || currentFrameType.columns;
        const rows = body.rows || currentFrameType.rows;
        updateData.totalImages = columns * rows;
      }
    }

    const frameType = await prisma.frameType.update({
      where: { id },
      data: updateData,
      include: {
        templates: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: frameType,
    });
  } catch (error) {
    console.error("Error updating frame type:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Không thể cập nhật frame type",
      },
      { status: 500 }
    );
  }
}

// DELETE - Xóa frame type
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if frame type exists
    const existingFrameType = await prisma.frameType.findUnique({
      where: { id },
    });
    if (!existingFrameType) {
      return NextResponse.json(
        { error: "Frame type not found" },
        { status: 404 }
      );
    }

    try {
      if (existingFrameType?.image) {
        const filePath = path.join(
          process.cwd(),
          "public",
          existingFrameType.image
        );
        await fs.unlink(filePath);
      }
    } catch (error) {
      console.error("Error checking associated templates:", error);
    }

    await prisma.frameType.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Xóa frame type thành công",
    });
  } catch (error) {
    console.error("Error deleting frame type:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Không thể xóa frame type",
      },
      { status: 500 }
    );
  }
}
