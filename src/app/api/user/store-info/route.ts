import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

// GET - Lấy thông tin store và frame templates cho user đăng nhập
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; email: string; role: string };
    
    // Lấy thông tin user
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            slogan: true,
            logo: true,
            background: true,
            primaryColor: true,
            secondaryColor: true,
            description: true,
            address: true,
            phone: true,
            email: true,
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Nếu user là ADMIN, không thuộc store nào
    if (user.role === "ADMIN") {
      return NextResponse.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        store: null,
        frameTemplates: [],
        message: "Admin có quyền truy cập tất cả cửa hàng"
      });
    }

    // Nếu user không thuộc store nào
    if (!user.store) {
      return NextResponse.json({ error: "User not assigned to any store" }, { status: 404 });
    }

    // Lấy frame templates của store (bao gồm cả global templates)
    const frameTemplates = await prisma.frameTemplate.findMany({
      where: {
        OR: [
          { storeId: user.store.id }, // Templates riêng của store
          { isGlobal: true }          // Templates toàn cục
        ],
        isActive: true
      },
      include: {
        frameType: {
          select: {
            id: true,
            name: true,
            description: true,
            image: true,
            columns: true,
            rows: true,
            totalImages: true,
            isCircle: true,
            isHot: true,
            isCustom: true,
          }
        }
      },
      orderBy: [
        { isGlobal: "asc" },  // Templates của store trước
        { createdAt: "desc" }
      ]
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      store: user.store,
      frameTemplates,
      totalTemplates: frameTemplates.length
    });
  } catch (error) {
    console.error("Error fetching user store info:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
