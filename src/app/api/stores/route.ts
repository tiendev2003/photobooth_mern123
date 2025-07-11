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
        manager: true,
        _count: { 
          select: { 
            employees: true 
          } 
        },
        employees: {
          select: {
            id: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });
console.log("Fetched stores:", stores.length);
    // Tính toán số lượng nhân viên và máy cho mỗi store
    const storesWithCounts = stores.map(store => {
      const employeeCount = store.employees.filter(emp => emp.role === Role.USER).length;
      const machineCount = store.employees.filter(emp => emp.role === Role.MACHINE).length;
      
      return {
        ...store,
        _count: {
          employees: store._count.employees,
          employeesOnly: employeeCount,
          machines: machineCount
        },
        employees: undefined // Remove detailed employee data from response
      };
    });

    return NextResponse.json({ stores: storesWithCounts });
  } catch (error) {
    console.error("Error fetching stores:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
      maxAccounts,
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

    if (manager.role !== "MANAGER" && manager.role !== "STORE_OWNER") {
      return NextResponse.json(
        { error: "User must be a MANAGER or STORE_OWNER to manage a store" },
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
        maxAccounts: maxAccounts || 20,
        managerId,
      },
      include: {
        manager: { select: { id: true, name: true, email: true } },
        _count: { select: { employees: true } },
      },
    });

    // Tự động tạo tài khoản nhân viên theo số lượng maxEmployees
    const numberOfEmployees = maxEmployees || 10;
    const numberOfMachineAccounts = maxAccounts || 20;
    const users = [];
    const storeCode = name.toLowerCase().replace(/\s+/g, '').substring(0, 10);
    
    // Tạo tài khoản nhân viên (USER role)
    for (let i = 1; i <= numberOfEmployees; i++) {
      const randomId = Math.floor(Math.random() * 10000);
      const hashedPassword = await bcrypt.hash('123456', 10);
      
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
        console.error(`Error creating employee ${i}:`, error);
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
          console.error(`Error creating employee ${i} on retry:`, retryError);
        }
      }
    }

    // Tạo tài khoản máy (MACHINE role)
    for (let i = 1; i <= numberOfMachineAccounts; i++) {
      const randomId = Math.floor(Math.random() * 10000);
      const hashedPassword = await bcrypt.hash('123456', 10);
      const machineCode = `${storeCode.toUpperCase()}-M${i.toString().padStart(2, '0')}`;
      
      const machineData = {
        name: `Máy chụp ảnh ${i}`,
        username: `${storeCode}_may${i}_${randomId}`,
        email: `may${i}_${randomId}@${storeCode}.com`,
        password: hashedPassword,
        role: Role.MACHINE,
        storeId: store.id,
        machineCode: machineCode,
        location: `Vị trí máy ${i}`,
        isActive: true,
      };
      
      try {
        const machine = await prisma.user.create({
          data: machineData,
        });
        users.push(machine);
      } catch (error) {
        console.error(`Error creating machine account ${i}:`, error);
        // Nếu username trùng thì thử lại với random id khác
        const newRandomId = Math.floor(Math.random() * 10000);
        machineData.username = `${storeCode}_may${i}_${newRandomId}`;
        machineData.email = `may${i}_${newRandomId}@${storeCode}.com`;
        try {
          const machine = await prisma.user.create({
            data: machineData,
          });
          users.push(machine);
        } catch (retryError) {
          console.error(`Error creating machine account ${i} on retry:`, retryError);
        }
      }
    }
    await prisma.user.update({
      where: { id: managerId },
      data: { storeId: store.id },
    });
    
    console.log(`Created ${users.length} accounts for store ${store.name} (${numberOfEmployees} employees + ${numberOfMachineAccounts} machines)`);

    return NextResponse.json({ 
      store, 
      message: `Store created successfully with ${numberOfEmployees} employees and ${numberOfMachineAccounts} machine accounts`,
      createdUsers: users.length,
      createdEmployees: numberOfEmployees,
      createdMachines: numberOfMachineAccounts
    });
  } catch (error) {
    console.error("Error creating store:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
