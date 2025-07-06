import { prisma } from '@/lib/prisma';
import fs from 'fs';
import { writeFile } from 'fs/promises';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; email: string; role: string };
    
    if (!decoded.id) {
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || !['STORE_OWNER', 'ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'logo' or 'background'
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) {
      return NextResponse.json({ error: 'Invalid file format. Only JPG, PNG, GIF, WEBP are allowed' }, { status: 400 });
    }
    
    const fileName = `${type}_${uuidv4()}.${fileExtension}`;
    
    // Create upload path
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'stores');
    const filePath = join(uploadDir, fileName);

    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Write file
    await writeFile(filePath, buffer);

    // Return file URL
    const fileUrl = `/uploads/stores/${fileName}`;
    
    console.log('File uploaded successfully:', fileUrl);
    return NextResponse.json({ url: fileUrl });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
