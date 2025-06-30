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
    const newImage = await prisma.image.create({
      data: {
        filename: uniqueFilename,
        path: relativePath,
        fileType: "IMAGE",
        size: buffer.length,
      },
    });

    return newImage;
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
    let previewImage, templateImage;

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

      // Get template image file if provided
      const templateFile = formData.get("templateFile") as File;
      if (templateFile && templateFile.size > 0) {
        // Upload template file
        templateImage = await uploadImage(templateFile);
        if (templateImage) {
          updateData.path = templateImage.path;
          updateData.filename = templateImage.filename;
        }
      }

      // Get preview image file if provided
      const previewFile = formData.get("previewFile") as File;
      if (previewFile && previewFile.size > 0) {
        // Upload preview file
        previewImage = await uploadImage(previewFile);
        if (previewImage) {
          updateData.preview = previewImage.path;
        }
      }
    } else {
      // Handle JSON data
      const rawBody = await request.json();

      updateData = {
        name: rawBody.name,
        filename: rawBody.filename,
        path: rawBody.path,
        preview: rawBody.preview,
        frameTypeId: rawBody.frameTypeId,
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

    const frameTemplate = await prisma.frameTemplate.update({
      where: { id },
      data: updateData,
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
      const filePath = path.join(
        process.cwd(),
        "public",
        existingFrameTemplate?.path
      );
      await fs.unlink(filePath);
    } catch (fileError) {
      console.error("Error deleting image file:", fileError);
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
