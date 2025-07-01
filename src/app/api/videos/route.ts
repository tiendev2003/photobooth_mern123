import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const uploadsDir = path.join(process.cwd(), "public", "uploads", "videos");

// Ensure the directory exists
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (err) {
  console.error("Error creating uploads directory:", err);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Generate a unique filename
    const uniqueFileName = `${uuidv4()}_${file.name}`;
    const filePath = path.join(uploadsDir, uniqueFileName);

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Write the file
    fs.writeFileSync(filePath, buffer);

    // Return the public URL
    const publicUrl = `/uploads/videos/${uniqueFileName}`;

    return NextResponse.json({
      message: "Video uploaded successfully",
      data: {
        url: publicUrl,
        fileName: uniqueFileName,
      },
    });
  } catch (error) {
    console.error("Error uploading video:", error);
    return NextResponse.json(
      { error: "Failed to upload video" },
      { status: 500 }
    );
  }
}
