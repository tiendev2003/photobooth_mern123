"use client";

import { useAuth } from '@/lib/context/AuthContext';

interface EmployeeWelcomeProps {
  storeName: string;
}

export default function EmployeeWelcome({ storeName }: EmployeeWelcomeProps) {
  const { user } = useAuth();

  if (user?.role === 'STORE_OWNER') return null;

  return (
    <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center">
        <svg className="h-5 w-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="text-sm font-medium text-blue-800">
            Chào mừng <strong>{user?.name}</strong> đến với hệ thống quản lý {storeName}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Bạn có thể xem doanh thu máy và quản lý mã giảm giá tại đây.
          </p>
        </div>
      </div>
    </div>
  );
}
