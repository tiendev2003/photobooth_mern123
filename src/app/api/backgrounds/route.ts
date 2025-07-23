import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { uploadImageWithStore } from '@/lib/utils/uploadApi';

const prisma = new PrismaClient();

// GET: Lấy danh sách backgrounds
export async function GET(req: NextRequest) {
  const backgrounds = await prisma.background.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(backgrounds);
}

// POST: Tạo mới background
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const name = form.get('name') as string;
  const isActive = form.get('isActive') === 'true';
  const file = form.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'Thiếu file ảnh' }, { status: 400 });
  }


  // Sử dụng util upload chuẩn
  let url = '';
  try {
    url = await uploadImageWithStore(file);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi upload ảnh' }, { status: 500 });
  }
  if (!url) {
    return NextResponse.json({ error: 'Không lấy được url ảnh' }, { status: 500 });
  }

  const background = await prisma.background.create({
    data: { name, url, isActive },
  });
  return NextResponse.json(background);
}
