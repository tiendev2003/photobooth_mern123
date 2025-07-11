import { findUserById, sanitizeUser, updateUser } from '@/lib/models/User';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/users/[id] - Get a specific user by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    const user = await findUserById(id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(sanitizeUser(user), { status: 200 });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/users/[id] - Update a specific user by ID
export async function PUT(
  req: NextRequest,
{ params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    const body = await req.json();
    const { name, username, email, password, role, phone, address } = body;

    // Check if user exists
    const existingUser = await findUserById(id);

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user using our model function
    const updatedUser = await updateUser(id, {
      name,
      username,
      email,
      password,
      role,
      phone,
      address
    });

    if (!updatedUser) {
      return NextResponse.json({ 
        error: 'Không thể cập nhật người dùng', 
        details: 'Dữ liệu cập nhật không hợp lệ hoặc người dùng không tồn tại'
      }, { status: 500 });
    }

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error('Error updating user:', error);
    
    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint failed')) {
        if (error.message.includes('username')) {
          return NextResponse.json({ 
            error: 'Tên đăng nhập đã tồn tại', 
            details: 'Username này đã được sử dụng, vui lòng chọn tên đăng nhập khác',
            field: 'username'
          }, { status: 409 });
        }
      }
      
      if (error.message.includes('Record to update not found')) {
        return NextResponse.json({ 
          error: 'Người dùng không tồn tại', 
          details: 'Không tìm thấy người dùng cần cập nhật'
        }, { status: 404 });
      }
    }
    
    return NextResponse.json({ 
      error: 'Lỗi hệ thống', 
      details: 'Đã xảy ra lỗi không mong muốn khi cập nhật người dùng. Vui lòng thử lại sau.'
    }, { status: 500 });
  }
}

// DELETE /api/users/[id] - Delete a specific user by ID
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    const { prisma } = await import('@/lib/prisma');

    // Check if user exists
    const existingUser = await findUserById(id);

    if (!existingUser) {
      return NextResponse.json({ 
        error: 'Người dùng không tồn tại', 
        details: 'Không tìm thấy người dùng cần xóa'
      }, { status: 404 });
    }

    // Delete user
    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({ 
      message: 'Xóa người dùng thành công', 
      details: 'Người dùng đã được xóa khỏi hệ thống'
    }, { status: 200 });
  } catch (error) {
    console.error('Error deleting user:', error);
    
    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Foreign key constraint failed')) {
        return NextResponse.json({ 
          error: 'Không thể xóa người dùng', 
          details: 'Người dùng này có dữ liệu liên quan trong hệ thống. Vui lòng liên hệ admin để được hỗ trợ.'
        }, { status: 409 });
      }
      
      if (error.message.includes('Record to delete does not exist')) {
        return NextResponse.json({ 
          error: 'Người dùng không tồn tại', 
          details: 'Người dùng có thể đã bị xóa trước đó'
        }, { status: 404 });
      }
    }
    
    return NextResponse.json({ 
      error: 'Lỗi hệ thống', 
      details: 'Đã xảy ra lỗi không mong muốn khi xóa người dùng. Vui lòng thử lại sau.'
    }, { status: 500 });
  }
}
