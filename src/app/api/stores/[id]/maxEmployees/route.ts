import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// PUT - Cập nhật giới hạn số lượng nhân viên của cửa hàng
export async function PUT(
  request: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
  try {
    const storeId = (await params).id;
    const { maxEmployees } = await request.json();

    // Validate input
    if (!maxEmployees || maxEmployees < 1 || isNaN(maxEmployees)) {
      return NextResponse.json(
        { error: "Số lượng nhân viên tối đa phải lớn hơn 0" },
        { status: 400 }
      );
    }

    // Kiểm tra store có tồn tại không
    const store = await prisma.store.findUnique({
      where: { id: storeId }
    });

    if (!store) {
      return NextResponse.json(
        { error: "Không tìm thấy cửa hàng" },
        { status: 404 }
      );
    }

    // Cập nhật giới hạn nhân viên
    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: { maxEmployees: parseInt(maxEmployees.toString()) },
    });

    return NextResponse.json({
      message: "Cập nhật giới hạn nhân viên thành công",
      store: updatedStore
    });
  } catch (error) {
    console.error("Error updating store employee limit:", error);
    return NextResponse.json(
      { error: "Lỗi hệ thống khi cập nhật giới hạn nhân viên" },
      { status: 500 }
    );
  }
}
