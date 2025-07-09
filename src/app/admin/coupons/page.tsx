"use client";

import { useAuth } from '@/lib/context/AuthContext';
import { useCallback, useEffect, useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface Store {
  id: string;
  name: string;
  address?: string;
}

interface Coupon {
  id: string;
  code: string;
  discount: number;
  expiresAt: string;
  storeId: string | null;
  user: User | null;
  store: Store | null;
  createdAt: string;
  usageLimit?: number | null;
  currentUsage?: number;
  isActive?: boolean;
}

interface Pricing {
  id: string;
  name: string;
  priceOnePhoto: number;
  priceTwoPhoto: number;
  priceThreePhoto: number;
  isActive: boolean;
  isDefault: boolean;
}

export default function CouponsManagement() {
  const { token } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [defaultPricing, setDefaultPricing] = useState<Pricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    code: '',
    discount: 0,
    store_id: '', // Add store_id field
    usageLimit: 1, // Default to 1
    isActive: true
  });

  // Define fetchData function with useCallback
  const fetchData = useCallback(async (page = 1, limit = 10, search = '') => {
    try {
      setLoading(true);

      // Build query string with pagination and search parameters
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      if (search) {
        queryParams.append('search', search);
      }

      // Fetch coupons with pagination
      const couponsResponse = await fetch(`/api/coupons?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!couponsResponse.ok) {
        throw new Error('Failed to fetch coupons');
      }

      const couponsData = await couponsResponse.json();
      setCoupons(couponsData.coupons);
      setPagination(couponsData.pagination);

      // Fetch users for dropdown (no pagination needed for the dropdown)
      const usersResponse = await fetch('/api/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!usersResponse.ok) {
        throw new Error('Failed to fetch users');
      }

      const usersData = await usersResponse.json();
      setUsers(usersData.users); // Extract users from the paginated response

      // Fetch stores for dropdown
      const storesResponse = await fetch('/api/stores', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!storesResponse.ok) {
        throw new Error('Failed to fetch stores');
      }

      const storesData = await storesResponse.json();
      setStores(storesData.stores || []);

      // Fetch default pricing
      const pricingResponse = await fetch('/api/pricing/default');
      if (pricingResponse.ok) {
        const pricingData = await pricingResponse.json();
        setDefaultPricing(pricingData);
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [token]); // Add token as a dependency

  // Fetch coupons and users when component mounts or pagination changes
  useEffect(() => {
    if (token) {
      fetchData(pagination.page, pagination.limit, searchQuery);
    }
  }, [token, pagination.page, pagination.limit, searchQuery, fetchData]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };
  console.log('Pagination state:', users);

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(1, pagination.limit, searchQuery); // Reset to page 1 when searching
  };

  const generateCouponCode = () => {
    let result = '';
    const length = 4;
    for (let i = 0; i < length; i++) {
      result += Math.floor(Math.random() * 10).toString();
    }
    return result;
  };

  // Hàm tạo coupon với mức giảm giá cụ thể (mở form)
  const createCouponWithDiscount = (discount: number) => {
    setIsEditing(false);
    setFormData({
      id: '',
      code: generateCouponCode(),
      discount: discount,
      store_id: '',
      usageLimit: 1,
      isActive: true
    });
    setIsFormOpen(true);
  };

  // Hàm tạo và lưu coupon trực tiếp không cần mở form
  const createAndSaveCouponDirectly = async (discount: number) => {
    try {
      setLoading(true);

      const couponData = {
        code: generateCouponCode(),
        discount: discount,
        store_id: null,
        usageLimit: 1, // Mặc định giới hạn sử dụng là 1 lần
        isActive: true
      };

      const response = await fetch('/api/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(couponData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to create coupon: ${errorData.error || response.statusText}`);
      }

      await response.json();

      // Tải lại danh sách coupon
      fetchData();
    } catch (err) {
      console.error('Error creating coupon:', err);
      alert(`Tạo mã giảm giá thất bại: ${err instanceof Error ? err.message : 'Lỗi không xác định'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (name === 'discount') {
      const numValue = parseFloat(value);
      setFormData(prev => ({ ...prev, [name]: isNaN(numValue) ? 0 : numValue }));
    } else if (name === 'usageLimit') {
      const numValue = parseInt(value);
      setFormData(prev => ({ ...prev, [name]: isNaN(numValue) ? 1 : numValue }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCreateCoupon = () => {
    // Sử dụng pricing default nếu có, ngược lại dùng giá mặc định
    const defaultDiscount = defaultPricing ? defaultPricing.priceOnePhoto : 10000;
    createCouponWithDiscount(defaultDiscount);
  };

  const handleEditCoupon = (coupon: Coupon) => {
    setIsEditing(true);
    setFormData({
      id: coupon.id,
      code: coupon.code,
      discount: coupon.discount,
      store_id: coupon.storeId || '',
      usageLimit: coupon.usageLimit !== undefined && coupon.usageLimit !== null ? coupon.usageLimit : 1,
      isActive: coupon.isActive !== undefined ? coupon.isActive : true
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Prepare data for API
      const couponData = {
        ...formData,
        store_id: formData.store_id || null,
        usageLimit: formData.usageLimit,
        isActive: formData.isActive
      };
      // Create or update coupon
      const url = isEditing ? `/api/coupons/${formData.id}` : '/api/coupons';
      const method = isEditing ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(couponData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to ${isEditing ? 'update' : 'create'} coupon: ${errorData.error || response.statusText}`);
      }

      // Close form first
      setIsFormOpen(false);

      // Wait a small delay before refreshing data
      setTimeout(() => {
        fetchData(); // Refresh coupons list
      }, 300);
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(`Failed to ${isEditing ? 'update' : 'create'} coupon: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) {
      return;
    }

    try {
      const response = await fetch(`/api/coupons/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete coupon');
      }

      fetchData(); // Refresh list

    } catch (err) {
      console.error('Error deleting coupon:', err);
      setError('Failed to delete coupon');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-gray-50">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Coupons Management</h1>
        
        {/* Action Buttons - Responsive Grid */}
        <div className="w-full sm:w-auto grid grid-cols-1 sm:grid-cols-2 lg:flex gap-2 lg:space-x-2">
          <button
            onClick={() => createAndSaveCouponDirectly(defaultPricing ? defaultPricing.priceOnePhoto : 70)}
            className="w-full sm:w-auto px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm flex items-center justify-center gap-1"
            title={`Tạo mã giảm giá ${defaultPricing ? defaultPricing.priceOnePhoto : 70} xu`}
            disabled={loading}
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : null}
            <span className="hidden sm:inline">Tạo mã</span>
            <span className="font-medium">{defaultPricing ? defaultPricing.priceOnePhoto : 70} xu</span>
          </button>
          
          <button
            onClick={() => createAndSaveCouponDirectly(defaultPricing ? defaultPricing.priceTwoPhoto : 120)}
            className="w-full sm:w-auto px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm flex items-center justify-center gap-1"
            title={`Tạo mã giảm giá ${defaultPricing ? defaultPricing.priceTwoPhoto : 120} xu`}
            disabled={loading}
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : null}
            <span className="hidden sm:inline">Tạo mã</span>
            <span className="font-medium">{defaultPricing ? defaultPricing.priceTwoPhoto : 120} xu</span>
          </button>
          
          <button
            onClick={() => createAndSaveCouponDirectly(defaultPricing ? defaultPricing.priceThreePhoto : 150)}
            className="w-full sm:w-auto px-3 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 text-sm flex items-center justify-center gap-1"
            title={`Tạo mã giảm giá ${defaultPricing ? defaultPricing.priceThreePhoto : 150} xu`}
            disabled={loading}
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : null}
            <span className="hidden sm:inline">Tạo mã</span>
            <span className="font-medium">{defaultPricing ? defaultPricing.priceThreePhoto : 150} xu</span>
          </button>
          
          <button
            onClick={handleCreateCoupon}
            className="w-full sm:w-auto sm:col-span-2 lg:col-span-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Tạo mã</span>
          </button>
        </div>
      </div>

      {/* Search bar - Responsive */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Nhập mas..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Tìm kiếm
          </button>
        </form>
      </div>

      {/* Coupon Form Modal - Responsive */}
      {isFormOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-gray-700 bg-opacity-30 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsFormOpen(false);
              setError(null);
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {isEditing ? 'Sửa mã' : 'Tạo mã'}
                </h3>
                <button
                  onClick={() => {
                    setIsFormOpen(false);
                    setError(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 p-1"
                  aria-label="Close"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mã</label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="text"
                      id="code"
                      name="code"
                      value={formData.code}
                      onChange={e => {
                        const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                        setFormData(prev => ({ ...prev, code: value }));
                      }}
                      required
                      maxLength={4}
                      pattern="[0-9]{1,4}"
                      className="flex-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, code: generateCouponCode() }))}
                      className="ml-2 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                    >
                      Tạo tự động
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="discount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Giá trị
                  </label>
                  <input
                    type="number"
                    id="discount"
                    name="discount"
                    value={formData.discount}
                    onChange={handleInputChange}
                    required
                    step="10"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="store_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Cửa hàng (tùy chọn - để trống cho coupon toàn cầu)
                  </label>
                  <select
                    id="store_id"
                    name="store_id"
                    value={formData.store_id}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">-- Coupon toàn cầu --</option>
                    {stores.map(store => (
                      <option key={store.id} value={store.id}>{store.name} {store.address && `(${store.address})`}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="usageLimit" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Số lần sử dụng tối đa
                  </label>
                  <input
                    type="number"
                    id="usageLimit"
                    name="usageLimit"
                    value={formData.usageLimit}
                    onChange={handleInputChange}
                    min="1"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">Coupon sẽ tự động hết hạn sau 1 ngày kể từ khi tạo</p>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                    Kích hoạt
                  </label>
                </div>
                <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFormOpen(false);
                      setError(null);
                    }}
                    disabled={loading}
                    className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {loading && (
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    <span>{isEditing ? 'Cập nhật' : 'Tạo mới'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Mã</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Giá trị</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Hết hạn</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cửa hàng</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Giới hạn sử dụng</th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {coupons.length > 0 ? (
                coupons.map((coupon) => {
                  const isExpired = new Date(coupon.expiresAt) < new Date();

                  return (
                    <tr key={coupon.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {coupon.code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {coupon.discount} xu
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isExpired
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}>
                          {new Date(coupon.expiresAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {coupon.store ? coupon.store.name : 'Toàn cầu'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {coupon.currentUsage !== undefined && coupon.usageLimit !== undefined
                          ? `${coupon.currentUsage} / ${coupon.usageLimit}`
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEditCoupon(coupon)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900"
                          title="Edit coupon"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteCoupon(coupon.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900"
                          title="Delete coupon"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No coupons found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {coupons.length > 0 ? (
          coupons.map((coupon) => {
            const isExpired = new Date(coupon.expiresAt) < new Date();
            return (
              <div key={coupon.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Mã: {coupon.code}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {coupon.discount} xu
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditCoupon(coupon)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200 p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900"
                      title="Edit coupon"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteCoupon(coupon.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900"
                      title="Delete coupon"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Hết hạn</div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isExpired
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                      {new Date(coupon.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cửa hàng</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {coupon.store ? coupon.store.name : 'Toàn cầu'}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Giới hạn sử dụng</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {coupon.currentUsage !== undefined && coupon.usageLimit !== undefined
                      ? `${coupon.currentUsage} / ${coupon.usageLimit}`
                      : 'N/A'}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
            <div className="text-gray-500 dark:text-gray-400 text-base">
              Không có mã giảm giá nào được tìm thấy.
            </div>
          </div>
        )}
      </div>

      {/* Pagination controls - Responsive */}
      {pagination.totalPages > 0 && (
        <div className="bg-white dark:bg-gray-800 px-4 py-4 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 dark:border-gray-700 mt-4 rounded-b-lg">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 sm:mb-0">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} coupons
          </div>
          
          {/* Mobile pagination - simplified */}
          <div className="flex space-x-2 sm:hidden">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrevPage}
              className={`px-3 py-2 rounded text-sm ${pagination.hasPrevPage
                ? 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                }`}
            >
              Trước
            </button>
            <span className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNextPage}
              className={`px-3 py-2 rounded text-sm ${pagination.hasNextPage
                ? 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                }`}
            >
              Tiếp
            </button>
          </div>

          {/* Desktop pagination - full */}
          <div className="hidden sm:flex space-x-2">
            <button
              onClick={() => handlePageChange(1)}
              disabled={!pagination.hasPrevPage}
              className={`px-3 py-1 rounded ${pagination.hasPrevPage
                ? 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                }`}
            >
              &laquo; Đầu tiên
            </button>
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrevPage}
              className={`px-3 py-1 rounded ${pagination.hasPrevPage
                ? 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                }`}
            >
              &lsaquo; Trước
            </button>

            {/* Page number buttons */}
            <div className="flex space-x-1">
              {[...Array(Math.min(pagination.totalPages, 5))].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 rounded ${pagination.page === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNextPage}
              className={`px-3 py-1 rounded ${pagination.hasNextPage
                ? 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                }`}
            >
              Tiếp &rsaquo;
            </button>
            <button
              onClick={() => handlePageChange(pagination.totalPages)}
              disabled={!pagination.hasNextPage}
              className={`px-3 py-1 rounded ${pagination.hasNextPage
                ? 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                }`}
            >
              Cuối &raquo;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
