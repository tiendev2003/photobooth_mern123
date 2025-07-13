import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// GET - Lấy bảng giá mặc định cho step/session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");
    const userId = searchParams.get("userId");

    // Tìm bảng giá theo thứ tự ưu tiên:
    // 1. Pricing của user cụ thể (nếu có userId)
    // 2. Pricing của store cụ thể (nếu có storeId)  
    // 3. Pricing global mặc định

    if (userId) {
      // Tìm pricing của user trước
      const userPricing = await prisma.pricing.findFirst({
        where: {
          userId: userId,
          isActive: true,
          isDefault: true
        },
        include: {
          user: {
            select: { id: true, name: true, username: true }
          },
          store: {
            select: { id: true, name: true }
          }
        }
      });

      if (userPricing) {
        return NextResponse.json(userPricing);
      }

      // Nếu không có user pricing, tìm store pricing
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { storeId: true }
      });

      if (user?.storeId) {
        const storePricing = await prisma.pricing.findFirst({
          where: {
            storeId: user.storeId,
            isActive: true,
            isDefault: true
          },
          include: {
            user: {
              select: { id: true, name: true, username: true }
            },
            store: {
              select: { id: true, name: true }
            }
          }
        });

        if (storePricing) {
          return NextResponse.json(storePricing);
        }
      }
    } else if (storeId) {
      // Tìm pricing của store
      const storePricing = await prisma.pricing.findFirst({
        where: {
          storeId: storeId,
          isActive: true,
          isDefault: true
        },
        include: {
          user: {
            select: { id: true, name: true, username: true }
          },
          store: {
            select: { id: true, name: true }
          }
        }
      });

      if (storePricing) {
        return NextResponse.json(storePricing);
      }
    }

    // Fallback: Tìm global pricing mặc định
    const globalPricing = await prisma.pricing.findFirst({
      where: {
        userId: null,
        storeId: null,
        isActive: true,
        isDefault: true
      },
      include: {
        user: {
          select: { id: true, name: true, username: true }
        },
        store: {
          select: { id: true, name: true }
        }
      }
    });

    if (globalPricing) {
      return NextResponse.json(globalPricing);
    }

    // Nếu không có pricing mặc định, lấy pricing hoạt động đầu tiên
    const firstActivePricing = await prisma.pricing.findFirst({
      where: { isActive: true },
      include: {
        user: {
          select: { id: true, name: true, username: true }
        },
        store: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: "asc" }
    });

    if (!firstActivePricing) {
      return NextResponse.json(
        { error: "No active pricing found" },
        { status: 404 }
      );
    }

    return NextResponse.json(firstActivePricing);
  } catch (error) {
    console.error("Error fetching default pricing:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
