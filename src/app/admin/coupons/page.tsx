"use client";

import { useAuth } from '@/lib/context/AuthContext';
import { useCallback, useEffect, useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface Coupon {
  id: string;
  code: string;
  discount: number;
  expires_at: string;
  user_id: string | null;
  user: User | null;
  createdAt: string;
  usageLimit?: number | null;
  currentUsage?: number;
  isActive?: boolean;
}

export default function CouponsManagement() {
  const { token } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [users, setUsers] = useState<User[]>([]);
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
    expires_at: '',
    user_id: '',
    usageLimit: '',
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
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);

    setIsEditing(false);
    setFormData({
      id: '',
      code: generateCouponCode(),
      discount: discount,
      expires_at: nextMonth.toISOString().split('T')[0],
      user_id: '',
      usageLimit: '',
      isActive: true
    });
    setIsFormOpen(true);
  };

  // Hàm tạo và lưu coupon trực tiếp không cần mở form
  const createAndSaveCouponDirectly = async (discount: number) => {
    try {
      setLoading(true);

      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);

      const couponData = {
        code: generateCouponCode(),
        discount: discount,
        expires_at: nextMonth.toISOString().split('T')[0],
        user_id: null,
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
      setFormData(prev => ({ ...prev, [name]: value }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCreateCoupon = () => {
    // Sử dụng hàm chung với mức giảm giá mặc định là 10,000đ
    createCouponWithDiscount(10000);
  };

  const handleEditCoupon = (coupon: Coupon) => {
    setIsEditing(true);
    setFormData({
      id: coupon.id,
      code: coupon.code,
      discount: coupon.discount,
      expires_at: new Date(coupon.expires_at).toISOString().split('T')[0],
      user_id: coupon.user_id || '',
      usageLimit: coupon.usageLimit !== undefined && coupon.usageLimit !== null ? String(coupon.usageLimit) : '',
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
        user_id: formData.user_id || null,
        usageLimit: formData.usageLimit === '' ? null : Number(formData.usageLimit),
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Coupons Management</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => createAndSaveCouponDirectly(70)}
            className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm flex items-center gap-1"
            title="Tạo mã giảm giá 70.000đ"
            disabled={loading}
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : null}
            <span>Tạo mã 70 xu</span>
          </button>
          <button
            onClick={() => createAndSaveCouponDirectly(120)}
            className="px-3 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm flex items-center gap-1"
            title="Tạo mã giảm giá 120.000đ"
            disabled={loading}
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : null}
            <span>Tạo mã 120 xu</span>
          </button>
          <button
            onClick={() => createAndSaveCouponDirectly(150)}
            className="px-3 py-1.5 bg-pink-600 text-white rounded-md hover:bg-pink-700 text-sm flex items-center gap-1"
            title="Tạo mã giảm giá 150.000đ"
            disabled={loading}
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : null}
            <span>Tạo mã 150 xu</span>
          </button>
          <button
            onClick={handleCreateCoupon}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create Coupon</span>
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Search by coupon code..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Search
          </button>
        </form>
      </div>

      {/* Coupon Form Modal */}
      {isFormOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-gray-700 bg-opacity-30"
          onClick={(e) => {
            // Only close if clicking the backdrop, not the modal itself
            if (e.target === e.currentTarget) {
              setIsFormOpen(false);
              setError(null);
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {isEditing ? 'Edit Coupon' : 'Create New Coupon'}
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
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Coupon Code</label>
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
                    Generate
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="discount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Discount
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
                <label htmlFor="expires_at" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Expiration Date
                </label>
                <input
                  type="date"
                  id="expires_at"
                  name="expires_at"
                  value={formData.expires_at}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="user_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Assign to User (optional)
                </label>
                <select
                  id="user_id"
                  name="user_id"
                  value={formData.user_id}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">-- Unassigned --</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="usageLimit" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Usage Limit (optional)
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
                  Active
                </label>
              </div>
              <div className="flex justify-end space-x-3 pt-3 sticky bottom-0 bg-white dark:bg-gray-800 pb-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setError(null);
                  }}
                  disabled={loading}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {loading && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  <span>{isEditing ? 'Update' : 'Create'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coupons Table */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Code</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Discount</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Expires</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Assigned To</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Usage Limit</th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {coupons.length > 0 ? (
                coupons.map((coupon) => {
                  const isExpired = new Date(coupon.expires_at) < new Date();

                  return (
                    <tr key={coupon.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {coupon.code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {coupon.discount?.toLocaleString('vi-VN')} xu
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isExpired
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}>
                          {new Date(coupon.expires_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {coupon.user ? coupon.user.name : 'Unassigned'}
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
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No coupons found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {pagination.totalPages > 0 && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} coupons
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(1)}
                disabled={!pagination.hasPrevPage}
                className={`px-3 py-1 rounded ${pagination.hasPrevPage
                  ? 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                  }`}
              >
                &laquo; First
              </button>
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPrevPage}
                className={`px-3 py-1 rounded ${pagination.hasPrevPage
                  ? 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                  }`}
              >
                &lsaquo; Prev
              </button>

              {/* Page number buttons */}
              <div className="flex space-x-1">
                {[...Array(pagination.totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => handlePageChange(i + 1)}
                    className={`px-3 py-1 rounded ${pagination.page === i + 1
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
                      }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasNextPage}
                className={`px-3 py-1 rounded ${pagination.hasNextPage
                  ? 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                  }`}
              >
                Next &rsaquo;
              </button>
              <button
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={!pagination.hasNextPage}
                className={`px-3 py-1 rounded ${pagination.hasNextPage
                  ? 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                  }`}
              >
                Last &raquo;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
