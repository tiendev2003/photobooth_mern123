'use client';

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
}

export default function PricingAdminPage() {
  const [pricings, setPricings] = useState<Pricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPricing, setEditingPricing] = useState<Pricing | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    priceOnePhoto: 0,
    priceTwoPhoto: 0,
    priceThreePhoto: 0,
    isDefault: false
  });

  useEffect(() => {
    fetchPricings();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        ...(editingPricing && { id: editingPricing.id })
      };

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
        setFormData({
          name: '',
          priceOnePhoto: 0,
          priceTwoPhoto: 0,
          priceThreePhoto: 0,
          isDefault: false
        });
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving pricing:', error);
      alert('Error saving pricing');
    }
  };

  const handleEdit = (pricing: Pricing) => {
    setEditingPricing(pricing);
    setFormData({
      name: pricing.name,
      priceOnePhoto: pricing.priceOnePhoto,
      priceTwoPhoto: pricing.priceTwoPhoto,
      priceThreePhoto: pricing.priceThreePhoto,
      isDefault: pricing.isDefault
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
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting pricing:', error);
      alert('Error deleting pricing');
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
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
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
            setFormData({
              name: '',
              priceOnePhoto: 0,
              priceTwoPhoto: 0,
              priceThreePhoto: 0,
              isDefault: false
            });
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

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
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
