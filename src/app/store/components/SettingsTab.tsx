"use client";

import Image from "next/image";

interface StoreInfo {
  id: string;
  name: string;
  slogan?: string;
  logo?: string;
  background?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  primaryColor?: string;
  secondaryColor?: string;
  maxEmployees: number;
  maxAccounts: number;
}

interface SettingsTabProps {
  store: StoreInfo;
  onEditClick: () => void;
}

export default function SettingsTab({ store, onEditClick }: SettingsTabProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Thông tin cửa hàng</h2>

      <div className="bg-white shadow-sm rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Thông tin chi tiết</h3>
          <button
            onClick={onEditClick}
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            ✏️ Chỉnh sửa
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tên cửa hàng</label>
              <div className="mt-1 text-sm text-gray-900">{store.name}</div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Slogan</label>
              <div className="mt-1 text-sm text-gray-900">{store.slogan || 'Chưa có slogan'}</div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Địa chỉ</label>
              <div className="mt-1 text-sm text-gray-900">{store.address || 'Chưa có địa chỉ'}</div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
              <div className="mt-1 text-sm text-gray-900">{store.phone || 'Chưa có số điện thoại'}</div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <div className="mt-1 text-sm text-gray-900">{store.email || 'Chưa có email'}</div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Giới hạn nhân viên</label>
              <div className="mt-1 text-sm text-gray-900">{store.maxEmployees} nhân viên</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Giới hạn tài khoản</label>
              <div className="mt-1 text-sm text-gray-900">{store.maxAccounts} tài khoản</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Logo cửa hàng</label>
              <div className="mt-2">
                {store.logo ? (
                  <Image 
                    src={store.logo} 
                    alt="Logo cửa hàng" 
                    width={80}
                    height={80}

                    className="h-20 w-20 object-cover rounded-lg border border-gray-200"
                  />
                ) : (
                  <div className="h-20 w-20 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">Chưa có logo</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Hình nền cửa hàng</label>
              <div className="mt-2">
                {store.background ? (
                  <Image 
                    src={store.background} 
                    alt="Hình nền cửa hàng" 
                    className="h-20 w-32 object-cover rounded-lg border border-gray-200"
                  />
                ) : (
                  <div className="h-20 w-32 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">Chưa có hình nền</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Màu chính</label>
              <div className="mt-2 flex items-center space-x-3">
                <div 
                  className="w-8 h-8 rounded border border-gray-300 shadow-sm"
                  style={{ backgroundColor: store.primaryColor || '#3B82F6' }}
                ></div>
                <span className="text-sm text-gray-900">{store.primaryColor || '#3B82F6'}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Màu phụ</label>
              <div className="mt-2 flex items-center space-x-3">
                <div 
                  className="w-8 h-8 rounded border border-gray-300 shadow-sm"
                  style={{ backgroundColor: store.secondaryColor || '#10B981' }}
                ></div>
                <span className="text-sm text-gray-900">{store.secondaryColor || '#10B981'}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Mô tả</label>
            <div className="mt-1 text-sm text-gray-900">
              {store.description || 'Chưa có mô tả'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
