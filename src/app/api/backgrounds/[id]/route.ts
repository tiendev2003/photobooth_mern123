import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Lấy chi tiết background
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const background = await prisma.background.findUnique({ where: { id: params.id } });
  if (!background) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(background);
}

// PUT: Cập nhật background
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const { name, url, isActive } = body;
  const background = await prisma.background.update({
    where: { id: params.id },
    data: { name, url, isActive },
  });
  return NextResponse.json(background);
}

// DELETE: Xóa background
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.background.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
