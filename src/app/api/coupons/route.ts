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
    const { code, discount, expires_at, user_id, usageLimit, isActive } = body;

    // Validate required fields
    if (!code || !discount || !expires_at) {
      return NextResponse.json({ 
        error: 'Coupon code, discount, and expiration date are required' 
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

    // If user_id is provided, verify the user exists
    if (user_id) {
      const { findUserById } = await import('@/lib/models/User');
      const userExists = await findUserById(user_id);

      if (!userExists) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
    }

    // Tạo coupon mới sử dụng model
    const couponData: CouponData = {
      code,
      discount: parseFloat(discount.toString()),
      expires_at: new Date(expires_at),
      user_id,
      usageLimit: usageLimit === undefined ? null : usageLimit,
      isActive: isActive === undefined ? true : isActive
    };
    
    const newCoupon = await createCoupon(couponData);

    return NextResponse.json(newCoupon, { status: 201 });
  } catch (error) {
    console.error('Error creating coupon:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
