import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET - Lấy thông tin cửa hàng
export async function GET(
  request: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
  try {
    const storeId = (await params).id;

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        manager: { select: { id: true, name: true, email: true, phone: true } },
        employees: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        },
        frameTemplates: {
          include: {
            frameType: true,
          },
        },
        _count: { select: { employees: true } },
      },
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    return NextResponse.json({ store });
  } catch (error) {
    console.error("Error fetching store:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Cập nhật thông tin cửa hàng
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const storeId = (await params).id;

    const body = await request.json();
    const {
      name,
      slogan,
      logo,
      background,
      description,
      address,
      phone,
      email,
      primaryColor,
      secondaryColor,
      maxEmployees,
      isActive,
    } = body;

    const store = await prisma.store.update({
      where: { id: storeId },
      data: {
        name,
        slogan,
        logo,
        background,
        description,
        address,
        phone,
        email,
        primaryColor,
        secondaryColor,
        maxEmployees,
        isActive,
      },
      include: {
        manager: { select: { id: true, name: true, email: true } },
        _count: { select: { employees: true } },
      },
    });

    return NextResponse.json({ store });
  } catch (error) {
    console.error("Error updating store:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Xóa cửa hàng
export async function DELETE(
  request: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
  try {
    const storeId = (await params).id;

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: { _count: { select: { employees: true } } },
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // Kiểm tra xem cửa hàng có nhân viên không
    if (store._count.employees > 0) {
      return NextResponse.json(
        { error: "Cannot delete store with employees" },
        { status: 400 }
      );
    }

    await prisma.store.delete({
      where: { id: storeId },
    });

    return NextResponse.json({ message: "Store deleted successfully" });
  } catch (error) {
    console.error("Error deleting store:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
