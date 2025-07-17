import { prisma } from "../prisma";

/**
 * Hàm kiểm tra và đánh dấu các mã giảm giá đã hết hạn
 * Không xóa mã giảm giá để giữ lại thông tin cho báo cáo doanh thu
 */
export async function markExpiredCoupons() {
  try {
    const now = new Date();
    
    // Tìm tất cả mã giảm giá đã hết hạn nhưng vẫn đang active
    const expiredCoupons = await prisma.coupon.findMany({
      where: {
        expiresAt: {
          lt: now // Các mã có expiresAt nhỏ hơn thời gian hiện tại
        },
        isActive: true // Chỉ xử lý các mã đang active
      },
      select: {
        id: true,
        code: true,
        expiresAt: true
      }
    });
    
    if (expiredCoupons.length === 0) {
      console.log('Không có mã giảm giá nào hết hạn cần xử lý');
      return { 
        success: true, 
        markedCount: 0, 
        message: 'Không có mã giảm giá nào hết hạn cần xử lý' 
      };
    }
    
    // Lấy danh sách ID của các mã giảm giá hết hạn
    const expiredIds = expiredCoupons.map(coupon => coupon.id);
    
    // Cập nhật trạng thái isActive = false cho tất cả mã hết hạn
    const updateResult = await prisma.coupon.updateMany({
      where: {
        id: {
          in: expiredIds
        }
      },
      data: {
        isActive: false
      }
    });
    
    console.log(`Đã đánh dấu ${updateResult.count} mã giảm giá hết hạn`);
    
    return {
      success: true,
      markedCount: updateResult.count,
      message: `Đã đánh dấu ${updateResult.count} mã giảm giá hết hạn`,
      affectedCoupons: expiredCoupons.map(c => ({
        id: c.id,
        code: c.code,
        expiresAt: c.expiresAt
      }))
    };
    
  } catch (error) {
    console.error('Lỗi khi đánh dấu mã giảm giá hết hạn:', error);
    return {
      success: false,
      markedCount: 0,
      message: `Lỗi khi đánh dấu mã giảm giá hết hạn: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`
    };
  }
}
