import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json(
        { message: "Mã giảm giá không được để trống" },
        { status: 400 }
      );
    }

    const discountCode = await prisma.coupon.findUnique({
      where: { code },
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
    if (discountCode.expires_at && new Date(discountCode.expires_at) < new Date()) {
      return NextResponse.json(
        { isValid: false, message: "Mã giảm giá đã hết hạn" },
        { status: 200 }
      );
    }

    // Check if code has reached its usage limit
    if (
      discountCode.usageLimit !== null &&
      discountCode.currentUsage >= discountCode.usageLimit
    ) {
      return NextResponse.json(
        { isValid: false, message: "Mã giảm giá đã được sử dụng hết" },
        { status: 200 }
      );
    }

    // Success: increment the usage count
    await prisma.coupon.update({
      where: { id: discountCode.id },
      data: { currentUsage: { increment: 1 } },
    });

    return NextResponse.json({
      isValid: true,
      message: "Mã giảm giá hợp lệ",
      amount: discountCode.discount,
    });
  } catch (error) {
    console.error("Error verifying discount code:", error);
    return NextResponse.json(
      { message: "Đã xảy ra lỗi khi xác thực mã giảm giá" },
      { status: 500 }
    );
  }
}