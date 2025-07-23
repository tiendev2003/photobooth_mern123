"use client";

import { useAuth } from '@/lib/context/AuthContext';
import { useDialog } from '@/lib/context/DialogContext';
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
    discount: number; // Số tiền giảm trực tiếp, không phải phần trăm
  };
}

interface RevenueStats {
  totalRevenue: number;
  totalTransactions: number;
  averageTransaction: number;
  totalDiscount: number;
}

interface StoreRevenue {
  store: {
    id: string;
    name: string;
  };
  totalRevenue: number;
  totalTransactions: number;
  totalDiscount: number;
  averageTransaction: number;
  revenues: Revenue[];
  topCouponUser?: {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      machineCode?: string;
    };
    couponUsageCount: number;
    totalCouponDiscount: number;
  };
}


export default function RevenueManagement() {
  const { token } = useAuth();
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [storeRevenues, setStoreRevenues] = useState<StoreRevenue[]>([]);
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');
  const {showDialog} = useDialog();

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

  // Process revenues to group by store
  const processStoreRevenues = useCallback((revenueData: Revenue[]) => {
    const storeMap = new Map<string, StoreRevenue>();

    revenueData.forEach((revenue) => {
      const storeId = revenue.store.id;

      if (!storeMap.has(storeId)) {
        storeMap.set(storeId, {
          store: revenue.store,
          totalRevenue: 0,
          totalTransactions: 0,
          totalDiscount: 0,
          averageTransaction: 0,
          revenues: []
        });
      }

      const storeRevenue = storeMap.get(storeId)!;
      storeRevenue.revenues.push(revenue);
      storeRevenue.totalRevenue += revenue.amount;
      storeRevenue.totalTransactions += 1;
      storeRevenue.totalDiscount += revenue.discountAmount || 0;
    });

    // Calculate averages and find top coupon users
    const storeRevenueArray = Array.from(storeMap.values()).map(storeRevenue => {
      storeRevenue.averageTransaction = storeRevenue.totalRevenue / storeRevenue.totalTransactions;

      // Find user with most coupon usage in this store
      const userCouponMap = new Map<string, {
        user: Revenue['user'];
        couponUsageCount: number;
        totalCouponDiscount: number;
      }>();

      storeRevenue.revenues.forEach(revenue => {
        if (revenue.coupon) {
          const userId = revenue.user.id;
          if (!userCouponMap.has(userId)) {
            userCouponMap.set(userId, {
              user: revenue.user,
              couponUsageCount: 0,
              totalCouponDiscount: 0
            });
          }
          const userCoupon = userCouponMap.get(userId)!;
          userCoupon.couponUsageCount += 1;
          userCoupon.totalCouponDiscount += revenue.discountAmount || 0;
        }
      });

      if (userCouponMap.size > 0) {
        const topCouponUser = Array.from(userCouponMap.values())
          .sort((a, b) => b.couponUsageCount - a.couponUsageCount)[0];
        storeRevenue.topCouponUser = topCouponUser;
      }

      return storeRevenue;
    });

    return storeRevenueArray.sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, []);

  const fetchRevenues = useCallback(async (page = 1) => {
    try {
      setLoading(true);

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '1000' // Lấy nhiều dữ liệu hơn để xử lý phân tích
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
      const revenueData = data.revenues || [];
      setRevenues(revenueData);

      if (data.pagination) {
        setPagination(data.pagination);
      }

      if (data.stats) {
        setStats(data.stats);
      }

      // Process store revenues
      const processedStoreRevenues = processStoreRevenues(revenueData);
      setStoreRevenues(processedStoreRevenues);

    } catch (err) {
      console.error('Error fetching revenues:', err);
      setError('Failed to load revenues');
    } finally {
      setLoading(false);
    }
  }, [token, selectedStore, selectedUser, dateFrom, dateTo, processStoreRevenues]);

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
      showDialog({
        header: "Lỗi",
        content: "Không thể xuất dữ liệu. Vui lòng thử lại sau.",
      });
    }
  };

  // Component hiển thị tổng quan doanh thu theo cửa hàng
  function StoreRevenueSummary({ storeRevenues }: {
    storeRevenues: StoreRevenue[];
  }) {
    const [expandedStores, setExpandedStores] = useState<Set<string>>(new Set());

    const toggleStore = (storeId: string) => {
      const newExpanded = new Set(expandedStores);
      if (newExpanded.has(storeId)) {
        newExpanded.delete(storeId);
      } else {
        newExpanded.add(storeId);
      }
      setExpandedStores(newExpanded);
    };

    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
            Báo cáo doanh thu theo cửa hàng ({storeRevenues.length} cửa hàng)
          </h3>

          {storeRevenues.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-300">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="text-lg font-medium">Không có dữ liệu</p>
              <p className="text-sm">Thử thay đổi bộ lọc để xem dữ liệu</p>
            </div>
          ) : (
            <div className="space-y-4">
              {storeRevenues.map((storeRevenue) => (
                <div key={storeRevenue.store.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div
                    className="p-4 lg:p-6 bg-gray-50 dark:bg-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => toggleStore(storeRevenue.store.id)}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {storeRevenue.store.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {storeRevenue.store.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {storeRevenue.totalTransactions} giao dịch
                          </p>
                        </div>
                      </div>

                      <div className="">


                        <div className="text-center lg:text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Giảm giá</p>
                          <p className="text-lg font-bold text-orange-600">
                            {storeRevenue.totalDiscount}
                          </p>
                        </div>
                        <div className="text-center lg:text-right">
                          <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                            <svg
                              className={`w-5 h-5 text-gray-500 transition-transform ${expandedStores.has(storeRevenue.store.id) ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {expandedStores.has(storeRevenue.store.id) && (
                    <div className="p-4 lg:p-6 bg-white dark:bg-gray-800">
                      {/* Top coupon user */}
                      {storeRevenue.topCouponUser && (
                        <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 rounded-lg">
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            🏆 Người sử dụng mã giảm giá nhiều nhất
                          </h5>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                            <div className="flex items-center space-x-3">
                              <div className="h-8 w-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-xs">
                                  {storeRevenue.topCouponUser.user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {storeRevenue.topCouponUser.user.name}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {storeRevenue.topCouponUser.user.role}
                                  {storeRevenue.topCouponUser.user.machineCode && ` • ${storeRevenue.topCouponUser.user.machineCode}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex space-x-6 text-sm">
                              <div className="text-center">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Số lần sử dụng</p>
                                <p className="font-bold text-green-600">{storeRevenue.topCouponUser.couponUsageCount}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Tổng tiết kiệm</p>
                                <p className="font-bold text-blue-600">{storeRevenue.topCouponUser.totalCouponDiscount}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Recent transactions */}
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          Giao dịch gần đây (5 giao dịch mới nhất)
                        </h5>
                        <div className="space-y-3">
                          {storeRevenue.revenues.slice(0, 5).map((revenue) => (
                            <div key={revenue.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2 sm:space-y-0">
                              <div className="flex items-center space-x-3">
                                <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                                  <span className="text-white font-bold text-xs">
                                    {revenue.user.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                                    {revenue.user.name}
                                  </p>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {new Date(revenue.createdAt).toLocaleDateString('vi-VN')} {new Date(revenue.createdAt).toLocaleTimeString('vi-VN')}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-4">
                                <div className="text-right">
                                  <p className="font-bold text-green-600">
                                    {revenue.discountAmount}
                                  </p>
                                  {revenue.coupon && (
                                    <p className="text-xs text-orange-600">
                                      Mã: {revenue.coupon.code}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Component hiển thị bảng chi tiết doanh thu
  function DetailedRevenueTable({
    revenues,
    pagination,
    handlePageChange
  }: {
    revenues: Revenue[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
    handlePageChange: (page: number) => void;
  }) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow-lg overflow-hidden rounded-lg">
        <div className="px-4 lg:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Danh sách giao dịch chi tiết ({revenues.length} giao dịch)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Thời gian
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Thành tiền
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Người tạo
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Cửa hàng
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Mã giảm giá
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Mô tả
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {revenues.length > 0 ? (
                revenues.map((revenue, index) => (
                  <tr key={revenue.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'}`}>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex flex-col">
                        <span className="font-medium">{new Date(revenue.createdAt).toLocaleDateString('vi-VN')}</span>
                        <span className="text-xs text-gray-500">{new Date(revenue.createdAt).toLocaleTimeString('vi-VN')}</span>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex flex-col">

                        {revenue.originalAmount && revenue.originalAmount !== revenue.amount && (
                          <div className="text-xs text-gray-500 line-through">
                            {revenue.originalAmount}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
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
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
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
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {revenue.coupon ? (
                        <div className="flex flex-col space-y-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {revenue.coupon.code}
                          </span>

                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Không có
                        </span>
                      )}
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-900 dark:text-white">
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
                  <td colSpan={6} className="px-4 lg:px-6 py-12 text-center text-gray-500 dark:text-gray-300">
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
          <div className="px-4 lg:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 space-y-4 sm:space-y-0">
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
    );
  }

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 space-y-4 lg:space-y-0">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            Báo cáo Doanh thu Chi tiết
          </h1>

          {/* View Mode Toggle */}
          <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setViewMode('summary')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'summary'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              Tổng quan
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'detailed'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              Chi tiết
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-r from-green-400 to-green-600 p-6 rounded-lg shadow-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium opacity-90">Tổng doanh thu</h3>
                  <p className="text-2xl lg:text-3xl font-bold">{stats.totalDiscount}</p>
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
                  <h3 className="text-sm font-medium opacity-90">Số cửa hàng</h3>
                  <p className="text-2xl lg:text-3xl font-bold">{storeRevenues.length}</p>
                </div>
                <div className="text-blue-200">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-400 to-purple-600 p-6 rounded-lg shadow-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium opacity-90">Số giao dịch</h3>
                  <p className="text-2xl lg:text-3xl font-bold">{stats.totalTransactions}</p>
                </div>
                <div className="text-purple-200">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Bộ lọc doanh thu</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <div className="md:col-span-2 flex flex-wrap items-end gap-2">
              <button
                onClick={() => fetchRevenues(1)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors flex items-center space-x-2"
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
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Đặt lại</span>
              </button>
              <button
                onClick={() => handleExportData()}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Xuất Excel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content based on view mode */}
        {viewMode === 'summary' ? (
          <StoreRevenueSummary storeRevenues={storeRevenues} />
        ) : (
          <DetailedRevenueTable revenues={revenues} pagination={pagination} handlePageChange={handlePageChange} />
        )}
      </div>
    </div>
  );
}
