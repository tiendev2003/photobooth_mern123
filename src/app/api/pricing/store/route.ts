import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// GET - Lấy bảng giá cho store
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
      include: { store: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.storeId) {
      return NextResponse.json(
        { error: "User not associated with any store" },
        { status: 400 }
      );
    }

    // Lấy tất cả user IDs trong store này
    const storeUsers = await prisma.user.findMany({
      where: { storeId: user.storeId },
      select: { id: true },
    });
    const userIds = storeUsers.map((u) => u.id);

    // Lấy tất cả pricing của store này và pricing của users trong store
    const pricings = await prisma.pricing.findMany({
      where: {
        OR: [
          { storeId: user.storeId },
          {
            userId: {
              in: userIds,
            },
          },
        ],
      },
      include: {
        user: {
          select: { id: true, name: true, username: true },
        },
        store: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(pricings);
  } catch (error) {
    console.error("Error fetching store pricings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
