import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// API để gán hoặc hủy gán người dùng cho cửa hàng
export async function PUT(
  request: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = (await params).id;
    const { storeId } = await request.json();

    // Kiểm tra user có tồn tại không
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Nếu storeId là null, nghĩa là hủy gán user khỏi store
    if (storeId === null) {
      // Hủy gán user khỏi store hiện tại
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { storeId: null },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          role: true,
          storeId: true,
          store: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
      
      return NextResponse.json({
        message: 'User has been unassigned from store',
        user: updatedUser
      });
    }

    // Kiểm tra store có tồn tại không
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: { _count: { select: { employees: true } } },
    });

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    // Thông báo nếu store đã đạt giới hạn nhân viên, nhưng vẫn cho phép thêm
    let warning = null;
    if (store._count.employees >= store.maxEmployees) {
      warning = `Cửa hàng đã đạt giới hạn nhân viên (${store.maxEmployees}). Vẫn gán người dùng này cho cửa hàng nhưng nên cân nhắc tăng giới hạn.`;
    }

    // Gán user cho store
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { storeId: storeId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        storeId: true,
        store: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'User has been assigned to store',
      user: updatedUser,
      warning
    });
  } catch (error) {
    console.error('Error assigning user to store:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
