import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// GET - Lấy bảng giá mặc định (không cần auth)
export async function GET(request: NextRequest) {
  console.log("Fetching default pricing...", await request.json());
  try {
    const pricing = await prisma.pricing.findFirst({
      where: {
        isActive: true,
        isDefault: true,
      },
    });

    if (!pricing) {
      // Nếu không có bảng giá mặc định, lấy bảng giá hoạt động đầu tiên
      const activePricing = await prisma.pricing.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      });

      if (!activePricing) {
        return NextResponse.json(
          { error: "No active pricing found" },
          { status: 404 }
        );
      }

      return NextResponse.json(activePricing);
    }

    return NextResponse.json(pricing);
  } catch (error) {
    console.error("Error fetching default pricing:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
