'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Offline() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Kết nối đã được khôi phục!</h1>
        <p className="text-center mb-6">Bạn đã kết nối lại với internet.</p>
        <Link 
          href="/" 
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
        >
          Quay về trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Bạn đang ngoại tuyến</h1>
      <p className="text-center mb-6">
        S Photobooth hiện không thể kết nối với internet. Một số tính năng có thể không khả dụng cho đến khi bạn kết nối lại.
      </p>
      <div className="flex flex-col space-y-4">
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
        >
          Thử lại
        </button>
        <Link 
          href="/" 
          className="text-blue-500 hover:text-blue-600 text-center"
        >
          Quay về trang chủ
        </Link>
      </div>
    </div>
  );
}
