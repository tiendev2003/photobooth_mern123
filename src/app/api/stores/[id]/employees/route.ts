import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { NextRequest, NextResponse } from "next/server";

// GET - Lấy danh sách nhân viên
export async function GET(
  request: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
  try {
    const storeId = (await params).id;

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        id: true,
        name: true,
        maxEmployees: true,
        employees: {
          select: {
            id: true,
            name: true,
            email: true,
            username:true,
            phone: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    return NextResponse.json({ store });
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Tạo nhân viên mới
export async function POST(
  request: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
  try {
    const storeId = (await params).id;

    const body = await request.json();
    const { name, username, email, password, phone, role = "USER" } = body;

    // Kiểm tra store tồn tại và giới hạn nhân viên
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: { _count: { select: { employees: true } } },
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // Thông báo nếu vượt quá giới hạn nhưng vẫn cho phép thêm
    let warning = null;
    if (store._count.employees >= store.maxEmployees) {
      warning = `Cửa hàng đã đạt giới hạn nhân viên (${store.maxEmployees}). Vẫn thêm nhân viên này nhưng nên cân nhắc tăng giới hạn.`;
    }

    // Kiểm tra username đã tồn tại
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 400 }
      );
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo nhân viên mới
    const employee = await prisma.user.create({
      data: {
        name,
        username,
        email,
        password: hashedPassword,
        phone,
        role,
        storeId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ 
      employee,
      warning
    });
  } catch (error) {
    console.error("Error creating employee:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
