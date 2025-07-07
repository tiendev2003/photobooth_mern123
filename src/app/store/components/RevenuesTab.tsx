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

interface RevenuesTabProps {
  machineRevenues: MachineRevenue[];
  selectedMachine: string | null;
  onMachineSelect: (machineId: string | null) => void;
}

export default function RevenuesTab({ 
  machineRevenues, 
  selectedMachine, 
  onMachineSelect 
}: RevenuesTabProps) {
  if (selectedMachine) {
    const machine = machineRevenues.find(m => m.machineId === selectedMachine);
    if (!machine) return null;

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Chi tiết doanh thu - {machine.machineName}
          </h2>
          <button
            onClick={() => onMachineSelect(null)}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            ← Quay lại
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Lịch sử giao dịch ({machine.revenues.length})
              </h3>
              <div className="text-sm text-gray-500">
                Doanh thu hôm nay: <span className="font-semibold text-green-600">
                  {formatCurrency(machine.todayRevenue)}
                </span>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã giảm giá
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giá trị
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mô tả
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {machine.revenues.map((revenue) => (
                  <tr key={revenue.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateTime(revenue.createdAt)}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {revenue.description || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {machine.revenues.length === 0 && (
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

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Doanh thu theo máy - Hôm nay</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {machineRevenues.map((machine) => (
          <div 
            key={machine.machineId} 
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onMachineSelect(machine.machineId)}
          >
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

                <div className="pt-3 border-t border-gray-100">
                  <span className="text-xs text-blue-600 hover:text-blue-800">
                    Xem chi tiết →
                  </span>
                </div>
              </div>

              {machine.revenues.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Giao dịch gần nhất: {formatDateTime(machine.revenues[0].createdAt)}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {machineRevenues.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">🎰</div>
          <p className="text-gray-500">Chưa có dữ liệu doanh thu máy</p>
        </div>
      )}
    </div>
  );
}
