import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import bcrypt from "bcrypt";
import { NextRequest, NextResponse } from "next/server";

// GET - Lấy danh sách cửa hàng
export async function GET(request: NextRequest) {
  try {
    console.log("Fetching stores...",request.url);
    const stores = await prisma.store.findMany({
      include: {
        manager: { select: { id: true, name: true, email: true } },
        _count: { select: { employees: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ stores });
  } catch (error) {
    console.error("Error fetching stores:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Tạo cửa hàng mới
export async function POST(request: NextRequest) {
  try {
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
      accountNumber,
      primaryColor,
      secondaryColor,
      maxEmployees,
      managerId,
    } = body;

    // Kiểm tra manager có tồn tại và chưa quản lý cửa hàng nào
    const manager = await prisma.user.findUnique({
      where: { id: managerId },
      include: { managedStores: true },
    });

    if (!manager) {
      return NextResponse.json({ error: "Manager not found" }, { status: 404 });
    }

    if (manager.role !== "MANAGER") {
      return NextResponse.json(
        { error: "User is not a store manager" },
        { status: 400 }
      );
    }

    // Tạo cửa hàng mới
    const store = await prisma.store.create({
      data: {
        name,
        slogan,
        logo,
        background,
        description,
        address,
        phone,
        email,
        accountNumber,
        primaryColor,
        secondaryColor,
        maxEmployees: maxEmployees || 10,
        managerId,
      },
      include: {
        manager: { select: { id: true, name: true, email: true } },
        _count: { select: { employees: true } },
      },
    });

    // Tự động tạo 10 user ngẫu nhiên cho store
    const numberOfUsers = 10;
    const users = [];
    
    for (let i = 1; i <= numberOfUsers; i++) {
      const randomId = Math.floor(Math.random() * 10000);
      const hashedPassword = await bcrypt.hash('123456', 10);
      const storeCode = name.toLowerCase().replace(/\s+/g, '').substring(0, 10);
      const userData = {
        name: `Nhân viên ${i}`,
        username: `${storeCode}_nv${i}_${randomId}`,
        email: `nhanvien${i}_${randomId}@${storeCode}.com`,
        password: hashedPassword,
        role: Role.USER,
        storeId: store.id,
        isActive: true,
      };
      
      try {
        const user = await prisma.user.create({
          data: userData,
        });
        users.push(user);
      } catch (error) {
        console.error(`Error creating user ${i}:`, error);
        // Nếu username trùng thì thử lại với random id khác
        const newRandomId = Math.floor(Math.random() * 10000);
        userData.username = `${storeCode}_nv${i}_${newRandomId}`;
        userData.email = `nhanvien${i}_${newRandomId}@${storeCode}.com`;
        try {
          const user = await prisma.user.create({
            data: userData,
          });
          users.push(user);
        } catch (retryError) {
          console.error(`Error creating user ${i} on retry:`, retryError);
        }
      }
    }

    console.log(`Created ${users.length} users for store ${store.name}`);

    return NextResponse.json({ 
      store, 
      message: `Store created successfully with ${users.length} employees`,
      createdUsers: users.length
    });
  } catch (error) {
    console.error("Error creating store:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
