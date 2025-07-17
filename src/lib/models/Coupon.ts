import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';

export interface CouponData {
  code: string;
  discount: number;
  expiresAt: Date;
  userId?: string | null;
  storeId?: string | null;
  isActive?: boolean;
  usageLimit?: number | null;
  currentUsage?: number;
}

export async function getAllCoupons(options?: { 
  page?: number; 
  limit?: number; 
  search?: string;
  includeInactive?: boolean;
}) {
  // Default values
  const page = options?.page || 1;
  const limit = options?.limit || 10;
  const search = options?.search || '';
  const includeInactive = options?.includeInactive || false;
  const skip = (page - 1) * limit;
  
  // Search conditions
  let where: Prisma.CouponWhereInput = search ? {
    OR: [
      { code: { contains: search } }
    ]
  } : {};
  
  // Only show active coupons by default
  if (!includeInactive) {
    where = {
      ...where,
      isActive: true
    };
  };
  
  // Get total count for pagination
  const totalCoupons = await prisma.coupon.count({ where });
  
  // Get paginated coupons
  const coupons = await prisma.coupon.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
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
  const totalPages = Math.ceil(totalCoupons / limit);
  
  return {
    coupons,
    pagination: {
      total: totalCoupons,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
}

export async function getCouponById(id: string) {
  return prisma.coupon.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
}

export async function getCouponByCode(code: string) {
  return prisma.coupon.findUnique({
    where: { code },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
}

export async function createCoupon(data: CouponData) {
  return prisma.coupon.create({
    data: {
      code: data.code,
      discount: data.discount,
      expiresAt: data.expiresAt,
      userId: data.userId,
      storeId: data.storeId,
      usageLimit: data.usageLimit ?? null,
      isActive: data.isActive ?? true,
      currentUsage: data.currentUsage ?? 0
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      store: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
}

export async function updateCoupon(id: string, data: Partial<CouponData>) {
  return prisma.coupon.update({
    where: { id },
    data,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
}

export async function deleteCoupon(id: string) {
  return prisma.coupon.delete({
    where: { id }
  });
}

export async function isExpiredCoupon(coupon: { expiresAt: Date }) {
  const now = new Date();
  return now > coupon.expiresAt;
}

export async function validateCoupon(code: string) {
  const coupon = await getCouponByCode(code);
  
  if (!coupon) {
    return { valid: false, message: 'Coupon không tồn tại' };
  }

  if (await isExpiredCoupon(coupon)) {
    return { valid: false, message: 'Coupon đã hết hạn', coupon };
  }

  return { valid: true, coupon };
}
