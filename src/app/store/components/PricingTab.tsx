"use client";

import { useAuth } from '@/lib/context/AuthContext';
import { useEffect, useState } from 'react';
import { Edit, Eye, EyeOff, Plus, Trash2 } from 'react-feather';

interface Pricing {
  id: string;
  name: string;
  priceOnePhoto: number;
  priceTwoPhoto: number;
  priceThreePhoto: number;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  userId?: string;
  storeId?: string;
  user?: {
    id: string;
    name: string;
    username: string;
  };
  store?: {
    id: string;
    name: string;
  };
}

interface User {
  id: string;
  name: string;
  username: string;
  role: string;
  storeId?: string;
  store?: {
    name: string;
  };
}

interface PricingTabProps {
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export default function PricingTab({ onShowToast }: PricingTabProps) {
  const { token, user } = useAuth();
  const [pricings, setPricings] = useState<Pricing[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPricing, setEditingPricing] = useState<Pricing | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    priceOnePhoto: 0,
    priceTwoPhoto: 0,
    priceThreePhoto: 0,
    isDefault: false,
    assignType: 'store', // 'store', 'user'
    userId: '',
  });

  useEffect(() => {
    fetchPricings();
    fetchUsers();
  }, []);

  const fetchPricings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pricing/store', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPricings(data);
      } else {
        throw new Error('Failed to fetch pricings');
      }
    } catch (error) {
      console.error('Error fetching pricings:', error);
      onShowToast('Lỗi khi tải danh sách bảng giá', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/pricing/assign-options', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload: {
        name: string;
        priceOnePhoto: number;
        priceTwoPhoto: number;
        priceThreePhoto: number;
        isDefault: boolean;
        id?: string;
        userId?: string;
        storeId?: string;
      } = {
        name: formData.name,
        priceOnePhoto: formData.priceOnePhoto,
        priceTwoPhoto: formData.priceTwoPhoto,
        priceThreePhoto: formData.priceThreePhoto,
        isDefault: formData.isDefault,
        ...(editingPricing && { id: editingPricing.id })
      };

      // Add assignment based on type
      if (formData.assignType === 'user' && formData.userId) {
        payload.userId = formData.userId;
      } else if (user?.storeId) {
        // Default to store
        payload.storeId = user.storeId;
      }

      const response = await fetch('/api/pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await fetchPricings();
        setShowForm(false);
        setEditingPricing(null);
        resetFormData();
        onShowToast(
          editingPricing ? 'Cập nhật bảng giá thành công' : 'Tạo bảng giá thành công',
          'success'
        );
      } else {
        const error = await response.json();
        onShowToast(`Lỗi: ${error.error}`, 'error');
      }
    } catch (error) {
      console.error('Error saving pricing:', error);
      onShowToast('Lỗi khi lưu bảng giá', 'error');
    }
  };

  const resetFormData = () => {
    setFormData({
      name: '',
      priceOnePhoto: 0,
      priceTwoPhoto: 0,
      priceThreePhoto: 0,
      isDefault: false,
      assignType: 'store',
      userId: '',
    });
  };

  const handleEdit = (pricing: Pricing) => {
    setEditingPricing(pricing);
    
    let assignType = 'store';
    let userId = '';
    
    if (pricing.userId) {
      assignType = 'user';
      userId = pricing.userId;
    }
    
    setFormData({
      name: pricing.name,
      priceOnePhoto: pricing.priceOnePhoto,
      priceTwoPhoto: pricing.priceTwoPhoto,
      priceThreePhoto: pricing.priceThreePhoto,
      isDefault: pricing.isDefault,
      assignType,
      userId,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bảng giá này?')) return;

    try {
      const response = await fetch(`/api/pricing?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchPricings();
        onShowToast('Xóa bảng giá thành công', 'success');
      } else {
        const error = await response.json();
        onShowToast(`Lỗi: ${error.error}`, 'error');
      }
    } catch (error) {
      console.error('Error deleting pricing:', error);
      onShowToast('Lỗi khi xóa bảng giá', 'error');
    }
  };

  const handleStatusChange = async (id: string, field: 'isActive' | 'isDefault', value: boolean) => {
    try {
      const response = await fetch('/api/pricing/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id,
          [field]: value
        })
      });

      if (response.ok) {
        await fetchPricings();
        onShowToast('Cập nhật trạng thái thành công', 'success');
      } else {
        const error = await response.json();
        onShowToast(`Lỗi: ${error.error}`, 'error');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      onShowToast('Lỗi khi cập nhật trạng thái', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Quản lý bảng giá
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Quản lý bảng giá cho cửa hàng và nhân viên
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingPricing(null);
            resetFormData();
          }}
          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-3 sm:py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Thêm bảng giá mới
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-900 dark:text-white">
                {editingPricing ? 'Sửa bảng giá' : 'Thêm bảng giá mới'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tên bảng giá
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Giá 1 tấm ảnh (xu)
                  </label>
                  <input
                    type="number"
                    value={formData.priceOnePhoto}
                    onChange={(e) => setFormData({ ...formData, priceOnePhoto: Number(e.target.value) })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Giá 2 tấm ảnh (xu)
                  </label>
                  <input
                    type="number"
                    value={formData.priceTwoPhoto}
                    onChange={(e) => setFormData({ ...formData, priceTwoPhoto: Number(e.target.value) })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Giá 3 tấm ảnh (xu)
                  </label>
                  <input
                    type="number"
                    value={formData.priceThreePhoto}
                    onChange={(e) => setFormData({ ...formData, priceThreePhoto: Number(e.target.value) })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    min="0"
                    required
                  />
                </div>

                {/* Assignment Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phạm vi áp dụng
                  </label>
                  <select
                    value={formData.assignType}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      assignType: e.target.value,
                      userId: ''
                    })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="store">Toàn cửa hàng</option>
                    <option value="user">Nhân viên cụ thể</option>
                  </select>
                </div>

                {/* User Selection */}
                {formData.assignType === 'user' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Chọn nhân viên
                    </label>
                    <select
                      value={formData.userId}
                      onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="">-- Chọn nhân viên --</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.username}) - {user.role}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Đặt làm bảng giá mặc định
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Đặt làm bảng giá mặc định
                    </span>
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="w-full sm:w-auto px-4 py-3 sm:py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    {editingPricing ? 'Cập nhật' : 'Thêm'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Pricing List */}
      <div className="grid gap-4 md:gap-6">
        {pricings.map((pricing) => (
          <div key={pricing.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
              <div className="mb-4 md:mb-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{pricing.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Tạo ngày: {new Date(pricing.createdAt).toLocaleDateString('vi-VN')}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(pricing)}
                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium px-3 py-1 border border-blue-600 rounded flex items-center gap-1"
                >
                  <Edit className="h-3 w-3" />
                  Sửa
                </button>
                <button
                  onClick={() => handleDelete(pricing.id)}
                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium px-3 py-1 border border-red-600 rounded flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" />
                  Xóa
                </button>
              </div>
            </div>

            {/* Pricing Info */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">1 tấm</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">{pricing.priceOnePhoto} xu</div>
              </div>
              <div className="text-center bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">2 tấm</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">{pricing.priceTwoPhoto} xu</div>
              </div>
              <div className="text-center bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">3 tấm</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">{pricing.priceThreePhoto} xu</div>
              </div>
            </div>

            {/* Assignment Info */}
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Phạm vi áp dụng</div>
              <div className="text-sm">
                {pricing.userId ? (
                  <span className="text-blue-600 dark:text-blue-400">
                    👤 {pricing.user?.name} ({pricing.user?.username})
                  </span>
                ) : pricing.storeId ? (
                  <span className="text-green-600 dark:text-green-400">
                    🏪 {pricing.store?.name || 'Cửa hàng của bạn'}
                  </span>
                ) : (
                  <span className="text-gray-600 dark:text-gray-400">🌐 Toàn hệ thống</span>
                )}
              </div>
            </div>

            {/* Status Controls */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2 sm:space-y-0">
              <div className="flex items-center">
                <button
                  onClick={() => handleStatusChange(pricing.id, 'isActive', !pricing.isActive)}
                  className="flex items-center gap-2 text-sm"
                >
                  {pricing.isActive ? (
                    <Eye className="h-4 w-4 text-green-600" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`${pricing.isActive ? 'text-green-600' : 'text-red-600'} dark:text-current`}>
                    {pricing.isActive ? 'Hoạt động' : 'Tạm dừng'}
                  </span>
                </button>
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={pricing.isDefault}
                    onChange={(e) => handleStatusChange(pricing.id, 'isDefault', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className={`${pricing.isDefault ? 'text-blue-600' : 'text-gray-600'} dark:text-current`}>
                    {pricing.isDefault ? 'Mặc định' : 'Thông thường'}
                  </span>
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {pricings.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <div className="text-gray-500 dark:text-gray-400 text-base">
            Chưa có bảng giá nào. Hãy thêm bảng giá đầu tiên.
          </div>
        </div>
      )}
    </div>
  );
}
