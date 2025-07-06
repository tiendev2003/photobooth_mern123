import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
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
      include: {
        store: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Allow STORE_OWNER and store employees to access
    if (!['STORE_OWNER', 'USER', 'MACHINE'].includes(user.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // For employees, check if they belong to a store
    if (user.role !== 'STORE_OWNER' && !user.storeId) {
      return NextResponse.json({ error: 'Employee not assigned to any store' }, { status: 403 });
    }

    // Get store ID based on user role
    let storeId;
    if (user.role === 'STORE_OWNER') {
      if (!user.store) {
        return NextResponse.json({ error: 'Store not found' }, { status: 404 });
      }
      storeId = user.store.id;
    } else {
      storeId = user.storeId!;
    }

    // Get coupons for this store
    const coupons = await prisma.coupon.findMany({
      where: {
        storeId: storeId
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Add status and usage info to each coupon
    const couponsWithStatus = coupons.map(coupon => {
      const now = new Date();
      const isExpired = coupon.expiresAt < now;
      const isActive = coupon.isActive && !isExpired;
      
      return {
        ...coupon,
        creator: coupon.user,
        status: isExpired ? 'expired' : (isActive ? 'active' : 'inactive'),
        usageCount: coupon.currentUsage,
        remainingUses: coupon.usageLimit ? Math.max(0, coupon.usageLimit - coupon.currentUsage) : null
      };
    });

    return NextResponse.json({ coupons: couponsWithStatus });

  } catch (error) {
    console.error('Coupons GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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
      include: {
        store: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only STORE_OWNER and USER employees can create coupons
    if (!['STORE_OWNER', 'USER'].includes(user.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // For employees, check if they belong to a store
    if (user.role !== 'STORE_OWNER' && !user.storeId) {
      return NextResponse.json({ error: 'Employee not assigned to any store' }, { status: 403 });
    }

    // Get store ID based on user role
    let storeId;
    if (user.role === 'STORE_OWNER') {
      if (!user.store) {
        return NextResponse.json({ error: 'Store not found' }, { status: 404 });
      }
      storeId = user.store.id;
    } else {
      storeId = user.storeId!;
    }

    const body = await request.json();
    const {
      code,
      discount,
      usageLimit,
       
    } = body;

    // Validate required fields
    if (!code || !discount) {
      return NextResponse.json({ error: 'Code and discount are required' }, { status: 400 });
    }

    if (discount <= 0 || discount > 800) {
      return NextResponse.json({ error: 'Discount must be between 1 and 800' }, { status: 400 });
    }

    // Check if coupon code already exists in this store
    const existingCoupon = await prisma.coupon.findFirst({
      where: {
        code: code,
        storeId: storeId
      }
    });

    if (existingCoupon) {
      return NextResponse.json({ error: 'Coupon code already exists in this store' }, { status: 400 });
    }

    // Set expiration date to 1 day from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);

    // Create new coupon
    const newCoupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        discount: discount,
        usageLimit: usageLimit || null,
        expiresAt: expiresAt,
        isActive: true,
        storeId: storeId,
        userId: user.id
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    });

    // Add status and usage info
    const couponWithStatus = {
      ...newCoupon,
      creator: newCoupon.user,
      status: 'active',
      usageCount: 0,
      remainingUses: newCoupon.usageLimit ? newCoupon.usageLimit : null
    };

    return NextResponse.json({ coupon: couponWithStatus });

  } catch (error) {
    console.error('Coupon creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
