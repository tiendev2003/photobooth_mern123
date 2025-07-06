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
    
    if (!decoded.id) {
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        store: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Allow STORE_OWNER and store employees to access
    if (!['STORE_OWNER', 'USER', 'MACHINE'].includes(user.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // For employees, check if they belong to a store
    if (user.role !== 'STORE_OWNER' && !user.storeId) {
      return NextResponse.json({ error: 'Employee not assigned to any store' }, { status: 403 });
    }

    // Get store ID based on user role
    let storeId;
    if (user.role === 'STORE_OWNER') {
      if (!user.store) {
        return NextResponse.json({ error: 'Store not found' }, { status: 404 });
      }
      storeId = user.store.id;
    } else {
      storeId = user.storeId!;
    }

    // Get date from query params or use today
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    
    let targetDate = new Date();
    if (dateParam) {
      targetDate = new Date(dateParam);
    }
    
    // Set time to start of day
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Get all machines (employees with MACHINE role) in the store
    const machines = await prisma.user.findMany({
      where: {
        storeId: storeId,
        role: 'MACHINE',
        isActive: true
      },
      select: {
        id: true,
        name: true,
        machineCode: true,
        location: true,
      },
      orderBy: { machineCode: 'asc' }
    });

    // Get revenue data for each machine on the target date
    const machineRevenuesPromises = machines.map(async (machine) => {
      const [revenues, totalRevenue] = await Promise.all([
        // Get individual transactions for this machine
        prisma.revenue.findMany({
          where: {
            userId: machine.id,
            createdAt: {
              gte: targetDate,
              lt: nextDay
            }
          },
          include: {
            coupon: {
              select: {
                code: true,
                discount: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        
        // Get total revenue for this machine
        prisma.revenue.aggregate({
          where: {
            userId: machine.id,
            createdAt: {
              gte: targetDate,
              lt: nextDay
            }
          },
          _sum: {
            amount: true
          },
          _count: {
            id: true
          }
        })
      ]);

      return {
        machineId: machine.id,
        machineName: machine.name,
        machineCode: machine.machineCode || 'N/A',
        location: machine.location || '',
        todayRevenue: totalRevenue._sum.amount || 0,
        totalTransactions: totalRevenue._count.id || 0,
        revenues: revenues
      };
    });

    const machineRevenues = await Promise.all(machineRevenuesPromises);

    // Calculate total for all machines
    const totalRevenue = machineRevenues.reduce((sum, machine) => sum + machine.todayRevenue, 0);
    const totalTransactions = machineRevenues.reduce((sum, machine) => sum + machine.totalTransactions, 0);

    return NextResponse.json({
      date: targetDate.toISOString().split('T')[0],
      totalRevenue,
      totalTransactions,
      machines: machineRevenues
    });

  } catch (error) {
    console.error('Machine revenues error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
