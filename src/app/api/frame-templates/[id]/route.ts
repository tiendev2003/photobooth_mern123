import { UpdateFrameTemplateInput } from "@/lib/models";
import { prisma } from "@/lib/prisma";
import fs, { writeFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Function to upload an image and return its details
async function uploadImage(file: File) {
  try {
    // Validate file type
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/svg+xml",
    ];
    if (!validTypes.includes(file.type)) {
      console.error("Invalid file type:", file.type);
      return null;
    }

    // Generate a unique filename
    const uniqueFilename = `${uuidv4()}_${file.name.replace(/\s+/g, "_")}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "images");
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
        fileType: "IMAGE",
        size: buffer.length,
      },
    });

    return {
      filename: uniqueFilename,
      path: relativePath
    };
  } catch (error) {
    console.error("Error uploading image:", error);
    return null;
  }
}

// Helper function to create directory if it doesn't exist
async function createDirIfNotExists(dirPath: string) {
  const fs = await import("fs").then((module) => module.promises);
  try {
    await fs.access(dirPath);
  } catch (error) {
    console.log(error);
    await fs.mkdir(dirPath, { recursive: true });
  }
}

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
        // User relation will be added after migration
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
    const contentType = request.headers.get("content-type");

    let updateData: UpdateFrameTemplateInput = {};
    let backgroundImage, overlayImage;

    // Handle multipart/form-data (file uploads) and application/json differently
    if (contentType && contentType.includes("multipart/form-data")) {
      // Process form data with file uploads
      const formData = await request.formData();

      // Extract text fields
      updateData = {
        name: (formData.get("name") as string) || undefined,
        frameTypeId: (formData.get("frameTypeId") as string) || undefined,
        isActive: formData.get("isActive")
          ? formData.get("isActive") === "true"
          : undefined,
      };
      
      // Comment out userId handling until migration is complete
      // const userId = formData.get("userId") as string;
      // if (userId === "null") {
      //   updateData.userId = null;
      // } else if (userId) {
      //   updateData.userId = userId;
      // }

      // Get background image file if provided
      const backgroundFile = formData.get("backgroundFile") as File;
      if (backgroundFile && backgroundFile.size > 0) {
        // Upload background file
        backgroundImage = await uploadImage(backgroundFile);
        if (backgroundImage) {
          updateData.background = backgroundImage.path;
          updateData.filename = backgroundImage.filename;
        }
      }

      // Get overlay image file if provided
      const overlayFile = formData.get("overlayFile") as File;
      if (overlayFile && overlayFile.size > 0) {
        // Upload overlay file
        overlayImage = await uploadImage(overlayFile);
        if (overlayImage) {
          updateData.overlay = overlayImage.path;
        }
      }
    } else {
      // Handle JSON data
      const rawBody = await request.json();

      updateData = {
        name: rawBody.name,
        filename: rawBody.filename,
        background: rawBody.background,
        overlay: rawBody.overlay,
        frameTypeId: rawBody.frameTypeId,
        // Comment out userId until migration is complete
        // userId: rawBody.userId === "null" ? null : rawBody.userId,
        isActive: rawBody.isActive,
      };
    }

    // Filter out undefined values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key as keyof UpdateFrameTemplateInput] === undefined) {
        delete updateData[key as keyof UpdateFrameTemplateInput];
      }
    });

    // Check if frameType exists when updating frameTypeId
    if (updateData.frameTypeId) {
      const frameType = await prisma.frameType.findUnique({
        where: { id: updateData.frameTypeId },
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
    
    // Comment out user validation until migration is complete
    // if (updateData.userId && updateData.userId !== null) {
    //   const user = await prisma.user.findUnique({
    //     where: { id: updateData.userId },
    //   });

    //   if (!user) {
    //     return NextResponse.json(
    //       {
    //         success: false,
    //         error: "User không tồn tại",
    //       },
    //       { status: 404 }
    //     );
    //   }
    // }

    // Cập nhật frame template với các trường background và overlay
    // Sử dụng as any để tránh lỗi TypeScript nếu cần
    // Use a properly typed approach to update only the fields that exist in updateData
    const updateFields: Record<string, unknown> = {};
    
    if (updateData.name !== undefined) updateFields.name = updateData.name;
    if (updateData.filename !== undefined) updateFields.filename = updateData.filename;
    if (updateData.background !== undefined) updateFields.background = updateData.background;
    if (updateData.overlay !== undefined) updateFields.overlay = updateData.overlay;
    if (updateData.frameTypeId !== undefined) updateFields.frameTypeId = updateData.frameTypeId;
    if (updateData.isActive !== undefined) updateFields.isActive = updateData.isActive;
    
    const frameTemplate = await prisma.frameTemplate.update({
      where: { id },
      data: updateFields,
      include: {
        frameType: true,
        // Remove user relation until migration is complete
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

    const existingFrameTemplate = await prisma.frameTemplate.findUnique({
      where: { id },
    });
    if (!existingFrameTemplate) {
      return NextResponse.json(
        { error: "Frame template not found" },
        { status: 404 }
      );
    }

    try {
      // Use the existing template to delete files
      // Define the type to avoid TypeScript errors
      type FrameTemplateWithPaths = {
        background?: string;
        path?: string;
        overlay?: string;
        preview?: string;
      };
      
      const template = existingFrameTemplate as unknown as FrameTemplateWithPaths;
      
      // Delete background file (which might be in path or background field)
      const backgroundPath = template.background || template.path;
      if (backgroundPath) {
        const fullPath = path.join(process.cwd(), "public", backgroundPath);
        try {
          await fs.unlink(fullPath);
        } catch (fileError) {
          console.error("Error deleting background file:", fileError);
        }
      }
      
      // Delete overlay file (which might be in preview or overlay field)
      const overlayPath = template.overlay || template.preview;
      if (overlayPath) {
        const fullPath = path.join(process.cwd(), "public", overlayPath);
        try {
          await fs.unlink(fullPath);
        } catch (fileError) {
          console.error("Error deleting overlay file:", fileError);
        }
      }
    } catch (fileError) {
      console.error("Error deleting image files:", fileError);
    }
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
