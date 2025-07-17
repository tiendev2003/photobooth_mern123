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

    // kiểm tra co tồn tại cửa hàng ko
    const existingStore = await prisma.store.findUnique({
      where: { id: storeId },
    });
    if (!existingStore) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // kiểm tra nếu logo cũ khác logo mới thì gọi api xóa
    if (logo != existingStore.logo && existingStore.logo) {
      const oldLogoFileName = existingStore.logo.split("/").pop();
      await fetch(
        `${process.env.NEXT_PUBLIC_EXTERNAL_DOMAIN}/api.php?action=delete_store_file&filename=${oldLogoFileName}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
    // kiểm tra nếu background cũ khác background mới thì gọi api xóa
    if (background != existingStore.background && existingStore.background) {
      const oldBackgroundFileName = existingStore.background.split("/").pop();
      await fetch(
        `${process.env.NEXT_PUBLIC_EXTERNAL_DOMAIN}/api.php?action=delete_store_file&filename=${oldBackgroundFileName}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

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
    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";

    // Lấy thông tin cửa hàng với số lượng dữ liệu liên quan
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        _count: {
          select: {
            employees: true,
            frameTemplates: true,
            coupons: true,
            revenues: true,
          },
        },
      },
    });

    if (!store) {
      return NextResponse.json(
        { error: "Không tìm thấy cửa hàng" },
        { status: 404 }
      );
    }

    const totalRelatedData =
      store._count.employees +
      store._count.frameTemplates +
      store._count.coupons +
      store._count.revenues;

    // Nếu không có tham số force và còn dữ liệu liên quan, từ chối xóa
    if (!force && totalRelatedData > 0) {
      const details = [];
      if (store._count.employees > 0)
        details.push(`${store._count.employees} nhân viên`);
      if (store._count.frameTemplates > 0)
        details.push(`${store._count.frameTemplates} template khung ảnh`);
      if (store._count.coupons > 0)
        details.push(`${store._count.coupons} mã giảm giá`);
      if (store._count.revenues > 0)
        details.push(`${store._count.revenues} bản ghi doanh thu`);

      return NextResponse.json(
        {
          error: `Không thể xóa cửa hàng vì còn dữ liệu liên quan: ${details.join(
            ", "
          )}. Bạn có muốn xóa toàn bộ dữ liệu liên quan không?`,
          relatedData: {
            employees: store._count.employees,
            frameTemplates: store._count.frameTemplates,
            coupons: store._count.coupons,
            revenues: store._count.revenues,
            total: totalRelatedData,
          },
          canForceDelete: true,
        },
        { status: 400 }
      );
    }

    // Nếu có tham số force, xóa toàn bộ dữ liệu liên quan
    if (force && totalRelatedData > 0) {
      console.log(`Deleting all related data for store ${store.name}`);

      // Xóa theo thứ tự để tránh foreign key constraint

      // 1. Xóa các bản ghi sử dụng coupon (CouponUsage)
      if (store._count.coupons > 0) {
        const deletedCouponUsages = await prisma.couponUsage.deleteMany({
          where: {
            coupon: { storeId: storeId },
          },
        });
        console.log(`Deleted ${deletedCouponUsages.count} coupon usages`);
      }

      // 2. Xóa doanh thu (Revenue)
      if (store._count.revenues > 0) {
        const deletedRevenues = await prisma.revenue.deleteMany({
          where: { storeId: storeId },
        });
        console.log(`Deleted ${deletedRevenues.count} revenue records`);
      }

      // 3. Xóa mã giảm giá (Coupon)
      if (store._count.coupons > 0) {
        const deletedCoupons = await prisma.coupon.deleteMany({
          where: { storeId: storeId },
        });
        console.log(`Deleted ${deletedCoupons.count} coupons`);
      }

      // 4. Xóa frame templates
      if (store._count.frameTemplates > 0) {
        const deletedTemplates = await prisma.frameTemplate.deleteMany({
          where: { storeId: storeId },
        });
        console.log(`Deleted ${deletedTemplates.count} frame templates`);
      }

      // 5. Xóa nhân viên và tài khoản máy
      if (store._count.employees > 0) {
        // Xóa coupon usages của nhân viên trước
        await prisma.couponUsage.deleteMany({
          where: {
            user: { storeId: storeId },
          },
        });

        // Xóa nhân viên (trừ manager)
        const deletedEmployees = await prisma.user.deleteMany({
          where: {
            storeId: storeId,
            id: { not: store.managerId }, // Không xóa manager ở đây
          },
        });
        console.log(
          `Deleted ${deletedEmployees.count} employees and machine accounts`
        );
      }
    }

    // Lưu thông tin manager trước khi xóa store
    const managerId = store.managerId;
    const manager = await prisma.user.findUnique({
      where: { id: managerId },
      select: { id: true, name: true, storeId: true },
    });

    // Xóa cửa hàng
    await prisma.store.delete({
      where: { id: storeId },
    });

    // Xóa manager nếu manager thuộc về store này
    if (manager && manager.storeId === storeId) {
      await prisma.user.delete({
        where: { id: managerId },
      });
      console.log(`Deleted manager: ${manager.name}`);
    }

    const message =
      force && totalRelatedData > 0
        ? `Đã xóa cửa hàng "${store.name}" và toàn bộ dữ liệu liên quan thành công`
        : `Đã xóa cửa hàng "${store.name}" thành công`;

    return NextResponse.json({
      message,
      deletedData: force
        ? {
            employees: store._count.employees,
            frameTemplates: store._count.frameTemplates,
            coupons: store._count.coupons,
            revenues: store._count.revenues,
            total: totalRelatedData,
          }
        : null,
    });
  } catch (error) {
    console.error("Error deleting store:", error);
    return NextResponse.json(
      { error: "Lỗi hệ thống khi xóa cửa hàng" },
      { status: 500 }
    );
  }
}
