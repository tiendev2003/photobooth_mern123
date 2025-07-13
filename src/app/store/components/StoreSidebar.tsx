"use client";

import LogoutButton from '@/app/components/LogoutButton';
import { useAuth } from '@/lib/context/AuthContext';
import {
  BarChart2,
  DollarSign,
  Edit,
  FileText,
  Image,
  Tag,
  Users,
  X
} from 'react-feather';

interface StoreSidebarProps {
  store: {
    name: string;
    slogan?: string;
    logo?: string;
  };
  activeTab: string;
  onTabChange: (tab: string) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function StoreSidebar({
  store,
  activeTab,
  onTabChange,
  isSidebarOpen,
  onToggleSidebar
}: StoreSidebarProps) {
  const { user } = useAuth();

  const tabs = [
    { key: 'overview', label: 'Tổng quan', icon: BarChart2, roles: ['STORE_OWNER'] },
    { key: 'revenues', label: 'Doanh thu máy', icon: DollarSign, roles: ['STORE_OWNER', 'USER', 'MACHINE'] },
    { key: 'machine-revenues', label: 'Chi tiết máy', icon: DollarSign, roles: ['STORE_OWNER', 'USER', 'MACHINE'] },
    { key: 'pricing', label: 'Bảng giá', icon: Tag, roles: ['STORE_OWNER', 'MANAGER'] },
    { key: 'coupons', label: 'Mã giảm giá', icon: Tag, roles: ['STORE_OWNER', 'USER'] },
    { key: 'templates', label: 'Mẫu khung ảnh', icon: Image, roles: ['STORE_OWNER'] },
    { key: 'employees', label: 'Nhân viên', icon: Users, roles: ['STORE_OWNER'] },
    { key: 'settings', label: 'Thông tin cửa hàng', icon: FileText, roles: ['STORE_OWNER'] },
    { key: 'edit', label: 'Chỉnh sửa cửa hàng', icon: Edit, roles: ['STORE_OWNER'] },
  ].filter(tab => tab.roles.includes(user?.role || ''));

  const handleTabClick = (tabKey: string) => {
    onTabChange(tabKey);
    if (window.innerWidth < 768) {
      onToggleSidebar();
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onToggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-screen w-64
        bg-white dark:bg-gray-800
        shadow-lg z-50
        flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Store Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center flex-1 min-w-0">
            {store.logo && (
              <Image src={store.logo ?? ""} alt="Logo" className="h-8 w-8 mr-3 rounded-lg object-cover" />
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{store.name}</h1>
              {store.slogan && (
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{store.slogan}</p>
              )}
            </div>
          </div>
          <button
            className="rounded-full p-1 hover:bg-gray-200 dark:hover:bg-gray-700 md:hidden"
            onClick={onToggleSidebar}
          >
            <X className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 bg-white dark:bg-gray-800">
          <ul>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <li key={tab.key} className="mb-1">
                  <button
                    onClick={() => handleTabClick(tab.key)}
                    className={`w-full flex items-center px-4 py-3 text-sm rounded-lg transition-colors ${
                      activeTab === tab.key
                        ? 'bg-blue-100 text-blue-700 font-medium dark:bg-blue-900 dark:text-blue-200'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="inline-flex items-center justify-center w-5 h-5 mr-2">
                      <Icon size={18} />
                    </span>
                    <span className="truncate">{tab.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.role === 'STORE_OWNER' ? 'Chủ cửa hàng' : user?.role}
              </p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </aside>
    </>
  );
}
