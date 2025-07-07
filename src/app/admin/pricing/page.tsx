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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý bảng giá</h1>
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
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Thêm bảng giá mới
        </button>
      </div>

      {/* Form thêm/sửa bảng giá */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingPricing ? 'Sửa bảng giá' : 'Thêm bảng giá mới'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên bảng giá
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá 1 tấm ảnh (VND)
                </label>
                <input
                  type="number"
                  value={formData.priceOnePhoto}
                  onChange={(e) => setFormData({ ...formData, priceOnePhoto: Number(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá 2 tấm ảnh (VND)
                </label>
                <input
                  type="number"
                  value={formData.priceTwoPhoto}
                  onChange={(e) => setFormData({ ...formData, priceTwoPhoto: Number(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá 3 tấm ảnh (VND)
                </label>
                <input
                  type="number"
                  value={formData.priceThreePhoto}
                  onChange={(e) => setFormData({ ...formData, priceThreePhoto: Number(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Đặt làm bảng giá mặc định
                  </span>
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingPricing ? 'Cập nhật' : 'Thêm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Danh sách bảng giá */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
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
                      className="mr-2"
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
                      className="mr-2"
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

        {pricings.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Chưa có bảng giá nào. Hãy thêm bảng giá đầu tiên.
          </div>
        )}
      </div>
    </div>
  );
}
