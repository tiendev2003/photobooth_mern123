"use client";

import { useAuth } from '@/lib/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    if (!isLoading) {
      // If not logged in, redirect to login
      if (!user) {
        router.push('/login');
        return;
      }
      
      // If logged in but not admin/ketoan and trying to access admin pages
      if (pathname.startsWith('/admin') && !isAdmin) {
        router.push('/');
        return;
      }
    }
  }, [user, isLoading, isAdmin, router, pathname]);
  
  // Show nothing while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // If not authenticated, don't render children
  if (!user || (pathname.startsWith('/admin') && !isAdmin)) {
    return null;
  }
  
  // User is authenticated and authorized, render children
  return <>{children}</>;
}
