"use client";

import { formatDateTime } from '../utils/formatters';

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

interface EmployeesTabProps {
  employees: Employee[];
  maxEmployees: number;
}

export default function EmployeesTab({ employees, maxEmployees }: EmployeesTabProps) {
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'STORE_OWNER':
        return 'bg-purple-100 text-purple-800';
      case 'USER':
        return 'bg-blue-100 text-blue-800';
      case 'MACHINE':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'STORE_OWNER':
        return 'Chủ cửa hàng';
      case 'USER':
        return 'Nhân viên';
      case 'MACHINE':
        return 'Máy';
      default:
        return role;
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Quản lý nhân viên</h2>

      <div className="bg-white shadow-sm rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              Danh sách nhân viên ({employees.length}/{maxEmployees})
            </h3>
            <div className="text-sm text-gray-500">
              Còn lại: <span className="font-medium text-gray-900">{maxEmployees - employees.length}</span> vị trí
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vai trò
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã máy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vị trí
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày tham gia
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {employee.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(employee.role)}`}>
                      {getRoleDisplayName(employee.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.machineCode ? (
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                        {employee.machineCode}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.location || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      employee.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {employee.isActive ? (
                        <>
                          <svg className="mr-1.5 h-2 w-2 fill-current" viewBox="0 0 8 8">
                            <circle cx={4} cy={4} r={3} />
                          </svg>
                          Hoạt động
                        </>
                      ) : (
                        <>
                          <svg className="mr-1.5 h-2 w-2 fill-current" viewBox="0 0 8 8">
                            <circle cx={4} cy={4} r={3} />
                          </svg>
                          Tạm dừng
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDateTime(employee.createdAt).split(' ')[0]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {employees.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">👥</div>
              <p className="text-gray-500">Chưa có nhân viên nào</p>
              <p className="text-xs text-gray-400 mt-1">
                Tối đa {maxEmployees} nhân viên
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      {employees.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-500">Tổng nhân viên</div>
            <div className="text-2xl font-bold text-gray-900">{employees.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-500">Đang hoạt động</div>
            <div className="text-2xl font-bold text-green-600">
              {employees.filter(emp => emp.isActive).length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-500">Số máy</div>
            <div className="text-2xl font-bold text-blue-600">
              {employees.filter(emp => emp.role === 'MACHINE').length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-500">Nhân viên thường</div>
            <div className="text-2xl font-bold text-purple-600">
              {employees.filter(emp => emp.role === 'USER').length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
