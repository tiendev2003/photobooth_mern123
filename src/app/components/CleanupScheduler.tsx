'use client';

import { useEffect } from 'react';

/**
 * Component kiểm tra cleanup theo định kỳ
 * Sử dụng phía client để khởi tạo timer kiểm tra dọn dẹp
 */
export default function CleanupScheduler() {
  // Hàm kiểm tra cleanup
  const checkCleanup = async () => {
    try {
      const response = await fetch('/api/cron/cleanup-check');
      const data = await response.json();
      
      if (data.cleanupRan) {
        console.log('Cleanup check ran and performed cleanup');
      } else {
        console.log('Cleanup check ran, no cleanup needed');
      }
    } catch (error) {
      console.error('Error checking cleanup:', error);
    }
  };

  useEffect(() => {
    // Kiểm tra ngay khi component được mount
    checkCleanup();
    
    // Thiết lập kiểm tra định kỳ mỗi 1 giờ
    const interval = setInterval(checkCleanup, 60 * 60 * 1000);
    
    // Dọn dẹp khi component unmount
    return () => clearInterval(interval);
  }, []);

  // Component này không render gì cả
  return null;
}
