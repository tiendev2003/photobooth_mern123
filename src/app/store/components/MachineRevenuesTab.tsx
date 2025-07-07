"use client";

import { formatCurrency, formatDateTime } from '../utils/formatters';

interface MachineRevenue {
  machineId: string;
  machineName: string;
  machineCode: string;
  location?: string;
  todayRevenue: number;
  totalTransactions: number;
  revenues: Revenue[];
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

interface MachineRevenuesTabProps {
  machineRevenues: MachineRevenue[];
  loading: boolean;
  onRefresh: () => void;
}

export default function MachineRevenuesTab({ 
  machineRevenues, 
  loading, 
  onRefresh 
}: MachineRevenuesTabProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Chi tiết doanh thu theo máy</h2>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
              Đang tải...
            </div>
          ) : (
            '🔄 Làm mới'
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {machineRevenues.map((machine) => (
            <div key={machine.machineId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{machine.machineName}</h3>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {machine.machineCode}
                  </span>
                </div>

                {machine.location && (
                  <p className="text-sm text-gray-500 mb-3">📍 {machine.location}</p>
                )}

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Doanh thu hôm nay:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(machine.todayRevenue)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Số giao dịch:</span>
                    <span className="font-medium text-gray-900">{machine.totalTransactions}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Tổng giao dịch:</span>
                    <span className="font-medium text-gray-900">{machine.revenues.length}</span>
                  </div>
                </div>

                {machine.revenues.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">Giao dịch gần đây:</p>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {machine.revenues.slice(0, 3).map((revenue) => (
                        <div key={revenue.id} className="flex justify-between items-center text-xs">
                          <span className="text-gray-600">
                            {formatDateTime(revenue.createdAt).split(' ')[1]}
                          </span>
                          <span className="font-medium text-green-600">
                            {revenue.coupon ? formatCurrency(revenue.coupon.discount) : '-'}
                          </span>
                        </div>
                      ))}
                    </div>
                    {machine.revenues.length > 3 && (
                      <p className="text-xs text-blue-600 mt-2">
                        +{machine.revenues.length - 3} giao dịch khác
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && machineRevenues.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">🎰</div>
          <p className="text-gray-500">Chưa có dữ liệu doanh thu máy</p>
        </div>
      )}
    </div>
  );
}
