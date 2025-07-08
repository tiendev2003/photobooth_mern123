"use client";

import LogoutButton from '@/app/components/LogoutButton';
import { useAuth } from '@/lib/context/AuthContext';

interface StoreSidebarProps {
  store: {
    name: string;
    slogan?: string;
    logo?: string;
  };
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function StoreSidebar({ store, activeTab, onTabChange }: StoreSidebarProps) {
  const { user } = useAuth();

  const tabs = [
    { key: 'overview', label: 'Tổng quan', icon: '📊', roles: ['STORE_OWNER'] },
    { key: 'revenues', label: 'Doanh thu máy', icon: '💰', roles: ['STORE_OWNER', 'USER', 'MACHINE'] },
    { key: 'machine-revenues', label: 'Chi tiết máy', icon: '🎰', roles: ['STORE_OWNER', 'USER', 'MACHINE'] },
    { key: 'coupons', label: 'Mã giảm giá', icon: '🎫', roles: ['STORE_OWNER', 'USER'] },
    { key: 'templates', label: 'Mẫu khung ảnh', icon: '🖼️', roles: ['STORE_OWNER'] },
    { key: 'employees', label: 'Nhân viên', icon: '👥', roles: ['STORE_OWNER'] },
    { key: 'settings', label: 'Thông tin cửa hàng', icon: '📋', roles: ['STORE_OWNER'] },
    { key: 'edit', label: 'Chỉnh sửa cửa hàng', icon: '✏️', roles: ['STORE_OWNER'] },
  ].filter(tab => tab.roles.includes(user?.role || ''));

  return (
    <div className="w-64 bg-white shadow-lg">
      {/* Store Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center">
          {store.logo && (
            <img src={store.logo} alt="Logo" className="h-10 w-10 mr-3 rounded-lg" />
          )}
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-900">{store.name}</h1>
            {store.slogan && (
              <p className="text-sm text-gray-500">{store.slogan}</p>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-6">
        <div className="px-3">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg mb-1 transition-colors ${
                activeTab === tab.key
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* User Info & Logout */}
      <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500">
              {user?.role === 'STORE_OWNER' ? 'Chủ cửa hàng' : user?.role}
            </p>
          </div>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
