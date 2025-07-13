import { Prisma, PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// GET - Lấy bảng giá mặc định cho step/session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");
    const userId = searchParams.get("userId");

    console.log('Fetching pricing with params:', { userId, storeId });

    // Tạo where clause theo thứ tự ưu tiên
    const whereClause: Prisma.PricingWhereInput = { isActive: true };

    // Tìm bảng giá theo thứ tự ưu tiên:
    if (userId) {
      // 1. Pricing của user cụ thể
      whereClause.OR = [
        { userId: userId, isDefault: true },
        { userId: userId },
        { storeId: null, userId: null, isDefault: true } // Global fallback
      ];
    } else if (storeId) {
      // 2. Pricing của store cụ thể
      whereClause.OR = [
        { storeId: storeId, isDefault: true },
        { storeId: storeId },
        { storeId: null, userId: null, isDefault: true } // Global fallback
      ];
    } else {
      // 3. Chỉ lấy global pricing
      whereClause.storeId = null;
      whereClause.userId = null;
      whereClause.isDefault = true;
    }

    const pricing = await prisma.pricing.findFirst({
      where: whereClause,
      include: {
        user: {
          select: { id: true, name: true, username: true }
        },
        store: {
          select: { id: true, name: true }
        }
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    if (pricing) {
      console.log('Found pricing:', pricing.name);
      return NextResponse.json(pricing);
    }

    // Fallback cuối cùng: lấy bất kỳ pricing active nào
    const fallbackPricing = await prisma.pricing.findFirst({
      where: { isActive: true },
      include: {
        user: {
          select: { id: true, name: true, username: true }
        },
        store: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    if (!fallbackPricing) {
      return NextResponse.json(
        { error: "No active pricing found" },
        { status: 404 }
      );
    }

    console.log('Found fallback pricing:', fallbackPricing.name);
    return NextResponse.json(fallbackPricing);
  } catch (error) {
    console.error("Error fetching default pricing:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
