"use client";

import { formatCurrency } from "@/lib/utils";
import { formatDateTime } from "../utils/formatters";

 
interface StoreInfo {
  id: string;
  name: string;
  maxEmployees: number;
  maxAccounts: number;
  employees: Employee[];
  revenues: Revenue[];
  todayRevenue: number;
  monthRevenue: number;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  machineCode?: string;
  location?: string;
  isActive: boolean;
  createdAt: string;
}

interface Revenue {
  id: string;
  description?: string;
  createdAt: string;
  user: {
    name: string;
    role: string;
    machineCode?: string;
  };
  coupon?: {
    code: string;
    discount: number;
  };
}

interface OverviewTabProps {
  store: StoreInfo;
}

export default function OverviewTab({ store }: OverviewTabProps) {
  const activeEmployees = store.employees.filter(emp => emp.isActive).length;
  const recentRevenues = store.revenues
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Tổng quan cửa hàng</h2>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">💰</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Doanh thu hôm nay</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(store.todayRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">📈</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Doanh thu tháng</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(store.monthRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">👥</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Nhân viên hoạt động</p>
              <p className="text-2xl font-bold text-gray-900">
                {activeEmployees}/{store.maxEmployees}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">🎯</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Tổng giao dịch</p>
              <p className="text-2xl font-bold text-gray-900">{store.revenues.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Revenue */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Giao dịch gần đây</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Máy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã giảm giá
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giá trị
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentRevenues.map((revenue) => (
                <tr key={revenue.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDateTime(revenue.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {revenue.user.machineCode || revenue.user.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {revenue.coupon ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {revenue.coupon.code}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {revenue.coupon ? formatCurrency(revenue.coupon.discount) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {recentRevenues.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">📊</div>
              <p className="text-gray-500">Chưa có giao dịch nào</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
