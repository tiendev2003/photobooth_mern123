"use client";

import { useAuth } from '@/lib/context/AuthContext';
import { useState } from 'react';
import { Menu } from 'react-feather';
import Sidebar from './Sidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className="flex-1 flex flex-col md:pl-64">
        <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              className="md:hidden rounded-md p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              onClick={toggleSidebar}
            >
              <Menu size={24} />
            </button>
            
            <div className="flex-1 px-4 md:px-0"></div>
            
            <div className="flex items-center">
              <div className="ml-3 relative">
                <div className="flex items-center">
                  <span className="hidden md:inline-block mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {user?.name}
                  </span>
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                    {user?.name?.[0] || 'U'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
