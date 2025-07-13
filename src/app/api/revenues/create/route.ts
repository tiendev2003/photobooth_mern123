import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// POST - Tạo doanh thu với thông tin pricing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      amount, 
      description, 
      userId, 
      storeId, 
      couponId, 
      pricingId,
      originalAmount,
      discountAmount 
    } = body;

    // Validate required fields
    if (!amount || !userId || !storeId) {
      return NextResponse.json(
        { error: "Missing required fields: amount, userId, storeId" },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Verify store exists
    const store = await prisma.store.findUnique({
      where: { id: storeId }
    });

    if (!store) {
      return NextResponse.json(
        { error: "Store not found" },
        { status: 404 }
      );
    }

    // Create revenue
    const revenue = await prisma.revenue.create({
      data: {
        amount,
        description,
        userId,
        storeId,
        couponId: couponId || null,
        pricingId: pricingId || null,
        originalAmount: originalAmount || null,
        discountAmount: discountAmount || null,
      },
      include: {
        user: {
          select: { id: true, name: true, username: true }
        },
        store: {
          select: { id: true, name: true }
        },
        coupon: {
          select: { id: true, code: true, discount: true }
        },
        pricing: {
          select: { 
            id: true, 
            name: true, 
            priceOnePhoto: true,
            priceTwoPhoto: true,
            priceThreePhoto: true
          }
        }
      }
    });

    return NextResponse.json(revenue);
  } catch (error) {
    console.error("Error creating revenue:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
