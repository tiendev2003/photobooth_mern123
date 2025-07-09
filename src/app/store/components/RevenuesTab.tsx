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
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div className="mb-4 md:mb-0">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              Chi tiết doanh thu - {machine.machineName}
            </h2>
            <p className="text-sm text-gray-500">
              Mã máy: {machine.machineCode}
              {machine.location && ` - ${machine.location}`}
            </p>
          </div>
          <button
            onClick={() => onMachineSelect(null)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            ← Quay lại
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500">Doanh thu hôm nay</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {formatCurrency(machine.todayRevenue)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500">Số lượt in hôm nay</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {machine.totalTransactions}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Người thực hiện
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã giảm giá
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {machine.revenues.map((revenue) => (
                  <tr key={revenue.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateTime(revenue.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                      {revenue.user.name}
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

  return (
    <div className="space-y-6">
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">
        Doanh thu theo máy
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {machineRevenues.map((machine) => (
          <button
            key={machine.machineId}
            onClick={() => onMachineSelect(machine.machineId)}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-left hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {machine.machineName}
                </h3>
                <p className="text-sm text-gray-500">
                  {machine.machineCode}
                  {machine.location && ` - ${machine.location}`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Doanh thu hôm nay</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {formatCurrency(machine.todayRevenue)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Số lượt in</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {machine.totalTransactions}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
