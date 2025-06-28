/**
 * Cron jobs đã được thay thế bằng giải pháp client-side timer
 * kết hợp với API route kiểm tra định kỳ
 * 
 * Xem:
 * 1. /src/app/components/CleanupScheduler.tsx - Client timer
 * 2. /src/app/api/cron/cleanup-check/route.ts - API kiểm tra cron
 */

export default function cronInit() {
  // Hàm này không làm gì cả, chỉ để giữ lại tương thích ngược
  return null;
}
