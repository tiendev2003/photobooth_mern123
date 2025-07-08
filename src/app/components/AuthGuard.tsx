"use client";

import { useAuth } from '@/lib/context/AuthContext';
import { getLoginUrl, isAdminDomain } from '@/lib/domainConfig';
import { Loader2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const { user, token, isLoading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  // Determine if we're on the admin subdomain
  const isAdminDomainActive = typeof window !== 'undefined' && 
    (isAdminDomain() || pathname.startsWith('/admin'));

  useEffect(() => {
    if (!isLoading) {
      // If not logged in, redirect to appropriate login page
      if (!user || !token) {
        router.push(getLoginUrl(isAdminDomainActive));
        return;
      }

      // If admin access is required but user is not an admin
      if (requireAdmin && !isAdmin) {
        // If on admin domain but not admin, redirect to client login
        if (isAdminDomainActive) {
          router.push('/login');
        }
        return;
      }
      
      // If user is not admin and trying to access admin routes, redirect them
      if (!isAdmin && pathname.startsWith('/admin')) {
        router.push('/');
        return;
      }
    }
  }, [user, token, isLoading, isAdmin, router, pathname, requireAdmin, isAdminDomainActive]);

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

  // If admin access is required but user is not an admin
  if (requireAdmin && !isAdmin) {
    return null;
  }

  // User is authenticated and authorized, render children
  return <>{children}</>;
}
