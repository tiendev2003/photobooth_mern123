"use client";

import { useAuth } from '@/lib/context/AuthContext';
import { useCallback, useEffect, useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  username: string;
  phone: string | null;
  address: string | null;
  createdAt: string;
  isActive?: boolean;
  machineCode?: string | null;
  location?: string | null;
  canDeleteManager?: boolean;
  store?: {
    id: string;
    name: string;
  };
}

export default function UserManagement() {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  
  // Form state for creating/editing user
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'USER',
    phone: '',
    address: '',
    machineCode: '',
    location: ''
  });
  
  // Define fetchUsers with useCallback
  const fetchUsers = useCallback(async (page = pagination.page, limit = pagination.limit) => {
    try {
      setLoading(true);
      
      // Build query string with pagination parameters
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      const response = await fetch(`/api/users?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Không thể tải danh sách người dùng');
      }
      
      const data = await response.json();
      setUsers(data.users || []);
      
      // Update pagination if available
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  }, [token, pagination.page, pagination.limit]);
  
  // Fetch users when component mounts
  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token, fetchUsers]);
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      // Call fetchUsers with the new page
      fetchUsers(newPage, pagination.limit);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleCreateUser = () => {
    setError(null); // Clear any previous errors
    setSuccessMessage(null); // Clear any previous success messages
    setIsEditing(false);
    setFormData({
      id: '',
      name: '',
      username: '',
      email: '',
      password: '',
      role: 'USER',
      phone: '',
      address: '',
      machineCode: '',
      location: ''
    });
    setIsFormOpen(true);
  };
  
  const handleEditUser = (user: User) => {
    setError(null); // Clear any previous errors
    setSuccessMessage(null); // Clear any previous success messages
    setIsEditing(true);
    setFormData({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      password: '', // Don't populate password for security
      role: user.role,
      phone: user.phone || '',
      address: user.address || '',
      machineCode: user.machineCode || '',
      location: user.location || ''
    });
    setIsFormOpen(true);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = isEditing ? `/api/users/${formData.id}` : '/api/users';
      const method = isEditing ? 'PUT' : 'POST';
      
      // Remove password if editing and it's empty
      const requestData = { ...formData } as Partial<typeof formData>;
      if (isEditing && !requestData.password) {
        delete requestData.password;
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        // Parse error response to get detailed error message
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Không thể ${isEditing ? 'cập nhật' : 'tạo'} người dùng`;
        
        // Handle specific error cases
        if (response.status === 409) {
          if (errorMessage.includes('username')) {
            setError('Tên đăng nhập đã tồn tại. Vui lòng chọn tên đăng nhập khác.');
          } else if (errorMessage.includes('email')) {
            setError('Email đã được sử dụng. Vui lòng chọn email khác.');
          } else {
            setError('Dữ liệu đã tồn tại. Vui lòng kiểm tra lại thông tin.');
          }
        } else if (response.status === 400) {
          setError(`Dữ liệu không hợp lệ: ${errorMessage}`);
        } else if (response.status === 403) {
          setError('Bạn không có quyền thực hiện thao tác này.');
        } else if (response.status === 500) {
          setError('Lỗi hệ thống. Vui lòng thử lại sau.');
        } else {
          setError(errorMessage);
        }
        return;
      }
      
      setIsFormOpen(false);
      setError(null); // Clear any previous errors
      fetchUsers(); // Refresh user list
      
      // Show success message
      setSuccessMessage(`${isEditing ? 'Cập nhật' : 'Tạo'} người dùng thành công`);
      setTimeout(() => setSuccessMessage(null), 3000); // Clear success message after 3 seconds
      
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(`Lỗi kết nối: Không thể ${isEditing ? 'cập nhật' : 'tạo'} người dùng. Vui lòng thử lại.`);
    }
  };
  
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa người dùng này?')) return;
    
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        // Parse error response to get detailed error message
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Không thể xóa người dùng';
        
        // Handle specific error cases
        if (response.status === 403) {
          setError('Bạn không có quyền xóa người dùng này.');
        } else if (response.status === 404) {
          setError('Không tìm thấy người dùng cần xóa.');
        } else if (response.status === 409) {
          setError('Không thể xóa người dùng vì có dữ liệu liên quan. Vui lòng liên hệ admin.');
        } else if (response.status === 500) {
          setError('Lỗi hệ thống khi xóa người dùng. Vui lòng thử lại sau.');
        } else {
          setError(errorMessage);
        }
        return;
      }
      
      setError(null); // Clear any previous errors
      fetchUsers(); // Refresh user list
      
      // Show success message
      setSuccessMessage('Xóa người dùng thành công');
      setTimeout(() => setSuccessMessage(null), 3000); // Clear success message after 3 seconds
      
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Lỗi kết nối: Không thể xóa người dùng. Vui lòng thử lại.');
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="inline-flex text-red-400 hover:text-red-600"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setSuccessMessage(null)}
                className="inline-flex text-green-400 hover:text-green-600"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
          Quản lý người dùng
        </h1>
        <button
          onClick={handleCreateUser}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Tạo người dùng</span>
        </button>
      </div>
      
      {/* User Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {isEditing ? 'Chỉnh sửa người dùng' : 'Tạo người dùng mới'}
                </h3>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tên</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tên đăng nhập</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email (tùy chọn)</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {isEditing ? 'Mật khẩu (để trống để giữ nguyên)' : 'Mật khẩu'}
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required={!isEditing}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vai trò</label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="USER">User</option>
                    <option value="STORE_OWNER">Store Owner</option>
                    <option value="MACHINE">Machine</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
                    <option value="KETOAN">Kế toán</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Điện thoại (tùy chọn)</label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Địa chỉ (tùy chọn)</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                
                {/* Machine Code field - only show for MACHINE role */}
                {formData.role === 'MACHINE' && (
                  <>
                    <div>
                      <label htmlFor="machineCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mã máy</label>
                      <input
                        type="text"
                        id="machineCode"
                        name="machineCode"
                        value={formData.machineCode}
                        onChange={handleInputChange}
                        placeholder="Enter machine code (e.g., M001)"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vị trí</label>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="Enter machine location"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </>
                )}
                
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 w-full sm:w-auto"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 w-full sm:w-auto"
                  >
                    {isEditing ? 'Cập nhật' : 'Tạo'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* User Table - Desktop View */}
      <div className="hidden md:block bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tên</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tên tài khoản</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Vai trò</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ngày tạo</th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'ADMIN'
                          ? 'bg-red-100 text-red-800'
                          : user.role === 'MANAGER'
                          ? 'bg-purple-100 text-purple-800'
                          : user.role === 'STORE_OWNER'
                          ? 'bg-blue-100 text-blue-800'
                          : user.role === 'MACHINE'
                          ? 'bg-orange-100 text-orange-800'
                          : user.role === 'KETOAN'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                        {user.role === 'MACHINE' && user.machineCode && ` (${user.machineCode})`}
                      </span>
                      {user.role === 'MACHINE' && user.location && (
                        <div className="text-xs text-gray-400 mt-1">📍 {user.location}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900"
                        title="Chỉnh sửa người dùng"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900"
                        title="Xóa người dùng"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-300">
                    Không tìm thấy người dùng
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {users.length > 0 ? (
          users.map((user) => (
            <div key={user.id} className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">{user.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-300">@{user.username}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditUser(user)}
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200 p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900"
                    title="Chỉnh sửa người dùng"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900"
                    title="Xóa người dùng"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400 w-20">Vai trò:</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.role === 'ADMIN'
                      ? 'bg-red-100 text-red-800'
                      : user.role === 'MANAGER'
                      ? 'bg-purple-100 text-purple-800'
                      : user.role === 'STORE_OWNER'
                      ? 'bg-blue-100 text-blue-800'
                      : user.role === 'MACHINE'
                      ? 'bg-orange-100 text-orange-800'
                      : user.role === 'KETOAN'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {user.role}
                    {user.role === 'MACHINE' && user.machineCode && ` (${user.machineCode})`}
                  </span>
                </div>
                
                {user.role === 'MACHINE' && user.location && (
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400 w-20">Vị trí:</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">📍 {user.location}</span>
                  </div>
                )}
                
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400 w-20">Ngày tạo:</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8 text-center">
            <p className="text-gray-500 dark:text-gray-300">Không tìm thấy người dùng</p>
          </div>
        )}
      </div>
        
      {/* Pagination controls */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 px-4 py-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center sm:text-left">
              Hiển thị {((pagination.page - 1) * pagination.limit) + 1} đến {Math.min(pagination.page * pagination.limit, pagination.total)} trong tổng số {pagination.total} người dùng
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPrevPage}
                className={`px-3 py-1 rounded flex items-center text-sm ${
                  pagination.hasPrevPage 
                    ? 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">Trước</span>
              </button>
              <span className="px-3 py-1 text-sm">
                <span className="hidden sm:inline">Trang </span>{pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasNextPage}
                className={`px-3 py-1 rounded flex items-center text-sm ${
                  pagination.hasNextPage 
                    ? 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                }`}
              >
                <span className="hidden sm:inline">Tiếp</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}