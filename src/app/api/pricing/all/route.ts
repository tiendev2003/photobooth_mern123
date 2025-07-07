import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// GET - Lấy tất cả bảng giá (chỉ admin)
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
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admin can view all pricing" },
        { status: 403 }
      );
    }

    const pricings = await prisma.pricing.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(pricings);
  } catch (error) {
    console.error("Error fetching all pricing:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
