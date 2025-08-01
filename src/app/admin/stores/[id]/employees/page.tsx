"use client";

import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import AddEmployeeModal, { EmployeeFormData } from './AddEmployeeModal';
import { useDialog } from '@/lib/context/DialogContext';

interface Employee {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  machineCode?: string;
  location?: string;
  isActive: boolean;
  createdAt: string;
}

interface Store {
  id: string;
  name: string;
  maxEmployees: number;
  employees: Employee[];
}

export default function StoreEmployeesPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, token } = useAuth();
  const router = useRouter();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPasswords, setShowPasswords] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
    const {showDialog} = useDialog();
  
  // Unwrap params using React.use()
  const resolvedParams = use(params);
  const storeId = resolvedParams.id;

  useEffect(() => {
    const fetchStoreEmployees = async () => {
      try {
        const response = await fetch(`/api/stores/${storeId}/employees`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          setStore(data.store);
        } else {
          showDialog({
            header: "Lỗi",
            content: data.error || 'Failed to fetch store employees',
          });
        }
      } catch (error) {
        console.error('Error fetching store employees:', error);
        showDialog({
          header: "Lỗi",
          content: 'Failed to fetch store employees',
        });
      } finally {
        setLoading(false);
      }
    };

    if (user && token) {
      fetchStoreEmployees();
    }
  }, [user, token, storeId, refreshTrigger, showDialog]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
     showDialog({
      header: "Thông báo",
      content: "Đã sao chép vào clipboard!",
    });
  };

  const copyAllCredentials = () => {
    if (!store) return;
    
    const credentials = store.employees.map(emp => 
      `Email: ${emp.email}\nMật khẩu: 123456\n---`
    ).join('\n');
    
    navigator.clipboard.writeText(credentials);
    showDialog({
      header: "Thông báo",
      content: "Đã sao chép tất cả thông tin đăng nhập vào clipboard!",
    });
  };

  const resetPassword = async (employeeId: string) => {
    if (!confirm('Bạn có chắc muốn reset mật khẩu về 123456?')) return;
    
    try {
      const response = await fetch(`/api/users/${employeeId}/reset-password`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        showDialog({
          header: "Thông báo",
          content: "Mật khẩu đã được reset thành công!",
        });
      } else {
        showDialog({
          header: "Lỗi",
          content: data.error || 'Failed to reset password',
        });
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      showDialog({
        header: "Lỗi",
        content: 'Failed to reset password',
      });
    }
  };

  const handleAddEmployee = async (employeeData: EmployeeFormData) => {
    try {
      const response = await fetch(`/api/stores/${storeId}/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(employeeData),
      });

      const data = await response.json();
      
      if (response.ok) {
        
        showDialog({
          header: "Thành công",
          content: "Nhân viên đã được thêm thành công",
        });
        setRefreshTrigger(prev => prev + 1); // Refresh the list
      } else {
        throw new Error(data.error || 'Failed to create employee');
      }
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  };

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
        return 'Máy chụp ảnh';
      default:
        return role;
    }
  };

  if (loading) {
    return <div className="p-6">Đang tải...</div>;
  }

  if (!store) {
    return <div className="p-6">Không tìm thấy cửa hàng</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Nhân viên cửa hàng: {store.name}</h1>
          <p className="text-gray-600">
            Tổng nhân viên: {store.employees.length}/{store.maxEmployees}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Thêm nhân viên
          </button>
          <button
            onClick={() => router.back()}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            Quay lại
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Danh sách nhân viên</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPasswords(!showPasswords)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
            >
              {showPasswords ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            </button>
            <button
              onClick={copyAllCredentials}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm"
            >
              Copy tất cả thông tin
            </button>
          </div>
        </div>

        {store.employees.length === 0 ? (
          <p className="text-gray-500">Chưa có nhân viên nào</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">STT</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Tên</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Tên tài khoản</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Vai trò</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Mã máy</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Vị trí</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Mật khẩu</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Trạng thái</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Ngày tạo</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {store.employees.map((employee, index) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
                    <td className="border border-gray-300 px-4 py-2">{employee.name}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{employee.username}</span>
                        <button
                          onClick={() => copyToClipboard(employee.username)}
                          className="text-blue-500 hover:text-blue-700 text-xs"
                          title="Copy username"
                        >
                          📋
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(employee.role)}`}>
                        {getRoleDisplayName(employee.role)}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {employee.machineCode ? (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{employee.machineCode}</span>
                          <button
                            onClick={() => copyToClipboard(employee.machineCode!)}
                            className="text-blue-500 hover:text-blue-700 text-xs"
                            title="Copy machine code"
                          >
                            📋
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {employee.location || <span className="text-gray-400">-</span>}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">
                          {showPasswords ? '123456' : '••••••'}
                        </span>
                        {showPasswords && (
                          <button
                            onClick={() => copyToClipboard('123456')}
                            className="text-blue-500 hover:text-blue-700 text-xs"
                            title="Copy password"
                          >
                            📋
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        employee.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {employee.isActive ? 'Hoạt động' : 'Không hoạt động'}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {new Date(employee.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <button
                        onClick={() => resetPassword(employee.id)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs"
                      >
                        Reset MK
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Thông tin đăng nhập mặc định:</h3>
          <p className="text-blue-700 text-sm mb-2">
            • <strong>Tên đăng nhập:</strong> Như hiển thị trong bảng trên
          </p>
          <p className="text-blue-700 text-sm mb-2">
            • <strong>Mật khẩu:</strong> 123456 (cho tất cả nhân viên)
          </p>
          <p className="text-blue-700 text-sm">
            • Nhân viên có thể đăng nhập và đổi mật khẩu sau khi đăng nhập lần đầu
          </p>
        </div>
      </div>

      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddEmployee}
        storeId={storeId}
      />
    </div>
  );
}
