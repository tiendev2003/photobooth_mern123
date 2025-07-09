import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; email: string; role: string };
    
    // Validate decoded token has required fields
    if (!decoded.id) {
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || user.role !== 'STORE_OWNER') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (!user.storeId) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Get store employees
    const employees = await prisma.user.findMany({
      where: {
        storeId: user.storeId,
        role: {
          in: ['USER', 'MACHINE']
        }
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        machineCode: true,
        location: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error('Get employees error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; email: string; role: string };
    
    // Validate decoded token has required fields
    if (!decoded.id) {
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { store: true }
    });

    if (!user || user.role !== 'STORE_OWNER') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (!user.store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, username, email, password, role, machineCode, location } = body;

    // Validate required fields
    if (!name || !username || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if role is valid for store employees
    if (!['USER', 'MACHINE'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Only USER and MACHINE are allowed' },
        { status: 400 }
      );
    }

    // Check current employee count
    const currentEmployeeCount = await prisma.user.count({
      where: {
        storeId: user.storeId,
        role: {
          in: ['USER', 'MACHINE']
        }
      }
    });

    if (currentEmployeeCount >= user.store.maxAccounts) {
      return NextResponse.json(
        { error: `Maximum number of employees reached (${user.store.maxAccounts})` },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new employee
    const newEmployee = await prisma.user.create({
      data: {
        name,
        username,
        email,
        password: hashedPassword,
        role: role ,
        storeId: user.storeId,
        machineCode: role === 'MACHINE' ? machineCode : null,
        location: role === 'MACHINE' ? location : null,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        machineCode: true,
        location: true,
        isActive: true,
        createdAt: true,
      }
    });

    return NextResponse.json(newEmployee, { status: 201 });
  } catch (error) {
    console.error('Create employee error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
