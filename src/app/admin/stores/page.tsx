"use client";

import { useAuth } from '@/lib/context/AuthContext';
import { useDialog } from '@/lib/context/DialogContext';
import { uploadImageWithStore } from '@/lib/utils/uploadApi';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
interface Store {
  id: string;
  name: string;
  slogan?: string;
  logo?: string;
  background?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  accountNumber?: string;
  brandName?: string;
  brandLogo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  isActive: boolean;
  maxEmployees: number;
  maxAccounts?: number;
  createdAt: string;
  manager: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    employees: number;
    employeesOnly?: number;
    machines?: number;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function StoresPage() {
  const { user, token } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
    const {showDialog} = useDialog();
  
  const [formData, setFormData] = useState({
    name: '',
    slogan: '',
    logo: '',
    logoFile: null as File | null,
    background: '',
    backgroundFile: null as File | null,
    description: '',
    address: '',
    phone: '',
    email: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    maxEmployees: 10,
    maxAccounts: 20,
    managerId: ''
  });
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  useEffect(() => {

    const fetchStores = async () => {
      try {
        const response = await fetch('/api/stores', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          setStores(data.stores || []);
        } else {
           showDialog({
            header: "Lỗi",
            content: data.error || "Không thể tải danh sách cửa hàng.",
          });
        }
      } catch (error) {
        console.error('Error fetching stores:', error);
        showDialog({
          header: "Lỗi",
          content: "Không thể tải danh sách cửa hàng.",
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchManagers = async () => {
      try {
        const response = await fetch('/api/users?role=MANAGER,STORE_OWNER', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          setManagers(data.users || []);
        }
      } catch (error) {
        console.error('Error fetching managers:', error);
      }
    };

    if (user && token) {
      fetchStores();
      if (user.role === 'ADMIN') {
        fetchManagers();
      }
    }
  }, [user, token, showDialog]);

  // Generate unique account number
  const generateAccountNumber = () => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ST${timestamp.slice(-6)}${random}`;
  };

  // Upload file function using external API
  const uploadFile = async (file: File, type: 'logo' | 'background'): Promise<string> => {
    try {
      return await uploadImageWithStore(file);
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      throw new Error(`Failed to upload ${type}`);
    }
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear any previous errors
    setSuccessMessage(null); // Clear any previous success messages
    setUploading(true);
    try {
      let logoUrl = formData.logo;
      let backgroundUrl = formData.background;

      if (formData.logoFile) {
        logoUrl = await uploadFile(formData.logoFile, 'logo');
      }

      if (formData.backgroundFile) {
        backgroundUrl = await uploadFile(formData.backgroundFile, 'background');
      }

      const newStore = {
        ...formData,
        logo: logoUrl,
        background: backgroundUrl,
        accountNumber: generateAccountNumber(),
      };

      // Remove file objects from data
      const { logoFile, backgroundFile, ...storeData } = newStore;
      console.log('Creating store with data:', logoFile);
      console.log('Creating store with data:', backgroundFile);

      const response = await fetch('/api/stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(storeData),
      });
      const data = await response.json();
      if (response.ok) {
        const message = data.message || 'Store created successfully';
        const createdUsersCount = data.createdUsers || 0;
        const createdEmployees = data.createdEmployees || 0;
        const createdMachines = data.createdMachines || 0;

        setSuccessMessage(`${message}\n\nTạo thành công:\n- ${createdEmployees} tài khoản nhân viên\n- ${createdMachines} tài khoản máy\n- Tổng cộng: ${createdUsersCount} tài khoản`);
        setTimeout(() => setSuccessMessage(null), 5000); // Clear success message after 5 seconds
        setStores([data.store, ...stores]);
        setShowCreateForm(false);
        resetForm();
      } else {
        // Handle specific error cases
        if (response.status === 400) {
          if (data.error.includes('MANAGER') || data.error.includes('STORE_OWNER')) {
            setError('Người dùng được chọn phải có vai trò MANAGER hoặc STORE_OWNER để có thể quản lý cửa hàng.');
          } else {
            setError(`Dữ liệu không hợp lệ: ${data.error}`);
          }
        } else if (response.status === 404) {
          setError('Không tìm thấy manager được chọn.');
        } else if (response.status === 500) {
          setError('Lỗi hệ thống: Vui lòng thử lại sau.');
        } else {
          setError(data.error || 'Không thể tạo cửa hàng');
        }
      }
    } catch (error) {
      console.error('Error creating store:', error);
      setError('Lỗi kết nối: Không thể tạo cửa hàng. Vui lòng kiểm tra kết nối mạng và thử lại.');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore) return;

    setError(null); // Clear any previous errors
    setSuccessMessage(null); // Clear any previous success messages
    setUploading(true);
    try {
      let logoUrl = formData.logo;
      let backgroundUrl = formData.background;

      if (formData.logoFile) {
        logoUrl = await uploadFile(formData.logoFile, 'logo');
      }

      if (formData.backgroundFile) {
        backgroundUrl = await uploadFile(formData.backgroundFile, 'background');
      }

      const updatedStore = {
        ...formData,
        logo: logoUrl,
        background: backgroundUrl,
      };

      // Remove file objects from data
      const { logoFile, backgroundFile, ...storeData } = updatedStore;
      console.log('Updating store with data:', logoFile);
      console.log('Updating store with data:', backgroundFile);

      const response = await fetch(`/api/stores/${selectedStore.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(storeData),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMessage(`Cập nhật cửa hàng "${selectedStore.name}" thành công`);
        setTimeout(() => setSuccessMessage(null), 3000);
        setStores(stores.map(s => s.id === selectedStore.id ? data.store : s));
        setSelectedStore(null);
        setShowCreateForm(false);
        resetForm();
      } else {
        if (response.status === 404) {
          setError('Không tìm thấy cửa hàng cần cập nhật.');
        } else if (response.status === 400) {
          setError(`Dữ liệu không hợp lệ: ${data.error}`);
        } else if (response.status === 500) {
          setError('Lỗi hệ thống khi cập nhật cửa hàng. Vui lòng thử lại sau.');
        } else {
          setError(data.error || 'Không thể cập nhật cửa hàng');
        }
      }
    } catch (error) {
      console.error('Error updating store:', error);
      setError('Lỗi kết nối: Không thể cập nhật cửa hàng. Vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteStore = async (storeId: string) => {
    // Tìm thông tin store để hiển thị tên
    const store = stores.find(s => s.id === storeId);
    const storeName = store?.name || 'cửa hàng này';

    if (!confirm(`Bạn có chắc chắn muốn xóa ${storeName}? Hành động này không thể hoàn tác.`)) return;

    try {
      const response = await fetch(`/api/stores/${storeId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        // Parse error response to get detailed error message
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Không thể xóa cửa hàng';

        // Handle specific error cases
        if (response.status === 404) {
          setError('Không tìm thấy cửa hàng cần xóa.');
        } else if (response.status === 400 && errorData.canForceDelete) {
          // Hiển thị thông tin chi tiết về dữ liệu liên quan
          const relatedData = errorData.relatedData || {};
          const details = [];
          if (relatedData.employees > 0) details.push(`${relatedData.employees} nhân viên`);
          if (relatedData.frameTemplates > 0) details.push(`${relatedData.frameTemplates} template khung ảnh`);
          if (relatedData.coupons > 0) details.push(`${relatedData.coupons} mã giảm giá`);
          if (relatedData.revenues > 0) details.push(`${relatedData.revenues} bản ghi doanh thu`);

          // Hỏi user có muốn xóa toàn bộ không
          const confirmDeleteAll = confirm(
            `Cửa hàng "${storeName}" vẫn còn dữ liệu liên quan:\n- ${details.join('\n- ')}\n\nBạn có muốn xóa toàn bộ cửa hàng và tất cả dữ liệu liên quan không?\n\n⚠️ Hành động này không thể hoàn tác!`
          );

          if (confirmDeleteAll) {
            // Gọi API xóa với tham số force
            const forceResponse = await fetch(`/api/stores/${storeId}?force=true`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });

            if (forceResponse.ok) {
              const forceData = await forceResponse.json();
              const deletedData = forceData.deletedData || {};

              setError(null);
              setStores(stores.filter(s => s.id !== storeId));

              const successDetails = [];
              if (deletedData.employees > 0) successDetails.push(`${deletedData.employees} nhân viên`);
              if (deletedData.frameTemplates > 0) successDetails.push(`${deletedData.frameTemplates} template`);
              if (deletedData.coupons > 0) successDetails.push(`${deletedData.coupons} mã giảm giá`);
              if (deletedData.revenues > 0) successDetails.push(`${deletedData.revenues} bản ghi doanh thu`);

              const message = successDetails.length > 0
                ? `Đã xóa cửa hàng "${storeName}" và ${successDetails.join(', ')} thành công`
                : `Đã xóa cửa hàng "${storeName}" thành công`;

              setSuccessMessage(message);
              setTimeout(() => setSuccessMessage(null), 5000);
            } else {
              const forceErrorData = await forceResponse.json().catch(() => ({}));
              setError(forceErrorData.error || 'Không thể xóa cửa hàng và dữ liệu liên quan');
            }
          }
        } else if (response.status === 403) {
          setError('Bạn không có quyền xóa cửa hàng này.');
        } else if (response.status === 500) {
          setError('Lỗi hệ thống khi xóa cửa hàng. Vui lòng thử lại sau.');
        } else {
          setError(errorMessage);
        }
        return;
      }

      // Xóa thành công
      const data = await response.json();
      setError(null);
      setStores(stores.filter(s => s.id !== storeId));
      setSuccessMessage(data.message || `Đã xóa cửa hàng "${storeName}" thành công`);
      setTimeout(() => setSuccessMessage(null), 3000);

    } catch (error) {
      console.error('Error deleting store:', error);
      setError('Lỗi kết nối: Không thể xóa cửa hàng. Vui lòng thử lại.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slogan: '',
      logo: '',
      logoFile: null,
      background: '',
      backgroundFile: null,
      description: '',
      address: '',
      phone: '',
      email: '',
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
      maxEmployees: 10,
      maxAccounts: 20,
      managerId: ''
    });
  };

  const openEditForm = (store: Store) => {
    setSelectedStore(store);
    setFormData({
      name: store.name,
      slogan: store.slogan || '',
      logo: store.logo || '',
      logoFile: null,
      background: store.background || '',
      backgroundFile: null,
      description: store.description || '',
      address: store.address || '',
      phone: store.phone || '',
      email: store.email || '',
      primaryColor: store.primaryColor || '#3B82F6',
      secondaryColor: store.secondaryColor || '#10B981',
      maxEmployees: store.maxEmployees,
      maxAccounts: store.maxAccounts || 20,
      managerId: store.manager.id
    });
    setShowCreateForm(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Quản lý cửa hàng</h1>
        {user?.role === 'ADMIN' && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <span>+</span>
            Tạo cửa hàng mới
          </button>
        )}
      </div>

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
          </div>
        </div>
      )}

      {/* Store List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stores.map((store) => (
          <div key={store.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div
              className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 relative"
              style={{
                background: store.background
                  ? `url(${store.background}) center/cover`
                  : store.primaryColor && store.secondaryColor
                    ? `linear-gradient(to right, ${store.primaryColor}, ${store.secondaryColor})`
                    : undefined
              }}
            >
              {store.logo && (
                <Image
                  src={store.logo}
                  alt={store.name}
                  width={48}
                  height={48}
                  className="absolute top-2 right-2 w-12 h-12 object-cover rounded-full bg-white p-1"
                />
              )}
            </div>

            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  {store.name}
                  {store._count.employees > 0 && (
                    <span className="text-orange-500 text-sm" title="Cửa hàng có dữ liệu liên quan">
                      ⚠️
                    </span>
                  )}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs ${store.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                  {store.isActive ? 'Hoạt động' : 'Tạm dừng'}
                </span>
              </div>

              {store.slogan && (
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Slogan:</span> {store.slogan}
                </p>
              )}

              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Quản lý:</span> {store.manager.name}
              </p>

              {store.accountNumber && (
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Số tài khoản:</span> {store.accountNumber}
                </p>
              )}

              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Tổng tài khoản:</span> {store._count.employees}
              </p>

              <div className="text-sm text-gray-600 mb-2 grid grid-cols-2 gap-2">
                <div>
                  <span className="font-medium">Nhân viên:</span> {store._count.employeesOnly || 0}/{store.maxEmployees}
                </div>
                <div>
                  <span className="font-medium">Máy:</span> {store._count.machines || 0}/{store.maxAccounts || 20}
                </div>
              </div>

              {store.address && (
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Địa chỉ:</span> {store.address}
                </p>
              )}

              {store.phone && (
                <p className="text-sm text-gray-600 mb-4">
                  <span className="font-medium">Điện thoại:</span> {store.phone}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => openEditForm(store)}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded text-sm"
                >
                  Chỉnh sửa
                </button>
                <button
                  onClick={() => router.push(`/admin/stores/${store.id}/employees`)}
                  className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded text-sm"
                >
                  Nhân viên ({store._count.employees})
                </button>
                {user?.role === 'ADMIN' && (
                  <button
                    onClick={() => handleDeleteStore(store.id)}
                    className={`py-2 px-4 rounded text-sm text-white ${store._count.employees > 0
                        ? 'bg-orange-500 hover:bg-orange-600'
                        : 'bg-red-500 hover:bg-red-600'
                      }`}
                    title={
                      store._count.employees > 0
                        ? 'Cửa hàng có dữ liệu liên quan - cần xác nhận xóa'
                        : 'Xóa cửa hàng'
                    }
                  >
                    {store._count.employees > 0 ? '⚠️ Xóa' : 'Xóa'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Store Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                {selectedStore ? 'Chỉnh sửa cửa hàng' : 'Tạo cửa hàng mới'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setSelectedStore(null);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={selectedStore ? handleUpdateStore : handleCreateStore} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên cửa hàng *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {!selectedStore && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số tài khoản (tự động tạo)
                    </label>
                    <input
                      type="text"
                      value={generateAccountNumber()}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slogan cửa hàng
                  </label>
                  <input
                    type="text"
                    value={formData.slogan}
                    onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ví dụ: Chụp ảnh đẹp - Kỷ niệm vui"
                  />
                </div>
              </div>

              {!selectedStore && (
                <div className="bg-blue-50 p-4 rounded-md">
                  <h4 className="font-medium text-blue-900 mb-2">📋 Thông tin tạo tài khoản tự động</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Tài khoản nhân viên: {formData.maxEmployees} tài khoản (role: USER)</li>
                    <li>• Tài khoản máy: {formData.maxAccounts} tài khoản (role: MACHINE)</li>
                    <li>• Mật khẩu mặc định: <code className="bg-blue-100 px-1 rounded">123456</code></li>
                    <li>• Username tự động: <code className="bg-blue-100 px-1 rounded">[tênstore]_nv[số]_[random]</code></li>
                  </ul>
                </div>
              )}


              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logo cửa hàng
                  </label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setFormData({ ...formData, logoFile: file, logo: file ? '' : formData.logo });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="text-center text-gray-500">hoặc</div>
                    <input
                      type="url"
                      value={formData.logo}
                      onChange={(e) => setFormData({ ...formData, logo: e.target.value, logoFile: null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập URL logo"
                      disabled={!!formData.logoFile}
                    />
                    {/* Logo Preview */}
                    {(formData.logoFile || formData.logo) && (
                      <div className="mt-2">
                        <Image
                          src={formData.logoFile ? URL.createObjectURL(formData.logoFile) : formData.logo}
                          alt="Logo preview"
                          width={80}
                          height={80}
                          className="w-20 h-20 object-cover rounded-lg border border-gray-300"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ảnh background cửa hàng
                  </label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setFormData({ ...formData, backgroundFile: file, background: file ? '' : formData.background });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="text-center text-gray-500">hoặc</div>
                    <input
                      type="url"
                      value={formData.background}
                      onChange={(e) => setFormData({ ...formData, background: e.target.value, backgroundFile: null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập URL ảnh background"
                      disabled={!!formData.backgroundFile}
                    />
                    {/* Background Preview */}
                    {(formData.backgroundFile || formData.background) && (
                      <div className="mt-2">
                        <Image
                          src={formData.backgroundFile ? URL.createObjectURL(formData.backgroundFile) : formData.background}
                          alt="Background preview"
                          width={400}
                          height={128}
                          className="w-full h-32 object-cover rounded-lg border border-gray-300"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Màu chủ đạo
                  </label>
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Màu phụ
                  </label>
                  <input
                    type="color"
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số nhân viên tối đa
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.maxEmployees}
                    onChange={(e) => setFormData({ ...formData, maxEmployees: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Số lượng tài khoản nhân viên sẽ được tạo tự động
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số tài khoản máy tối đa
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.maxAccounts}
                    onChange={(e) => setFormData({ ...formData, maxAccounts: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Số lượng tài khoản máy chụp ảnh sẽ được tạo tự động
                  </p>
                </div>

                {user?.role === 'ADMIN' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quản lý cửa hàng *
                    </label>
                    <select
                      value={formData.managerId}
                      onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Chọn quản lý</option>
                      {managers.filter(manager => manager.role === 'STORE_OWNER' || manager.role === 'MANAGER').map((manager) => (
                        <option key={manager.id} value={manager.id}>
                          {manager.name} ({manager.role})
                        </option>
                      ))}
                    </select>

                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Địa chỉ
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Điện thoại
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setSelectedStore(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {uploading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang xử lý...
                    </>
                  ) : (
                    selectedStore ? 'Cập nhật' : 'Tạo cửa hàng'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
