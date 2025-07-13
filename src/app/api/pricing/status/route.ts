import { Prisma, PrismaClient } from '@prisma/client';
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

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { store: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Chỉ admin, store owner, và manager mới có quyền update status
    if (!["ADMIN", "STORE_OWNER", "MANAGER"].includes(user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
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

    // Kiểm tra pricing có tồn tại và quyền update
    const existingPricing = await prisma.pricing.findUnique({
      where: { id }
    });

    if (!existingPricing) {
      return NextResponse.json(
        { error: "Pricing not found" },
        { status: 404 }
      );
    }

    // Kiểm tra quyền update
    if (user.role !== "ADMIN") {
      if (existingPricing.storeId !== user.storeId && existingPricing.userId !== user.id) {
        return NextResponse.json(
          { error: "Can only update your own pricing" },
          { status: 403 }
        );
      }
    }

    const updateData: Prisma.PricingUpdateInput = {};

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    if (isDefault !== undefined) {
      updateData.isDefault = isDefault;
      
      // Nếu đặt làm mặc định, bỏ mặc định của các bảng giá khác trong cùng scope
      if (isDefault) {
        const whereClause: Prisma.PricingWhereInput = { isDefault: true, id: { not: id } };
        if (existingPricing.storeId) {
          whereClause.storeId = existingPricing.storeId;
        } else if (existingPricing.userId) {
          whereClause.userId = existingPricing.userId;
        } else {
          whereClause.AND = [{ storeId: null }, { userId: null }];
        }

        await prisma.pricing.updateMany({
          where: whereClause,
          data: { isDefault: false },
        });
      }
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
