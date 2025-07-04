"use client";

import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';

interface Employee {
  id: string;
  name: string;
  email: string;
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
          alert(data.error || 'Failed to fetch store employees');
        }
      } catch (error) {
        console.error('Error fetching store employees:', error);
        alert('Failed to fetch store employees');
      } finally {
        setLoading(false);
      }
    };

    if (user && token) {
      fetchStoreEmployees();
    }
  }, [user, token, storeId]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Đã copy vào clipboard!');
  };

  const copyAllCredentials = () => {
    if (!store) return;
    
    const credentials = store.employees.map(emp => 
      `Email: ${emp.email}\nMật khẩu: 123456\n---`
    ).join('\n');
    
    navigator.clipboard.writeText(credentials);
    alert('Đã copy tất cả thông tin đăng nhập!');
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
        alert('Mật khẩu đã được reset thành công!');
      } else {
        alert(data.error || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('Failed to reset password');
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
        <button
          onClick={() => router.back()}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
        >
          Quay lại
        </button>
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
                  <th className="border border-gray-300 px-4 py-2 text-left">Email</th>
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
                        <span className="font-mono text-sm">{employee.email}</span>
                        <button
                          onClick={() => copyToClipboard(employee.email)}
                          className="text-blue-500 hover:text-blue-700 text-xs"
                          title="Copy email"
                        >
                          📋
                        </button>
                      </div>
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
            • <strong>Email:</strong> Như hiển thị trong bảng trên
          </p>
          <p className="text-blue-700 text-sm mb-2">
            • <strong>Mật khẩu:</strong> 123456 (cho tất cả nhân viên)
          </p>
          <p className="text-blue-700 text-sm">
            • Nhân viên có thể đăng nhập và đổi mật khẩu sau khi đăng nhập lần đầu
          </p>
        </div>
      </div>
    </div>
  );
}
