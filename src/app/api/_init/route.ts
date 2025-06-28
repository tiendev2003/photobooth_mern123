'use server';

import '@/lib/cron';

// Hàm này chỉ để khởi tạo cron jobs khi ứng dụng Next.js khởi động
export async function init() {
  console.log('Server initialization complete. Cron jobs are running.');
}
