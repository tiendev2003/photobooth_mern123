"use client";

import { useAuth } from '@/lib/context/AuthContext';
import { useCallback, useEffect, useState } from 'react';

interface Revenue {
  id: string;
  amount: number;
  description?: string;
  originalAmount?: number;
  discountAmount?: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    machineCode?: string;
  };
  store: {
    id: string;
    name: string;
  };
  coupon?: {
    id: string;
    code: string;
    discount: number; // Giá tiền giảm trực tiếp, không phải phần trăm
  };
}

interface RevenueStats {
  totalRevenue: number;
  totalTransactions: number;
  averageTransaction: number;
  totalDiscount: number;
}

export default function RevenueManagement() {
  const { token } = useAuth();
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Pagination
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  const fetchRevenues = useCallback(async (page = 1) => {
    try {
      setLoading(true);

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      });

      if (selectedStore) queryParams.append('storeId', selectedStore);
      if (selectedUser) queryParams.append('userId', selectedUser);
      if (dateFrom) queryParams.append('dateFrom', dateFrom);
      if (dateTo) queryParams.append('dateTo', dateTo);

      const response = await fetch(`/api/revenues?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch revenues');
      }

      const data = await response.json();
      setRevenues(data.revenues || []);

      if (data.pagination) {
        setPagination(data.pagination);
      }

      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching revenues:', err);
      setError('Failed to load revenues');
    } finally {
      setLoading(false);
    }
  }, [token, selectedStore, selectedUser, dateFrom, dateTo, pagination.limit]);

  useEffect(() => {
    if (token) {
      fetchRevenues();
    }
  }, [token, fetchRevenues]);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      fetchRevenues(newPage);
    }
  };

  const handleExportData = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (selectedStore) queryParams.append('storeId', selectedStore);
      if (selectedUser) queryParams.append('userId', selectedUser);
      if (dateFrom) queryParams.append('dateFrom', dateFrom);
      if (dateTo) queryParams.append('dateTo', dateTo);
      queryParams.append('export', 'true');

      const response = await fetch(`/api/revenues?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `doanh-thu-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Có lỗi xảy ra khi xuất dữ liệu');
    }
  };

  // Thêm utility function để format tiền tệ
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
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
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Quản lý Doanh thu</h1>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-green-400 to-green-600 p-6 rounded-lg shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium opacity-90">Tổng doanh thu</h3>
                <p className="text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <div className="text-green-200">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-400 to-blue-600 p-6 rounded-lg shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium opacity-90">Số giao dịch</h3>
                <p className="text-3xl font-bold">{stats.totalTransactions}</p>
              </div>
              <div className="text-blue-200">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-400 to-purple-600 p-6 rounded-lg shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium opacity-90">Trung bình/giao dịch</h3>
                <p className="text-3xl font-bold">{formatCurrency(stats.averageTransaction)}</p>
              </div>
              <div className="text-purple-200">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-orange-400 to-orange-600 p-6 rounded-lg shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium opacity-90">Tổng giảm giá</h3>
                <p className="text-3xl font-bold">{formatCurrency(stats.totalDiscount)}</p>
              </div>
              <div className="text-orange-200">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Information */}
      {revenues.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Thông tin tổng quan</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Giao dịch có sử dụng mã giảm giá</h4>
              <p className="text-xl font-bold text-blue-600">
                {revenues.filter(r => r.coupon).length} / {revenues.length}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                ({((revenues.filter(r => r.coupon).length / revenues.length) * 100).toFixed(1)}%)
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Tổng doanh thu thực tế</h4>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(revenues.reduce((sum, r) => sum + r.amount, 0))}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Số tiền thực tế đã thu
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Bộ lọc doanh thu</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Từ ngày
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Đến ngày
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="md:col-span-2 flex items-end space-x-2">
            <button
              onClick={() => fetchRevenues(1)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Tìm kiếm</span>
            </button>
            <button
              onClick={() => {
                setSelectedStore('');
                setSelectedUser('');
                setDateFrom('');
                setDateTo('');
                fetchRevenues(1);
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Đặt lại</span>
            </button>
            <button
              onClick={() => handleExportData()}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Xuất Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Revenue Table */}
      <div className="bg-white dark:bg-gray-800 shadow-lg overflow-hidden rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Danh sách giao dịch ({revenues.length} giao dịch)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Thời gian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Thành tiền
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Người tạo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Cửa hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Mã giảm giá
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Mô tả
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {revenues.length > 0 ? (
                revenues.map((revenue, index) => (
                  <tr key={revenue.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex flex-col">
                        <span className="font-medium">{new Date(revenue.createdAt).toLocaleDateString('vi-VN')}</span>
                        <span className="text-xs text-gray-500">{new Date(revenue.createdAt).toLocaleTimeString('vi-VN')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="font-bold text-green-600 text-lg">
                        {formatCurrency(revenue.originalAmount || revenue.amount)}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                            {revenue.user.name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="font-medium">{revenue.user.name}</div>
                          <div className="text-xs text-gray-500">
                            {revenue.user.role}
                            {revenue.user.machineCode && ` • ${revenue.user.machineCode}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold">
                            {revenue.store.name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="font-medium">{revenue.store.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {revenue.coupon ? (
                        <div className="flex flex-col space-y-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {revenue.coupon.code}
                          </span>
                          <span className="text-xs text-gray-500 font-medium">
                            Đã sử dụng mã giảm giá
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Không có
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      <div className="max-w-xs">
                        {revenue.description ? (
                          <div className="truncate" title={revenue.description}>
                            {revenue.description}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Không có mô tả</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-300">
                    <div className="flex flex-col items-center space-y-2">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-lg font-medium">Không có dữ liệu doanh thu</span>
                      <span className="text-sm">Thử thay đổi bộ lọc để xem dữ liệu</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPrevPage}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${pagination.hasPrevPage
                  ? 'text-gray-700 bg-white hover:bg-gray-50'
                  : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                  }`}
              >
                Trước
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasNextPage}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${pagination.hasNextPage
                  ? 'text-gray-700 bg-white hover:bg-gray-50'
                  : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                  }`}
              >
                Sau
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Hiển thị{' '}
                  <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span>
                  {' '}đến{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>
                  {' '}của{' '}
                  <span className="font-medium">{pagination.total}</span>
                  {' '}bản ghi
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrevPage}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${pagination.hasPrevPage
                      ? 'text-gray-500 hover:bg-gray-50'
                      : 'text-gray-300 cursor-not-allowed'
                      }`}
                  >
                    <span className="sr-only">Trước</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(pagination.page - 2, pagination.totalPages - 4)) + i;
                    if (pageNum <= pagination.totalPages) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${pageNum === pagination.page
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    return null;
                  })}

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNextPage}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${pagination.hasNextPage
                      ? 'text-gray-500 hover:bg-gray-50'
                      : 'text-gray-300 cursor-not-allowed'
                      }`}
                  >
                    <span className="sr-only">Sau</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
