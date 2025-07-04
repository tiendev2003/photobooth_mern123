"use client";

import { useAuth } from '@/lib/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, token, isLoading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      // If not logged in, redirect to login
      if (!user || !token) {
        router.push('/login');
        return;
      }

    }
  }, [user, token, isLoading, isAdmin, router, pathname]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-purple-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
          <p className="text-white">Đang xác thực...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show nothing (redirect will happen)
  if (!user || !token) {
    return null;
  }



  // User is authenticated and authorized, render children
  return <>{children}</>;
}
