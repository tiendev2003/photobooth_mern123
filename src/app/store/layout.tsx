"use client";

import AuthGuard from '@/app/components/AuthGuard';
import { useAuth } from '@/lib/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface StoreLayoutProps {
  children: React.ReactNode;
}

export default function StoreLayout({ children }: StoreLayoutProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      // Only STORE_OWNER can access store dashboard
      if (user.role !== 'STORE_OWNER' && user.role !== 'USER') {
        router.push('/');
        return;
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-purple-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
          <p className="text-white">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'STORE_OWNER' && user.role !== 'USER') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-purple-900">
        <p className="text-white">Bạn không có quyền truy cập trang này</p>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    </AuthGuard>
  );
}
