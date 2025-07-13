import { Prisma, PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// GET - Lấy bảng giá hoạt động hoặc tất cả bảng giá
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const getAll = searchParams.get("all") === "true";
    const storeId = searchParams.get("storeId");
    const userId = searchParams.get("userId");

    if (getAll) {
      // Xác thực người dùng
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
        include: { store: true }
      });

      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      let whereClause: Prisma.PricingWhereInput = {};

      // Admin có thể xem tất cả
      if (user.role === "ADMIN") {
        // Không cần filter gì cả
      } 
      // Store Owner/Manager chỉ xem pricing của store mình và global
      else if (user.role === "STORE_OWNER" || user.role === "MANAGER") {
        whereClause = {
          OR: [
            { storeId: user.storeId },
            { userId: user.id },
            { AND: [{ storeId: null }, { userId: null }] } // Global pricing
          ]
        };
      }
      // User/Machine chỉ xem pricing được gán cho mình hoặc global
      else {
        whereClause = {
          OR: [
            { userId: user.id },
            { storeId: user.storeId },
            { AND: [{ storeId: null }, { userId: null }] } // Global pricing
          ]
        };
      }

      const pricings = await prisma.pricing.findMany({
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
          { isDefault: "desc" },
          { isActive: "desc" },
          { createdAt: "desc" },
        ],
      });

      return NextResponse.json(pricings);
    } else {
      // Lấy bảng giá mặc định dựa trên context
      const whereClause: Prisma.PricingWhereInput = {
        isActive: true,
      };

      if (storeId) {
        whereClause.OR = [
          { storeId: storeId, isDefault: true },
          { AND: [{ storeId: null }, { userId: null }, { isDefault: true }] }
        ];
      } else if (userId) {
        whereClause.OR = [
          { userId: userId, isDefault: true },
          { AND: [{ storeId: null }, { userId: null }, { isDefault: true }] }
        ];
      } else {
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
        }
      });

      if (!pricing) {
        // Nếu không có bảng giá mặc định, lấy bảng giá hoạt động đầu tiên
        const activePricing = await prisma.pricing.findFirst({
          where: { isActive: true },
          include: {
            user: {
              select: { id: true, name: true, username: true }
            },
            store: {
              select: { id: true, name: true }
            }
          },
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

// POST - Tạo hoặc cập nhật bảng giá
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

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { store: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Chỉ admin, store owner, và manager mới có quyền tạo/cập nhật bảng giá
    if (!["ADMIN", "STORE_OWNER", "MANAGER"].includes(user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
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
      userId,
      storeId,
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

    // Kiểm tra quyền assign pricing
    if (user.role !== "ADMIN") {
      // Store owner/manager chỉ có thể tạo pricing cho store của mình hoặc user trong store
      if (storeId && storeId !== user.storeId) {
        return NextResponse.json(
          { error: "Can only create pricing for your own store" },
          { status: 403 }
        );
      }
      
      if (userId) {
        const targetUser = await prisma.user.findUnique({
          where: { id: userId }
        });
        if (!targetUser || targetUser.storeId !== user.storeId) {
          return NextResponse.json(
            { error: "Can only assign pricing to users in your store" },
            { status: 403 }
          );
        }
      }
    }

    let pricing;

    if (id) {
      // Cập nhật bảng giá hiện có
      const existingPricing = await prisma.pricing.findUnique({
        where: { id }
      });

      if (!existingPricing) {
        return NextResponse.json(
          { error: "Pricing not found" },
          { status: 404 }
        );
      }

      // Kiểm tra quyền edit
      if (user.role !== "ADMIN") {
        if (existingPricing.storeId !== user.storeId && existingPricing.userId !== user.id) {
          return NextResponse.json(
            { error: "Can only edit your own pricing" },
            { status: 403 }
          );
        }
      }

      // Nếu đặt làm mặc định, bỏ mặc định của các bảng giá khác trong cùng scope
      if (isDefault) {
        const whereClause: Prisma.PricingWhereInput = { isDefault: true };
        if (storeId) {
          whereClause.storeId = storeId;
        } else if (userId) {
          whereClause.userId = userId;
        } else {
          whereClause.AND = [{ storeId: null }, { userId: null }];
        }

        await prisma.pricing.updateMany({
          where: whereClause,
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
          userId: userId || null,
          storeId: storeId || null,
          updatedAt: new Date(),
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
    } else {
      // Tạo bảng giá mới
      // Nếu đặt làm mặc định, bỏ mặc định của các bảng giá khác trong cùng scope
      if (isDefault) {
        const whereClause: Prisma.PricingWhereInput = { isDefault: true };
        if (storeId) {
          whereClause.storeId = storeId;
        } else if (userId) {
          whereClause.userId = userId;
        } else {
          whereClause.AND = [{ storeId: null }, { userId: null }];
        }

        await prisma.pricing.updateMany({
          where: whereClause,
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
          userId: userId || null,
          storeId: storeId || null,
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

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { store: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Chỉ admin, store owner, và manager mới có quyền xóa
    if (!["ADMIN", "STORE_OWNER", "MANAGER"].includes(user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
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

    // Kiểm tra pricing có tồn tại và quyền xóa
    const existingPricing = await prisma.pricing.findUnique({
      where: { id: pricingId }
    });

    if (!existingPricing) {
      return NextResponse.json(
        { error: "Pricing not found" },
        { status: 404 }
      );
    }

    // Kiểm tra quyền xóa
    if (user.role !== "ADMIN") {
      if (existingPricing.storeId !== user.storeId && existingPricing.userId !== user.id) {
        return NextResponse.json(
          { error: "Can only delete your own pricing" },
          { status: 403 }
        );
      }
    }

    // Không cho phép xóa pricing mặc định cuối cùng
    if (existingPricing.isDefault) {
      const whereClause: Prisma.PricingWhereInput = { isDefault: true, id: { not: pricingId } };
      if (existingPricing.storeId) {
        whereClause.storeId = existingPricing.storeId;
      } else if (existingPricing.userId) {
        whereClause.userId = existingPricing.userId;
      } else {
        whereClause.AND = [{ storeId: null }, { userId: null }];
      }

      const otherDefaultPricing = await prisma.pricing.findFirst({
        where: whereClause
      });

      if (!otherDefaultPricing) {
        return NextResponse.json(
          { error: "Cannot delete the last default pricing" },
          { status: 400 }
        );
      }
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
