import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

// GET - Lấy danh sách doanh thu với phân trang và filter
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { 
      id: string; 
      email: string; 
      role: string 
    };
    
    // Lấy thông tin user
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { store: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Chỉ admin, manager và store owner mới có thể xem doanh thu
    if (!['ADMIN', 'MANAGER', 'STORE_OWNER'].includes(user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    
    // Filters
    const storeId = url.searchParams.get('storeId');
    const userId = url.searchParams.get('userId');
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');

    // Define type for where clause with nested date filters
    interface WhereClause {
      storeId?: string;
      userId?: string;
      createdAt?: {
        gte?: Date;
        lte?: Date;
      };
    }

    // Build where clause based on user role and filters
    const whereClause: WhereClause = {};

    // Role-based filtering
    if ((user.role as string) === 'STORE_OWNER' && user.storeId) {
      whereClause.storeId = user.storeId;
    } else if (user.role === 'MANAGER') {
      // Manager có thể xem tất cả hoặc theo store được chỉ định
      if (storeId) {
        whereClause.storeId = storeId;
      }
    }
    // ADMIN có thể xem tất cả

    // Apply additional filters
    if (storeId && user.role === 'ADMIN') {
      whereClause.storeId = storeId;
    }
    if (userId) {
      whereClause.userId = userId;
    }
    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) {
        whereClause.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        whereClause.createdAt.lte = new Date(dateTo + 'T23:59:59.999Z');
      }
    }

    // Get total count for pagination
    const total = await prisma.revenue.count({ where: whereClause });

    // Get revenues with relations
    const revenues = await prisma.revenue.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            machineCode: true
          }
        },
        store: {
          select: {
            id: true,
            name: true
          }
        },
        coupon: {
          select: {
            id: true,
            code: true,
            discount: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    // Calculate statistics
    const stats = await prisma.revenue.aggregate({
      where: whereClause,
      _sum: {
        amount: true,
        discountAmount: true
      },
      _avg: {
        amount: true
      },
      _count: true
    });

    const pagination = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    };

    return NextResponse.json({
      revenues,
      pagination,
      stats: {
        totalRevenue: stats._sum.amount || 0,
        totalTransactions: stats._count || 0,
        averageTransaction: stats._avg.amount || 0,
        totalDiscount: stats._sum.discountAmount || 0
      }
    });

  } catch (error) {
    console.error("Error fetching revenues:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Tạo doanh thu mới (chỉ cho MACHINE hoặc USER trong cửa hàng)
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { 
      id: string; 
      email: string; 
      role: string 
    };
    
    // Lấy thông tin user
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { store: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Chỉ USER hoặc MACHINE trong cửa hàng mới có thể tạo doanh thu
    if (!['USER', 'MACHINE'].includes(user.role) || !user.storeId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { amount, description, couponId } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const originalAmount = amount;
    let discountAmount = 0;
    let finalAmount = amount;
    let couponToUse = null;
 
    // Xử lý mã giảm giá nếu có
    if (couponId) {
      couponToUse = await prisma.coupon.findUnique({
        where: { id: couponId }
      });

      if (couponToUse) {
        // Kiểm tra mã giảm giá có hợp lệ không
        if (couponToUse.isActive && 
            couponToUse.expiresAt > new Date() &&
            (!couponToUse.usageLimit || couponToUse.currentUsage < couponToUse.usageLimit)) {
          
          // Kiểm tra mã giảm giá có áp dụng cho cửa hàng này không
          if (!couponToUse.storeId || couponToUse.storeId === user.storeId) {
            discountAmount = Math.round(originalAmount * (couponToUse.discount / 100));
            finalAmount = originalAmount - discountAmount;

            // Cập nhật số lần sử dụng coupon
            await prisma.coupon.update({
              where: { id: couponId },
              data: { currentUsage: { increment: 1 } }
            });
          }
        }
      }
    }

    // Tạo doanh thu
    const revenue = await prisma.revenue.create({
      data: {
        amount: finalAmount,
        description,
        userId: user.id,
        storeId: user.storeId,
        couponId: couponToUse ? couponToUse.id : null,
        originalAmount: originalAmount !== finalAmount ? originalAmount : null,
        discountAmount: discountAmount > 0 ? discountAmount : null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            machineCode: true
          }
        },
        store: {
          select: {
            id: true,
            name: true
          }
        },
        coupon: {
          select: {
            id: true,
            code: true,
            discount: true
          }
        }
      }
    });

    // Tạo CouponUsage record nếu sử dụng coupon
    if (couponToUse) {
      await prisma.couponUsage.create({
        data: {
          couponId: couponToUse.id,
          userId: user.id,
          revenueId: revenue.id
        }
      });
    }

    return NextResponse.json(revenue, { status: 201 });

  } catch (error) {
    console.error("Error creating revenue:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
