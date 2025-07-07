import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

// PUT - Cập nhật trạng thái active/default của bảng giá
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; email: string; role: string };

    // Chỉ admin mới có quyền cập nhật
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admin can update pricing status' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, isActive, isDefault } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Pricing ID is required' },
        { status: 400 }
      );
    }

    // Nếu đặt làm mặc định, bỏ mặc định của các bảng giá khác
    if (isDefault) {
      await prisma.pricing.updateMany({
        where: { 
          id: { not: id },
          isDefault: true 
        },
        data: { isDefault: false }
      });
    }

    const pricing = await prisma.pricing.update({
      where: { id },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(isDefault !== undefined && { isDefault }),
        updatedAt: new Date()
      }
    });

    return NextResponse.json(pricing);
  } catch (error) {
    console.error('Error updating pricing status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
