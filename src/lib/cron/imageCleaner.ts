/**
 * File này chứa các hàm tiện ích cho việc dọn dẹp hình ảnh
 * Đã được chuyển sang giải pháp không sử dụng node-cron
 */

// Hàm để chạy công việc theo yêu cầu (không chờ lịch trình)
export async function runImageCleanupManually() {
  console.log('Running media cleanup manually...');
  try {
    // Sử dụng fetch để gọi API thay vì trực tiếp sử dụng function
    const apiUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${apiUrl}/api/images/cleanup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Giả mạo header cho admin
        'x-user-role': 'ADMIN'
      },
    });
    
    const result = await response.json();
    console.log(`Manual media cleanup completed: ${result.deletedCount} files deleted.`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error in manual media cleanup:', error);
    throw error;
  }
}
