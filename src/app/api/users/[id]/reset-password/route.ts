import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { NextRequest, NextResponse } from "next/server";

// PUT - Reset mật khẩu user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = (await params).id;

    // Hash mật khẩu mới
    const hashedPassword = await bcrypt.hash('123456', 10);

    // Cập nhật mật khẩu
    const user = await prisma.user.update({
      where: { id: userId },
      data: { 
        password: hashedPassword,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
      },
    });

    return NextResponse.json({ 
      message: "Password reset successfully",
      user 
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
