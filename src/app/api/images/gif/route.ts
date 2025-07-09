import { prisma } from "@/lib/prisma";
import { writeFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// POST /api/images/gif - Upload a new GIF
export async function POST(req: NextRequest) {
  try {
    // Check Content-Type header
    const contentType = req.headers.get("content-type");
    if (!contentType || !contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        {
          error: `Invalid Content-Type: ${contentType}. Must be multipart/form-data for file uploads.`,
        },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    if (file.type !== "image/gif") {
      return NextResponse.json(
        { error: "Invalid file type. Only gif format is allowed" },
        { status: 400 }
      );
    }

    // Generate a unique filename
    const uniqueFilename = `${uuidv4()}_${file.name.replace(/\s+/g, "_")}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "gifs");
    const filePath = path.join(uploadsDir, uniqueFilename);
    const relativePath = `/uploads/gifs/${uniqueFilename}`;

    // Ensure the uploads directory exists
    await createDirIfNotExists(uploadsDir);

    // Write the file to disk
    await writeFile(filePath, buffer);

    // Save the file information to the database
    const newImage = await prisma.image.create({
      data: {
        filename: uniqueFilename,
        path: relativePath,
        fileType: "GIF",
        size: buffer.length,
      },
    });

    // Invalidate cache after successful upload
    try {
      await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/cache/invalidate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paths: ['/uploads', newImage.path, '/'],
          tags: ['images', 'uploads', 'gifs']
        })
      });
    } catch (cacheError) {
      console.warn('Failed to invalidate cache:', cacheError);
    }

    return NextResponse.json(newImage, { status: 201 });
  } catch (error) {
    console.error("Error uploading GIF:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Helper function to create directory if it doesn't exist
async function createDirIfNotExists(dirPath: string) {
  const fs = await import("fs").then((module) => module.promises);
  try {
    await fs.access(dirPath);
  } catch (error) {
    console.error(error);
    await fs.mkdir(dirPath, { recursive: true });
  }
}
