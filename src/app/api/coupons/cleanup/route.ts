import { markExpiredCoupons } from "@/lib/cron/couponCleaner";
import { NextResponse } from "next/server";

/**
 * API endpoint để đánh dấu các mã giảm giá đã hết hạn
 * POST /api/coupons/cleanup
 */
export async function POST() {
  try {
    
    const result = await markExpiredCoupons();
    return NextResponse.json(result);
 
  } catch (error) {
    console.error("Error in coupon cleanup:", error);
    return NextResponse.json(
      {
        error: `Failed to cleanup expired coupons: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}
