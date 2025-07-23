'use client';

import { useDialog } from '@/lib/context/DialogContext';
import { useEffect, useState } from 'react';

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

interface Store {
  id: string;
  name: string;
  isActive: boolean;
}

export default function PricingAdminPage() {
  const [pricings, setPricings] = useState<Pricing[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPricing, setEditingPricing] = useState<Pricing | null>(null);
    const {showDialog} = useDialog();
  
  const [formData, setFormData] = useState({
    name: '',
    priceOnePhoto: 0,
    priceTwoPhoto: 0,
    priceThreePhoto: 0,
    isDefault: false,
    assignType: 'global', // 'global', 'user', 'store'
    userId: '',
    storeId: ''
  });

  useEffect(() => {
    fetchPricings();
    fetchAssignOptions();
  }, []);

  const fetchPricings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/pricing?all=true', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPricings(data);
      } else {
        console.error('Failed to fetch pricings');
      }
    } catch (error) {
      console.error('Error fetching pricings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignOptions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/pricing/assign-options', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setStores(data.stores);
      } else {
        console.error('Failed to fetch assign options');
      }
    } catch (error) {
      console.error('Error fetching assign options:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
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
      } else if (formData.assignType === 'store' && formData.storeId) {
        payload.storeId = formData.storeId;
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
      } else {
        const error = await response.json();
        showDialog({
          header: "Lỗi",
          content: error.error || "Không thể lưu bảng giá.",
        });
      }
    } catch (error) {
      console.error('Error saving pricing:', error);
      showDialog({
        header: "Lỗi",
        content: "Không thể lưu bảng giá.",
      });
    }
  };

  const resetFormData = () => {
    setFormData({
      name: '',
      priceOnePhoto: 0,
      priceTwoPhoto: 0,
      priceThreePhoto: 0,
      isDefault: false,
      assignType: 'global',
      userId: '',
      storeId: ''
    });
  };

  const handleEdit = (pricing: Pricing) => {
    setEditingPricing(pricing);
    
    let assignType = 'global';
    let userId = '';
    let storeId = '';
    
    if (pricing.userId) {
      assignType = 'user';
      userId = pricing.userId;
    } else if (pricing.storeId) {
      assignType = 'store';
      storeId = pricing.storeId;
    }
    
    setFormData({
      name: pricing.name,
      priceOnePhoto: pricing.priceOnePhoto,
      priceTwoPhoto: pricing.priceTwoPhoto,
      priceThreePhoto: pricing.priceThreePhoto,
      isDefault: pricing.isDefault,
      assignType,
      userId,
      storeId
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bảng giá này?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/pricing?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchPricings();
      } else {
        const error = await response.json();
        showDialog({
          header: "Lỗi",
          content: error.error || "Không thể xóa bảng giá.",
        });
      }
    } catch (error) {
      console.error('Error deleting pricing:', error);
      showDialog({
        header: "Lỗi",
        content: "Không thể xóa bảng giá.",
      });
    }
  };

  const handleStatusChange = async (id: string, field: 'isActive' | 'isDefault', value: boolean) => {
    try {
      const token = localStorage.getItem('token');
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
      } else {
        const error = await response.json();
        showDialog({
          header: "Lỗi",
          content: error.error || "Không thể cập nhật trạng thái.",
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showDialog({
        header: "Lỗi",
        content: "Không thể cập nhật trạng thái.",
      });
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
    <div className="p-4 sm:p-6 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Quản lý bảng giá</h1>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingPricing(null);
            resetFormData();
          }}
          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-3 sm:py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Thêm bảng giá mới
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg sm:text-xl font-bold mb-4">
                {editingPricing ? 'Sửa bảng giá' : 'Thêm bảng giá mới'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên bảng giá
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá 1 tấm ảnh (VND)
                  </label>
                  <input
                    type="number"
                    value={formData.priceOnePhoto}
                    onChange={(e) => setFormData({ ...formData, priceOnePhoto: Number(e.target.value) })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá 2 tấm ảnh (VND)
                  </label>
                  <input
                    type="number"
                    value={formData.priceTwoPhoto}
                    onChange={(e) => setFormData({ ...formData, priceTwoPhoto: Number(e.target.value) })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá 3 tấm ảnh (VND)
                  </label>
                  <input
                    type="number"
                    value={formData.priceThreePhoto}
                    onChange={(e) => setFormData({ ...formData, priceThreePhoto: Number(e.target.value) })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    required
                  />
                </div>

                {/* Assignment Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phạm vi áp dụng
                  </label>
                  <select
                    value={formData.assignType}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      assignType: e.target.value,
                      userId: '',
                      storeId: ''
                    })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="global">Toàn hệ thống</option>
                    <option value="store">Cửa hàng cụ thể</option>
                    <option value="user">Người dùng cụ thể</option>
                  </select>
                </div>

                {/* Store Selection */}
                {formData.assignType === 'store' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chọn cửa hàng
                    </label>
                    <select
                      value={formData.storeId}
                      onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">-- Chọn cửa hàng --</option>
                      {stores.map((store) => (
                        <option key={store.id} value={store.id}>
                          {store.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* User Selection */}
                {formData.assignType === 'user' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chọn người dùng
                    </label>
                    <select
                      value={formData.userId}
                      onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">-- Chọn người dùng --</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.username}) - {user.role}
                          {user.store && ` - ${user.store.name}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Đặt làm bảng giá mặc định
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">
                      Đặt làm bảng giá mặc định
                    </span>
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="w-full sm:w-auto px-4 py-3 sm:py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
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

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên bảng giá
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giá 1 tấm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giá 2 tấm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giá 3 tấm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phạm vi áp dụng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mặc định
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pricings.map((pricing) => (
                <tr key={pricing.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {pricing.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(pricing.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {pricing.priceOnePhoto} xu
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {pricing.priceTwoPhoto} xu
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {pricing.priceThreePhoto} xu
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {pricing.userId ? (
                        <span className="text-blue-600">
                          👤 {pricing.user?.name} ({pricing.user?.username})
                        </span>
                      ) : pricing.storeId ? (
                        <span className="text-green-600">
                          🏪 {pricing.store?.name}
                        </span>
                      ) : (
                        <span className="text-gray-600">🌐 Toàn hệ thống</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={pricing.isActive}
                        onChange={(e) => handleStatusChange(pricing.id, 'isActive', e.target.checked)}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className={`text-sm ${pricing.isActive ? 'text-green-600' : 'text-red-600'}`}>
                        {pricing.isActive ? 'Hoạt động' : 'Tạm dừng'}
                      </span>
                    </label>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={pricing.isDefault}
                        onChange={(e) => handleStatusChange(pricing.id, 'isDefault', e.target.checked)}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className={`text-sm ${pricing.isDefault ? 'text-blue-600' : 'text-gray-600'}`}>
                        {pricing.isDefault ? 'Mặc định' : 'Thông thường'}
                      </span>
                    </label>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(pricing)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(pricing.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {pricings.map((pricing) => (
          <div key={pricing.id} className="bg-white rounded-lg shadow-md p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{pricing.name}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(pricing.createdAt).toLocaleDateString('vi-VN')}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(pricing)}
                  className="text-blue-600 hover:text-blue-900 text-sm font-medium px-3 py-1 border border-blue-600 rounded"
                >
                  Sửa
                </button>
                <button
                  onClick={() => handleDelete(pricing.id)}
                  className="text-red-600 hover:text-red-900 text-sm font-medium px-3 py-1 border border-red-600 rounded"
                >
                  Xóa
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">1 tấm</div>
                <div className="text-sm font-medium text-gray-900">{pricing.priceOnePhoto} xu</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">2 tấm</div>
                <div className="text-sm font-medium text-gray-900">{pricing.priceTwoPhoto} xu</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">3 tấm</div>
                <div className="text-sm font-medium text-gray-900">{pricing.priceThreePhoto} xu</div>
              </div>
            </div>

            {/* Assignment Info */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">Phạm vi áp dụng</div>
              <div className="text-sm">
                {pricing.userId ? (
                  <span className="text-blue-600">
                    👤 {pricing.user?.name} ({pricing.user?.username})
                  </span>
                ) : pricing.storeId ? (
                  <span className="text-green-600">
                    🏪 {pricing.store?.name}
                  </span>
                ) : (
                  <span className="text-gray-600">🌐 Toàn hệ thống</span>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={pricing.isActive}
                  onChange={(e) => handleStatusChange(pricing.id, 'isActive', e.target.checked)}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className={`text-sm ${pricing.isActive ? 'text-green-600' : 'text-red-600'}`}>
                  {pricing.isActive ? 'Hoạt động' : 'Tạm dừng'}
                </span>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={pricing.isDefault}
                  onChange={(e) => handleStatusChange(pricing.id, 'isDefault', e.target.checked)}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className={`text-sm ${pricing.isDefault ? 'text-blue-600' : 'text-gray-600'}`}>
                  {pricing.isDefault ? 'Mặc định' : 'Thông thường'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {pricings.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-gray-500 text-base">
            Chưa có bảng giá nào. Hãy thêm bảng giá đầu tiên.
          </div>
        </div>
      )}
    </div>
  );
}
