"use client";

import { useAuth } from '@/lib/context/AuthContext';
import { useEffect, useState } from 'react';

interface DashboardStats {
  userCount: number;
  frameTypesCount: number;
  templatesCount: number;
  imagesCount: number;
  couponsCount: number;
  storesCount: number;
  revenueCount?: number;
}

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        // Fetch user count
        const userResponse = await fetch('/api/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = await userResponse.json();
        
        // Fetch frame types count
        const frameTypesResponse = await fetch('/api/frame-types', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const frameTypesData = await frameTypesResponse.json();
        
        // Fetch templates count
        const templatesResponse = await fetch('/api/frame-templates', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const templatesData = await templatesResponse.json();
        
        // Fetch images count
        const imagesResponse = await fetch('/api/images', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const imagesData = await imagesResponse.json();
        
        // Fetch coupons count
        const couponsResponse = await fetch('/api/coupons', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const couponsData = await couponsResponse.json();
        
        // Fetch stores count
        const storesResponse = await fetch('/api/stores', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const storesData = await storesResponse.json();
        
        setStats({
          userCount: userData.pagination?.total ?? userData.users?.length ?? 0,
          frameTypesCount: frameTypesData.pagination?.total ?? frameTypesData.data?.length ?? 0,
          templatesCount: templatesData.pagination?.total ?? templatesData.data?.length ?? 0,
          imagesCount: imagesData.pagination?.total ?? imagesData.images?.length ?? 0,
          couponsCount: couponsData.pagination?.total ?? couponsData.coupons?.length ?? 0,
          storesCount: storesData.stores?.length ?? 0,
        });
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    if (token) {
      fetchDashboardStats();
    }
  }, [token]);
  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Please log in to view the dashboard.</p>
      </div>
    );
  }
  if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-red-500">You do not have permission to view this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 my-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard title="Users" value={stats?.userCount || 0} icon="users" />
        <StatCard title="Frame Types" value={stats?.frameTypesCount || 0} icon="layers" />
        <StatCard title="Templates" value={stats?.templatesCount || 0} icon="image" />
        <StatCard title="Images" value={stats?.imagesCount || 0} icon="camera" />
        <StatCard title="Coupons" value={stats?.couponsCount || 0} icon="tag" />
        {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
          <StatCard title="Stores" value={stats?.storesCount || 0} icon="store" />
        )}
        {stats?.revenueCount && (
          <StatCard title="Revenue Records" value={stats.revenueCount} icon="money" />
        )}
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Welcome, {user?.name}!</h2>
        <p className="text-gray-600 dark:text-gray-400">
          This is your admin dashboard where you can manage all aspects of your photobooth application.
          Use the sidebar to navigate to different sections.
        </p>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: string;
}

function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
      <div className="flex items-center">
        <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900 rounded-full p-3">
          <svg className="h-6 w-6 text-blue-600 dark:text-blue-300" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            {icon === 'users' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>}
            {icon === 'layers' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>}
            {icon === 'image' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>}
            {icon === 'camera' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>}
            {icon === 'tag' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>}
            {icon === 'store' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>}
            {icon === 'money' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>}
          </svg>
        </div>
        <div className="ml-5">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</div>
          <div className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{value}</div>
        </div>
      </div>
    </div>
  );
}
