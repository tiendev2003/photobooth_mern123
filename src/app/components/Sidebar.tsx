"use client";

import { useAuth } from '@/lib/context/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  DollarSign,
  Grid,
  Home,
  Image,
  Layers,
  LogOut,
  Package,
  Tag,
  Users,
  X
} from 'react-feather';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

export default function Sidebar({ isOpen, toggleSidebar }: SidebarProps) {
  const { logout, user } = useAuth();
  const pathname = usePathname();
  
  const menuItems = [
    { href: '/admin', label: 'Bảng điều khiển', icon: Grid },
    { href: '/admin/users', label: 'Người dùng', icon: Users },
    { href: '/admin/frames', label: 'Loại khung', icon: Layers },
    { href: '/admin/templates', label: 'Mẫu khung', icon: Image },
    { href: '/admin/coupons', label: 'Mã giảm giá', icon: Tag },
    ];

  // Thêm menu Stores cho ADMIN và MANAGER
  if (user?.role === 'ADMIN' || user?.role === 'MANAGER') {
    menuItems.splice(1, 0, { href: '/admin/stores', label: 'Cửa hàng', icon: Home });
  }

  // Thêm menu Pricing cho ADMIN
  if (user?.role === 'ADMIN') {
    menuItems.push({ href: '/admin/pricing', label: 'Bảng giá', icon: Package });
  }

  // Thêm menu Revenues cho ADMIN, MANAGER, và STORE_OWNER
  if (user?.role === 'ADMIN' || user?.role === 'MANAGER' || (user?.role as string) === 'STORE_OWNER') {
    menuItems.push({ href: '/admin/revenues', label: 'Doanh thu', icon: DollarSign });
  }

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity duration-300 ease-in-out md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`} 
        onClick={toggleSidebar}
      />
      
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 shadow-lg z-30
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Quản trị viên</h2>
          <button 
            className="rounded-full p-1 hover:bg-gray-200 dark:hover:bg-gray-700 md:hidden"
            onClick={toggleSidebar}
          >
            <X className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        
        <nav className="mt-4 px-2">
          <ul>
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href} className="mb-1">
                  <Link
                    href={item.href}
                    onClick={toggleSidebar}
                    className={`
                      flex items-center px-4 py-3 text-sm rounded-lg
                      ${pathname === item.href
                        ? 'bg-blue-100 text-blue-700 font-medium dark:bg-blue-900 dark:text-blue-200'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    <span className="inline-flex items-center justify-center w-5 h-5 mr-2">
                      <Icon size={18} />
                    </span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={logout}
            className="flex items-center justify-center w-full px-4 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <LogOut size={18} className="mr-2" />
            Đăng xuất
          </button>
        </div>
      </aside>
    </>
  );
}
