import { CouponData, createCoupon, getAllCoupons } from '@/lib/models/Coupon';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/coupons - Get all coupons with pagination
export async function GET(req: NextRequest) {
  try {
    // Get pagination parameters from URL
    const searchParams = req.nextUrl.searchParams;
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    const searchQuery = searchParams.get('search') || '';
    
    // Set pagination options
    const options = {
      page: pageParam ? parseInt(pageParam) : 1,
      limit: limitParam ? parseInt(limitParam) : 10,
      search: searchQuery
    };
    
    // Get paginated coupons
    const result = await getAllCoupons(options);
    
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/coupons - Create a new coupon
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, discount, store_id, usageLimit = 1, isActive = true } = body;

    // Validate required fields
    if (!code || !discount) {
      return NextResponse.json({ 
        error: 'Coupon code and discount are required' 
      }, { status: 400 });
    }

    // Validate discount range
    if (discount <= 0 || discount > 800) {
      return NextResponse.json({
        error: 'Discount must be between 1 and 800'
      }, { status: 400 });
    }

    // Kiểm tra coupon bằng hàm helper
    const { prisma } = await import('@/lib/prisma');
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code }
    });

    if (existingCoupon) {
      return NextResponse.json({ error: 'Coupon with this code already exists' }, { status: 409 });
    }

    // Validate store exists if store_id is provided
    if (store_id) {
      const store = await prisma.store.findUnique({
        where: { id: store_id }
      });

      if (!store) {
        return NextResponse.json({ error: 'Store not found' }, { status: 404 });
      }
    }

    // Set expiration to 1 day from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);

    // Tạo coupon mới sử dụng model
    const couponData: CouponData = {
      code: code.toUpperCase(),
      discount: parseFloat(discount.toString()),
      expiresAt: expiresAt,
      userId: null, // Admin created coupons don't have specific user
      storeId: store_id || null, // null for global coupons
      usageLimit: parseInt(usageLimit.toString()),
      isActive: isActive
    };
    
    const newCoupon = await createCoupon(couponData);

    return NextResponse.json(newCoupon, { status: 201 });
  } catch (error) {
    console.error('Error creating coupon:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
