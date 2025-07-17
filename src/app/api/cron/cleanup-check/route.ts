'use server';

import { NextResponse } from 'next/server';

// Thời gian cuối cùng kiểm tra dọn dẹp
let lastCleanupCheck: number = 0;
// Thời gian giữa các lần kiểm tra (24 giờ tính bằng mili giây)
const CLEANUP_INTERVAL: number = 24 * 60 * 60 * 1000;

/**
 * Kiểm tra xem có nên thực hiện dọn dẹp không dựa trên thời gian cuối cùng
 * @returns True nếu cần thực hiện dọn dẹp
 */
function shouldRunCleanup(): boolean {
  const now = Date.now();
  if (now - lastCleanupCheck >= CLEANUP_INTERVAL) {
    lastCleanupCheck = now;
    return true;
  }
  return false;
}

/**
 * API route được gọi bởi các client request để kích hoạt kiểm tra và xóa file cũ
 * GET /api/cron/cleanup-check
 * - Kiểm tra liệu đã đến lúc dọn dẹp chưa (mỗi 24 giờ)
 * - Nếu đã đến lúc, gọi API cleanup images
 * - API này được thiết kế để được gọi bởi các request thông thường
 */
export async function GET() {
  try {
    // Kiểm tra xem có nên dọn dẹp không
    if (shouldRunCleanup()) {
      // Gọi API cleanup images
      const apiUrl = process.env.API_BASE_URL || 'http://localhost:3000';
      
      // Parallel requests for both cleanup operations
      const [imageCleanupResponse, couponCleanupResponse] = await Promise.all([
        fetch(`${apiUrl}/api/images/cleanup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-role': 'ADMIN'
          }
        }),
        fetch(`${apiUrl}/api/coupons/cleanup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-role': 'ADMIN'
          }
        })
      ]);
      
      const imageResult = await imageCleanupResponse.json();
      const couponResult = await couponCleanupResponse.json();
      
      console.log(`Scheduled cleanup completed: ${imageResult.deletedCount} files deleted.`);
      console.log(`Scheduled coupon cleanup completed: ${couponResult.markedCount} coupons marked as inactive.`);
      
      return NextResponse.json({
        success: true,
        message: 'Cleanup check ran successfully',
        cleanupRan: true,
        results: {
          images: imageResult,
          coupons: couponResult
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Cleanup check ran successfully',
      cleanupRan: false,
      nextCleanupIn: CLEANUP_INTERVAL - (Date.now() - lastCleanupCheck)
    });
  } catch (error) {
    console.error('Error in cleanup check:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to run cleanup check'
    }, { status: 500 });
  }
}
