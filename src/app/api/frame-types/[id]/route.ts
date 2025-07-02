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
  } catch (err) {
    console.error("Error fetching frame type:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Không thể lấy thông tin frame type",
      },
      { status: 500 }
    );
  }
}

// Helper function to ensure directory exists
async function createDirIfNotExists(dirPath: string) {
  try {
    await fs.access(dirPath);
  } catch (error) {
    console.log(`Directory ${error} does not exist, creating...`);
    await fs.mkdir(dirPath, { recursive: true });
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

    // Get current frame type to compare changes
    const currentFrameType = await prisma.frameType.findUnique({
      where: { id },
    });

    if (!currentFrameType) {
      return NextResponse.json(
        {
          success: false,
          error: "Frame type không tồn tại",
        },
        { status: 404 }
      );
    }

    // Calculate totalImages if columns or rows are updated
    const updateData: UpdateFrameTypeInput & {
      totalImages?: number;
      image?: string;
    } = {
      ...cleanBody,
    };

    // Check if columns or rows have changed
    const columnsChanged =
      body.columns && body.columns !== currentFrameType.columns;
    const rowsChanged = body.rows && body.rows !== currentFrameType.rows;

    if (columnsChanged || rowsChanged) {
      const columns = body.columns || currentFrameType.columns;
      const rows = body.rows || currentFrameType.rows;
      updateData.totalImages = columns * rows;

      // Generate frame type image filename based on columns x rows
      const typeImageFilename = `${columns}x${rows}.png`;
      const typeImagePath = `/uploads/type/${typeImageFilename}`;

      try {
        // Check if the image already exists in uploads/type directory
        const publicDir = path.join(process.cwd(), "public");
        const destPath = path.join(
          publicDir,
          "uploads",
          "type",
          typeImageFilename
        );
        
        // Try to find an existing template in the type directory to use as source
        // We don't need typeDir for now but might be useful in future
        // const typeDir = path.join(publicDir, "uploads", "type");
        let sourcePath = '';
        
        // Check if user provided a specific image to use
        if (body.image && body.image.startsWith('/uploads/')) {
          const providedImagePath = path.join(publicDir, body.image.substring(1)); // Remove leading slash
          try {
            await fs.access(providedImagePath);
            sourcePath = providedImagePath;
          } catch (error) {
            console.log('Provided image not found, will try to use current image', error);
            
            // If current frame has an image, try to use that
            if (currentFrameType.image && currentFrameType.image.startsWith('/uploads/')) {
              const currentImagePath = path.join(publicDir, currentFrameType.image.substring(1));
              try {
                await fs.access(currentImagePath);
                sourcePath = currentImagePath;
              } catch (error) {
                console.log('Current image not found, will use default template', error);
              }
            }
          }
        }
        
        // If no source path set yet, try to use default template
        if (!sourcePath) {
          sourcePath = path.join(
            publicDir,
            "uploads",
            "type",
            "1x1.png"
          ); // Default template if needed
        }

        // Create directories if they don't exist
        await createDirIfNotExists(path.join(publicDir, "uploads", "type"));

        // Check if the file already exists at the destination
        try {
          await fs.access(destPath);
          console.log(`File ${typeImageFilename} already exists.`);
        } catch (error) {
          // File doesn't exist, copy from template
          console.log(`File ${error} already exists.`);
          try {
            await fs.copyFile(sourcePath, destPath);
            console.log(`Created frame type image: ${typeImageFilename}`);
          } catch (copyError) {
            console.error("Error copying template file:", copyError);
          }
        }

        // Update the image path in the database
        updateData.image = typeImagePath;
      } catch (fileError) {
        console.error("Error handling frame type image:", fileError);
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

    // Delete the frame type (Prisma will cascade delete associated templates)
    await prisma.frameType.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Frame type đã được xóa thành công",
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
