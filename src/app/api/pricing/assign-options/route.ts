import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

interface UserSelect {
  id: string;
  name: string;
  username: string;
  role: string;
  storeId: string | null;
  store: {
    name: string;
  } | null;
}

interface StoreSelect {
  id: string;
  name: string;
  isActive: boolean;
}

// GET - Lấy danh sách users và stores để assign pricing
export async function GET(request: NextRequest) {
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

    let users: UserSelect[] = [];
    let stores: StoreSelect[] = [];

    if (user.role === "ADMIN") {
      // Admin có thể thấy tất cả users và stores
      users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
          storeId: true,
          store: {
            select: { name: true }
          }
        },
        where: {
          isActive: true
        },
        orderBy: { name: "asc" }
      });

      stores = await prisma.store.findMany({
        select: {
          id: true,
          name: true,
          isActive: true
        },
        where: {
          isActive: true
        },
        orderBy: { name: "asc" }
      });
    } else if (user.role === "STORE_OWNER" || user.role === "MANAGER") {
      // Store owner/manager chỉ thấy users trong store của mình
      users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
          storeId: true,
          store: {
            select: { name: true }
          }
        },
        where: {
          storeId: user.storeId,
          isActive: true
        },
        orderBy: { name: "asc" }
      });

      if (user.storeId) {
        const store = await prisma.store.findUnique({
          where: { id: user.storeId },
          select: {
            id: true,
            name: true,
            isActive: true
          }
        });
        if (store) {
          stores = [store];
        }
      }
    } else {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      users,
      stores
    });
  } catch (error) {
    console.error("Error fetching assign options:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
