import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/coupons/[id] - Get a specific coupon by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    return NextResponse.json(coupon, { status: 200 });
  } catch (error) {
    console.error('Error fetching coupon:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/coupons/[id] - Update a specific coupon by ID
export async function PUT(
  req: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    const body = await req.json();
    const { code, discount, expires_at, user_id, usageLimit, isActive } = body;

    // Check if coupon exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { id }
    });

    if (!existingCoupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    // If code is being updated, check if it conflicts with other coupons
    if (code && code !== existingCoupon.code) {
      const codeExists = await prisma.coupon.findUnique({
        where: { code }
      });

      if (codeExists) {
        return NextResponse.json({ error: 'Coupon with this code already exists' }, { status: 409 });
      }
    }

    // If user_id is provided, verify the user exists
    if (user_id) {
      const userExists = await prisma.user.findUnique({
        where: { id: user_id }
      });

      if (!userExists) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
    }

    // Prepare update data
    const updateData: Partial<{
      code: string;
      discount: number;
      expires_at: Date;
      user_id: string | null;
      usageLimit: number | null;
      isActive: boolean;
    }> = {};
    if (code) updateData.code = code;
    if (discount !== undefined) updateData.discount = parseFloat(discount.toString());
    if (expires_at) updateData.expires_at = new Date(expires_at);
    if (user_id !== undefined) updateData.user_id = user_id;
    if (usageLimit !== undefined) updateData.usageLimit = usageLimit;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update coupon
    const updatedCoupon = await prisma.coupon.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(updatedCoupon, { status: 200 });
  } catch (error) {
    console.error('Error updating coupon:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/coupons/[id] - Delete a specific coupon by ID
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    console.log('Deleting coupon with ID:', id);

    // Check if coupon exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { id },
      include: {
        revenues: { select: { id: true }, take: 1 },
        couponUsages: { select: { id: true }, take: 1 }
      }
    });

    if (!existingCoupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    // Kiểm tra xem coupon đã được sử dụng trong doanh thu hoặc coupon usage chưa
    const hasReferences = existingCoupon.revenues.length > 0 || existingCoupon.couponUsages.length > 0;
    
    if (hasReferences) {
      // Nếu đã được sử dụng, chỉ đánh dấu là không hoạt động thay vì xóa
      await prisma.coupon.update({
        where: { id },
        data: { 
          isActive: false 
        }
      });
      
      return NextResponse.json(
        { 
          message: 'Coupon has been used in transactions and cannot be deleted. It has been marked as inactive instead.',
          action: 'deactivated'
        }, 
        { status: 200 }
      );
    }
    
    // Nếu chưa được sử dụng, tiến hành xóa
    await prisma.coupon.delete({
      where: { id }
    });

    return NextResponse.json({ 
      message: 'Coupon deleted successfully',
      action: 'deleted'
    }, { status: 200 });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
