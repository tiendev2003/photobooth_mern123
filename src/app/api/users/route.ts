import { prisma } from '@/lib/prisma';
import { Prisma, Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/users - Get all users with pagination
export async function GET(req: NextRequest) {
  try {
    // Get pagination parameters from URL
    const searchParams = req.nextUrl.searchParams;
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    const searchQuery = searchParams.get('search') || '';
    const roleFilter = searchParams.get('role'); // Add role filter
    
    // Set default pagination values
    const page = pageParam ? parseInt(pageParam) : 1;
    const limit = limitParam ? parseInt(limitParam) : 10;
    const skip = (page - 1) * limit;
    
    // Filter criteria
    const where: Prisma.UserWhereInput = {
      ...(searchQuery && {
        OR: [
          { name: { contains: searchQuery } },
          { username: { contains: searchQuery } },
          { email: { contains: searchQuery } }
        ]
      })
    };
    if (roleFilter) {
      // Support multiple roles separated by comma
      const roles = roleFilter.split(',').map(r => r.trim()).filter(Boolean);
      if (roles.length > 1) {
        where.role = { in: roles as Role[] };
      } else {
        where.role = roles[0] as Role;
      }
    }
    
    // Get total count for pagination metadata
    const totalUsers = await prisma.user.count({ where });
    
    // Get paginated users
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        phone: true,
        address: true,
        createdAt: true,
        updatedAt: true,
        storeId: true,
        store: {
          select: {
            id: true,
            name: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalUsers / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return NextResponse.json({
      users,
      pagination: {
        total: totalUsers,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/users - Create a new user
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, username, email, password, role, phone, address } = body;

    // Validate required fields
    if (!name || !username || !password) {
      return NextResponse.json({ error: 'Name, username, and password are required' }, { status: 400 });
    }

    // Check if user with this username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return NextResponse.json({ 
        error: 'Tên đăng nhập đã tồn tại', 
        details: 'Username này đã được sử dụng, vui lòng chọn tên đăng nhập khác',
        field: 'username'
      }, { status: 409 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user
    const newUser = await prisma.user.create({
      data: {
        name,
        username,
        email,
        password: hashedPassword,
        role: role || 'USER',
        phone,
        address
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        phone: true,
        address: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    
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
      
      if (error.message.includes('Invalid input')) {
        return NextResponse.json({ 
          error: 'Dữ liệu không hợp lệ', 
          details: 'Vui lòng kiểm tra lại các thông tin đã nhập',
          originalError: error.message
        }, { status: 400 });
      }
    }
    
    return NextResponse.json({ 
      error: 'Lỗi hệ thống', 
      details: 'Đã xảy ra lỗi không mong muốn khi tạo người dùng. Vui lòng thử lại sau.'
    }, { status: 500 });
  }
}
