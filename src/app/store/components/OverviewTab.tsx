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
  const recentRevenues = store.revenues.slice(0, 5); // Only show 5 most recent revenues

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Doanh thu hôm nay</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {formatCurrency(store.todayRevenue)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Doanh thu tháng</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {formatCurrency(store.monthRevenue)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Nhân viên hoạt động</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {activeEmployees}/{store.maxEmployees}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Số máy hoạt động</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {store.employees.filter(emp => emp.role === 'MACHINE' && emp.isActive).length}/
            {store.maxAccounts}
          </p>
        </div>
      </div>

      {/* Recent Revenues */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Doanh thu gần đây</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người thực hiện
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã máy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã giảm giá
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentRevenues.map((revenue) => (
                <tr key={revenue.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDateTime(revenue.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {revenue.user.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {revenue.user.machineCode || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {revenue.coupon ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {revenue.coupon.code} (-{revenue.coupon.discount}%)
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
