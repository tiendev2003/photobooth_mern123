import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { code, totalAmount } = await req.json();

    if (!code) {
      return NextResponse.json(
        { message: "Mã giảm giá không được để trống" },
        { status: 400 }
      );
    }

    // Verify authentication from token (required)
    let currentUser = null;
    const authHeader = req.headers.get("Authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Yêu cầu xác thực người dùng" },
        { status: 401 }
      );
    }
    
    try {
      const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; email: string; role: string };

      currentUser = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: { store: true },
      });
      
      if (!currentUser) {
        return NextResponse.json(
          { message: "Không tìm thấy thông tin người dùng" },
          { status: 404 }
        );
      }
    } catch (error) {
      console.error("Token verification failed:", error);
      return NextResponse.json(
        { message: "Token xác thực không hợp lệ" },
        { status: 401 }
      );
    }

    const discountCode = await prisma.coupon.findUnique({
      where: { code },
      include: {
        store: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            storeId: true,
          },
        },
      },
    });

    if (!discountCode) {
      return NextResponse.json(
        { isValid: false, message: "Mã giảm giá không tồn tại" },
        { status: 200 }
      );
    }

    // Check if code is active
    if (!discountCode.isActive) {
      return NextResponse.json(
        { isValid: false, message: "Mã giảm giá đã bị vô hiệu hóa" },
        { status: 200 }
      );
    }

    // Check if code has expired
    if (
      discountCode.expiresAt &&
      new Date(discountCode.expiresAt) < new Date()
    ) {
      return NextResponse.json(
        { isValid: false, message: "Mã giảm giá đã hết hạn" },
        { status: 200 }
      );
    }

    if (
      discountCode.usageLimit !== null &&
      discountCode.currentUsage >= discountCode.usageLimit
    ) {
      return NextResponse.json(
        { isValid: false, message: "Mã giảm giá đã được sử dụng hết" },
        { status: 200 }
      );
    }
    if (discountCode.storeId) {
      // Kiểm tra store của user có khớp với store của coupon không
      if (currentUser.storeId !== discountCode.storeId) {
        return NextResponse.json(
          {
            isValid: false,
            message: `Mã giảm giá không tồn tại`,
          },
          { status: 200 }
        );
      }

      if (discountCode.isStoreOnly) {
        if (
          !currentUser.storeId ||
          currentUser.storeId !== discountCode.storeId
        ) {
          return NextResponse.json(
            {
              isValid: false,
              message: "Mã giảm giá không tồn tại",
            },
            { status: 200 }
          );
        }
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Cập nhật số lần sử dụng của mã giảm giá
      const updatedCoupon = await tx.coupon.update({
        where: { id: discountCode.id },
        data: { currentUsage: { increment: 1 } },
      });

      // 2. Xác định thông tin từ người dùng đã xác thực
      const finalUserId = currentUser.id;
      const finalStoreId = currentUser.storeId || discountCode.storeId;

      if (!finalStoreId) {
        throw new Error(
          "Không thể xác định thông tin store để tạo record doanh thu"
        );
      }

      const originalAmount = totalAmount || discountCode.discount;
      const discountAmount = Math.min(discountCode.discount, originalAmount);
      const finalAmount = Math.max(0, originalAmount - discountAmount);

      // 3. Tạo record doanh thu
      const revenue = await tx.revenue.create({
        data: {
          amount: finalAmount,
          originalAmount: originalAmount,
          discountAmount: discountAmount,
          description: `Sử dụng mã giảm giá ${discountCode.code}`,
          userId: finalUserId,
          storeId: finalStoreId,
          couponId: discountCode.id,
        },
      });

      // 4. Tạo record lịch sử sử dụng mã giảm giá
      await tx.couponUsage.create({
        data: {
          couponId: discountCode.id,
          userId: finalUserId,
          revenueId: revenue.id,
        },
      });

      return {
        updatedCoupon,
        revenue,
        discountAmount,
      };
    });

    return NextResponse.json({
      isValid: true,
      message: "Mã giảm giá hợp lệ",
      amount: result.discountAmount,
      coupon: {
        id: discountCode.id,
        code: discountCode.code,
        discount: discountCode.discount,
        storeName: discountCode.store?.name,
        userName: discountCode.user?.name,
        remainingUsage: discountCode.usageLimit
          ? discountCode.usageLimit - discountCode.currentUsage - 1
          : null,
      },
      revenue: {
        id: result.revenue.id,
        originalAmount: result.revenue.originalAmount,
        discountAmount: result.revenue.discountAmount,
        finalAmount: result.revenue.amount,
      },
    });
  } catch (error) {
    console.error("Error verifying discount code:", error);
    return NextResponse.json(
      { message: "Đã xảy ra lỗi khi xác thực mã giảm giá" },
      { status: 500 }
    );
  }
}
