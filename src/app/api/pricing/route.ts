import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// GET - Lấy bảng giá hoạt động hoặc tất cả bảng giá
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const getAll = searchParams.get("all") === "true";

    if (getAll) {
      // Chỉ admin mới có thể xem tất cả bảng giá
      const authHeader = request.headers.get("Authorization");
      if (!authHeader) {
        return NextResponse.json(
          { error: "No authorization header" },
          { status: 401 }
        );
      }

      const token = authHeader.replace("Bearer ", "");
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: string;
        email: string;
        role: string;
      };

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user || user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Only admin can view all pricing" },
          { status: 403 }
        );
      }

      const pricings = await prisma.pricing.findMany({
        orderBy: [
          { isDefault: "desc" },
          { isActive: "desc" },
          { createdAt: "desc" },
        ],
      });

      return NextResponse.json(pricings);
    } else {
      // Lấy bảng giá mặc định hoặc bảng giá đang hoạt động
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
    }
  } catch (error) {
    console.error("Error fetching pricing:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Tạo hoặc cập nhật bảng giá (chỉ admin)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "No authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      email: string;
      role: string;
    };
    console.log("Decoded JWT:", decoded);
    // Chỉ admin mới có quyền tạo/cập nhật bảng giá
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admin can manage pricing" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      id,
      name,
      priceOnePhoto,
      priceTwoPhoto,
      priceThreePhoto,
      isDefault,
    } = body;

    // Validate required fields
    if (
      !name ||
      priceOnePhoto === undefined ||
      priceTwoPhoto === undefined ||
      priceThreePhoto === undefined
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: name, priceOnePhoto, priceTwoPhoto, priceThreePhoto",
        },
        { status: 400 }
      );
    }

    // Validate prices are positive numbers
    if (priceOnePhoto < 0 || priceTwoPhoto < 0 || priceThreePhoto < 0) {
      return NextResponse.json(
        { error: "Prices must be positive numbers" },
        { status: 400 }
      );
    }

    let pricing;

    if (id) {
      // Cập nhật bảng giá hiện có
      // Nếu đặt làm mặc định, bỏ mặc định của các bảng giá khác
      if (isDefault) {
        await prisma.pricing.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
      }

      pricing = await prisma.pricing.update({
        where: { id },
        data: {
          name,
          priceOnePhoto,
          priceTwoPhoto,
          priceThreePhoto,
          isDefault: !!isDefault,
          updatedAt: new Date(),
        },
      });
    } else {
      // Tạo bảng giá mới
      // Nếu đặt làm mặc định, bỏ mặc định của các bảng giá khác
      if (isDefault) {
        await prisma.pricing.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
      }

      pricing = await prisma.pricing.create({
        data: {
          name,
          priceOnePhoto,
          priceTwoPhoto,
          priceThreePhoto,
          isDefault: !!isDefault,
        },
      });
    }

    return NextResponse.json(pricing);
  } catch (error) {
    console.error("Error creating/updating pricing:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Xóa bảng giá
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "No authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      email: string;
      role: string;
    };

    // Chỉ admin mới có quyền xóa
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admin can delete pricing" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const pricingId = searchParams.get("id");

    if (!pricingId) {
      return NextResponse.json(
        { error: "Pricing ID is required" },
        { status: 400 }
      );
    }

    await prisma.pricing.delete({
      where: { id: pricingId },
    });

    return NextResponse.json({ message: "Pricing deleted successfully" });
  } catch (error) {
    console.error("Error deleting pricing:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
