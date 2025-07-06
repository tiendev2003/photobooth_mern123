import { prisma } from '@/lib/prisma';
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
    
    // Get user with store information
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        store: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Allow STORE_OWNER and store employees (USER, MACHINE) to access
    if (!['STORE_OWNER', 'USER', 'MACHINE'].includes(user.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // For employees, check if they belong to a store
    if (user.role !== 'STORE_OWNER' && !user.storeId) {
      return NextResponse.json({ error: 'Employee not assigned to any store' }, { status: 403 });
    }

    // Get store information based on user role
    let store;
    let storeId;
    
    if (user.role === 'STORE_OWNER') {
      if (!user.store) {
        return NextResponse.json({ error: 'Store not found' }, { status: 404 });
      }
      store = user.store;
      storeId = user.store.id;
    } else {
      // For employees, get store information
      store = await prisma.store.findUnique({
        where: { id: user.storeId! }
      });
      if (!store) {
        return NextResponse.json({ error: 'Store not found' }, { status: 404 });
      }
      storeId = store.id;
    }

    // Get store employees (USER and MACHINE roles)
    const employees = await prisma.user.findMany({
      where: {
        storeId: storeId,
        role: {
          in: ['USER', 'MACHINE']
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        machineCode: true,
        location: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get this month's date range
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    // Get revenue data
    const [revenues, todayRevenue, monthRevenue] = await Promise.all([
      // Recent revenues (last 20)
      prisma.revenue.findMany({
        where: {
          user: {
            storeId: storeId
          }
        },
        include: {
          user: {
            select: {
              name: true,
              role: true,
              machineCode: true,
            }
          },
          coupon: {
            select: {
              code: true,
              discount: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      }),
      
      // Today's revenue sum
      prisma.revenue.aggregate({
        where: {
          user: {
            storeId: storeId
          },
          createdAt: {
            gte: today,
            lt: tomorrow
          }
        },
        _sum: {
          amount: true
        }
      }),
      
      // This month's revenue sum
      prisma.revenue.aggregate({
        where: {
          user: {
            storeId: storeId
          },
          createdAt: {
            gte: startOfMonth,
            lt: startOfNextMonth
          }
        },
        _sum: {
          amount: true
        }
      })
    ]);

    // Prepare store data
    const storeData = {
      id: store.id,
      name: store.name,
      slogan: store.slogan,
      logo: store.logo,
      background: store.background,
      description: store.description,
      address: store.address,
      phone: store.phone,
      email: store.email,
      primaryColor: store.primaryColor,
      secondaryColor: store.secondaryColor,
      maxEmployees: store.maxEmployees,
      maxAccounts: store.maxAccounts,
      employees,
      revenues,
      todayRevenue: todayRevenue._sum.amount || 0,
      monthRevenue: monthRevenue._sum.amount || 0,
    };

    return NextResponse.json({ store: storeData });
  } catch (error) {
    console.error('Store dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const {
      name,
      slogan,
      description,
      address,
      phone,
      email,
      primaryColor,
      secondaryColor,
      logo,
      background,
    } = body;

    // Update store information
    const updatedStore = await prisma.store.update({
      where: { id: user.storeId },
      data: {
        name,
        slogan,
        description,
        address,
        phone,
        email,
        primaryColor,
        secondaryColor,
        logo,
        background,
      },
    });

    return NextResponse.json(updatedStore);
  } catch (error) {
    console.error('Store update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
