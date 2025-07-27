"use client";

import { useAuth } from '@/lib/context/AuthContext';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';

interface FrameType {
  id: string;
  name: string;
  description?: string;
  columns: number;
  rows: number;
  totalImages: number;
  isCircle: boolean;
  isHot: boolean;
  isCustom: boolean;
}

interface Store {
  id: string;
  name: string;
  primaryColor?: string;
  secondaryColor?: string;
}

interface FrameTemplate {
  id: string;
  name: string;
  filename: string;
  background: string;
  overlay: string;
  frameTypeId: string;
  frameType: FrameType;
  storeId?: string | null;
  store?: Store | null;
  isGlobal: boolean;
  isActive: boolean;
  position: number;
  createdAt: string;
}

interface UserWithStore {
  id: string;
  name: string;
  email: string;
  role: string;
  storeId?: string;
}

export default function TemplatesManagement() {
  const { user, token } = useAuth();
  const [templates, setTemplates] = useState<FrameTemplate[]>([]);
  const [frameTypes, setFrameTypes] = useState<FrameType[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // Pagination state
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFrameType, setFilterFrameType] = useState('');
  const [filterStore, setFilterStore] = useState('');
  const [filterGlobal, setFilterGlobal] = useState('');
  const [sortOrder, setSortOrder] = useState('position'); // 'position', 'name', 'date'

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    filename: '',
    background: '',
    overlay: '',
    frameTypeId: '',
    storeId: '',
    isGlobal: false,
    isActive: true,
    position: 0
  });

  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [overlayFile, setOverlayFile] = useState<File | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null);
  const [overlayPreview, setOverlayPreview] = useState<string | null>(null);

  // Define fetchData with useCallback
  const fetchData = useCallback(async (
    page = 1,
    limit = 10,
    search = '',
    frameTypeId = '',
    storeId = '',
    isGlobal = '',
    sortBy = 'position'
  ) => {
    try {
      setLoading(true);
      setError(null);

      console.log('User data:', user);
      console.log('User role:', user?.role);

      // Build query string with pagination, search, and filter parameters
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy: sortBy
      });

      if (search) {
        queryParams.append('search', search);
      }

      if (frameTypeId) {
        queryParams.append('frameTypeId', frameTypeId);
      }

      if (storeId) {
        queryParams.append('storeId', storeId);
      }

      if (isGlobal) {
        queryParams.append('isGlobal', isGlobal);
      }

      // Include global templates for non-admin users
      if (user?.role !== 'ADMIN' && user?.role !== 'MANAGER') {
        queryParams.append('includeGlobal', 'true');
      }

      // Fetch templates
      const templatesResponse = await fetch(`/api/frame-templates?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!templatesResponse.ok) {
        throw new Error('Failed to fetch templates');
      }

      const templatesData = await templatesResponse.json();
      setTemplates(templatesData.data || []);
      setPagination(templatesData.pagination || {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
      });

      // Fetch frame types for dropdown
      const frameTypesResponse = await fetch('/api/frame-types', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!frameTypesResponse.ok) {
        throw new Error('Failed to fetch frame types');
      }

      const frameTypesData = await frameTypesResponse.json();
      console.log('Frame types data:', frameTypesData);
      setFrameTypes(frameTypesData.data || []);

      // Fetch stores for dropdown (only if user is admin or manager)
      if (user?.role === 'ADMIN' || user?.role === 'MANAGER') {
        console.log('User is admin or manager, fetching stores...');
        const storesResponse = await fetch('/api/stores', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log('Stores response status:', storesResponse.status);

        if (!storesResponse.ok) {
          console.error('Failed to fetch stores:', storesResponse.status, storesResponse.statusText);
          throw new Error('Failed to fetch stores');
        }

        const storesData = await storesResponse.json();
        console.log('Stores data:', storesData);
        setStores(storesData.stores || []);
      } else {
        console.log('User is not admin, role:', user?.role);
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  // Fetch templates and frame types when component mounts or filters change
  useEffect(() => {
    if (token) {
      fetchData(pagination.page, pagination.limit, searchQuery, filterFrameType, filterStore, filterGlobal, sortOrder);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, pagination.page, pagination.limit, filterFrameType, filterStore, filterGlobal, sortOrder, fetchData]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle filter changes
  const handleFilterChange = (filterType: string, value: string) => {
    switch (filterType) {
      case 'frameType':
        setFilterFrameType(value);
        break;
      case 'store':
        setFilterStore(value);
        break;
      case 'global':
        setFilterGlobal(value);
        break;
    }
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 when changing filter
  };

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(1, pagination.limit, searchQuery, filterFrameType, filterStore, filterGlobal, sortOrder);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: target.checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const inputName = e.target.name;
      const reader = new FileReader();

      reader.onload = (readerEvent) => {
        const result = readerEvent.target?.result as string;

        if (inputName === 'backgroundFile') {
          setBackgroundFile(selectedFile);
          setBackgroundPreview(result);

          if (!isEditing) {
            setFormData(prev => ({ ...prev, filename: selectedFile.name }));
          }
        } else if (inputName === 'overlayFile') {
          setOverlayFile(selectedFile);
          setOverlayPreview(result);
        }
      };

      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.frameTypeId || (!backgroundFile && !isEditing)) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    // Validate store selection for admin users
    if (user?.role === 'ADMIN' && !formData.isGlobal && !formData.storeId) {
      const shouldProceed = confirm('Chưa chọn cửa hàng. Mẫu này sẽ được tạo thành mẫu toàn hệ thống. Bạn có muốn tiếp tục?');
      if (!shouldProceed) {
        return;
      }
    }

    try {
      setUploadStatus('Đang tải lên...');


      const formDataToSubmit = new FormData();
      formDataToSubmit.append('name', formData.name);
      formDataToSubmit.append('frameTypeId', formData.frameTypeId);
      formDataToSubmit.append('isActive', formData.isActive.toString());
      formDataToSubmit.append('position', formData.position.toString());

      // Append the actual file objects, not just the names
      if (backgroundFile) {
        formDataToSubmit.append('backgroundFile', backgroundFile);
      }
      if (overlayFile) {
        formDataToSubmit.append('overlayFile', overlayFile);
      }



      // Handle store vs global template
      let finalIsGlobal = formData.isGlobal;
      let finalStoreId = formData.storeId;

      if (user?.role === 'ADMIN' || user?.role === 'MANAGER') {
        if (formData.isGlobal || !formData.storeId) {
          // If isGlobal is true OR if no store is selected, make it global
          finalIsGlobal = true;
          finalStoreId = '';
          console.log('Setting as global template');
        } else {
          // For non-global templates with store selected
          console.log('Setting as store-specific template with storeId:', formData.storeId);
        }
      } else if (user?.role === 'STORE_OWNER') {
        // For store owners, always use their store ID
        const userStoreId = (user as UserWithStore).storeId || formData.storeId;
        if (userStoreId) {
          finalStoreId = userStoreId;
          finalIsGlobal = false;
          console.log('Store Owner: Setting as store-specific template with storeId:', userStoreId);
        } else {
          // If no storeId available, make it global
          finalIsGlobal = true;
          finalStoreId = '';
          console.log('Store Owner: No storeId available, defaulting to global template');
        }
      }

      // Append the final values to formData
      formDataToSubmit.append('isGlobal', finalIsGlobal.toString());
      if (finalStoreId) {
        formDataToSubmit.append('storeId', finalStoreId);
      }

      // Debug: Log all FormData entries
      console.log('FormData entries:');
      for (const [key, value] of formDataToSubmit.entries()) {
        if (value instanceof File) {
          console.log(`${key}:`, value.name, value.size, 'bytes');
        } else {
          console.log(`${key}:`, value);
        }
      }

      const url = isEditing ? `/api/frame-templates/${formData.id}` : '/api/frame-templates';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSubmit,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('Error response:', errorData);
        throw new Error(errorData.error || errorData.message || 'Failed to save template');
      }

      setUploadStatus('Thành công!');
      setIsFormOpen(false);
      resetForm();
      fetchData(pagination.page, pagination.limit, searchQuery, filterFrameType, filterStore, filterGlobal, sortOrder);

    } catch (err) {
      console.error('Error saving template:', err);
      setError(err instanceof Error ? err.message : 'Failed to save template');
    } finally {
      setUploadStatus(null);
    }
  };

  const handleEdit = (template: FrameTemplate) => {
    // Make sure to properly handle the storeId field for templates
    // If it's global, storeId should be empty string
    const storeId = template.isGlobal ? '' : (template.storeId || '');

    setFormData({
      id: template.id,
      name: template.name,
      filename: template.filename,
      background: template.background,
      overlay: template.overlay,
      frameTypeId: template.frameTypeId,
      storeId: storeId,
      isGlobal: template.isGlobal,
      isActive: template.isActive,
      position: template.position || 0
    });

    // Reset file state
    setBackgroundFile(null);
    setOverlayFile(null);
    setBackgroundPreview(template.background || null);
    setOverlayPreview(template.overlay || null);

    setIsEditing(true);
    setIsFormOpen(true);
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa mẫu này không?')) return;

    try {
      const response = await fetch(`/api/frame-templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete template');
      }

      fetchData(pagination.page, pagination.limit, searchQuery, filterFrameType, filterStore, filterGlobal, sortOrder);
    } catch (err) {
      console.error('Error deleting template:', err);
      setError('Failed to delete template');
    }
  };

  // Xử lý thay đổi vị trí hiển thị của template
  const handleChangePosition = async (templateId: string, newPosition: number) => {
    try {
      if (newPosition < 0) return; // Không cho phép vị trí âm

      // Lấy template cần thay đổi vị trí
      const template = templates.find(t => t.id === templateId);
      if (!template) return;

      // Gửi yêu cầu cập nhật vị trí
      const response = await fetch(`/api/frame-templates/${templateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          position: newPosition
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update template position');
      }

      // Cập nhật lại danh sách templates
      fetchData(pagination.page, pagination.limit, searchQuery, filterFrameType, filterStore, filterGlobal, sortOrder);
    } catch (err) {
      console.error('Error updating template position:', err);
      setError('Failed to update template position');
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      filename: '',
      background: '',
      overlay: '',
      frameTypeId: '',
      storeId: '',
      isGlobal: false,
      isActive: true,
      position: 0
    });
    setBackgroundFile(null);
    setOverlayFile(null);
    setBackgroundPreview(null);
    setOverlayPreview(null);
    setIsEditing(false);
    setError(null);
    setUploadStatus(null);
  };

  const handleCreateNew = () => {
    resetForm();
    setIsFormOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Quản lý mẫu khung</h1>
        <button
          onClick={handleCreateNew}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Tạo mẫu khung mới
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Tìm kiếm mẫu khung..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Loại khung</label>
            <select
              value={filterFrameType}
              onChange={(e) => handleFilterChange('frameType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả loại khung</option>
              {frameTypes && frameTypes.length > 0 && frameTypes.map(frameType => (
                <option key={frameType.id} value={frameType.id}>
                  {frameType.name}
                </option>
              ))}
            </select>
          </div>

          {user?.role === 'ADMIN' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cửa hàng</label>
              <select
                value={filterStore}
                onChange={(e) => handleFilterChange('store', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả cửa hàng</option>
                {stores && stores.length > 0 && stores.map(store => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Loại mẫu</label>
            <select
              value={filterGlobal}
              onChange={(e) => handleFilterChange('global', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả mẫu</option>
              <option value="true">Mẫu toàn hệ thống</option>
              <option value="false">Mẫu theo cửa hàng</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sắp xếp</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="position">Theo thứ tự hiển thị</option>
              <option value="name">Theo tên (A-Z)</option>
              <option value="date">Theo ngày tạo (mới nhất)</option>
            </select>
          </div>
        </form>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {templates && templates.length > 0 ? (
          templates.map(template => (
            <div key={template.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="relative h-48">
                {/*  nếu có nền */}
                {template.background && (
                  <Image
                    src={template.background}
                    alt={template.name}
                    fill
                    className="object-cover"
                  />
                )}
                {/* // nếu có overlay */}
                {template.overlay && (
                  <Image
                    src={template.overlay}
                    alt={template.name}
                    fill
                    className="object-cover"
                  />
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  {template.isGlobal && (
                    <span className="bg-green-500 text-white px-2 py-1 rounded text-xs">Toàn hệ thống</span>
                  )}
                  {!template.isActive && (
                    <span className="bg-red-500 text-white px-2 py-1 rounded text-xs">Ngưng hoạt động</span>
                  )}
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2">{template.name}</h3>
                <div className="text-sm text-gray-600 mb-2">
                  <div>Loại khung: {template.frameType.name}</div>
                  <div>Bố cục: {template.frameType.columns}x{template.frameType.rows}</div>
                  <div className="flex items-center gap-2">
                    <span>Thứ tự hiển thị: {template.position}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleChangePosition(template.id, template.position - 1)}
                        className="text-gray-600 hover:text-blue-600 transition-colors"
                        title="Tăng thứ tự ưu tiên"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleChangePosition(template.id, template.position + 1)}
                        className="text-gray-600 hover:text-blue-600 transition-colors"
                        title="Giảm thứ tự ưu tiên"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {template.store && (
                    <div className="flex items-center gap-1">
                      Cửa hàng: {template.store.name}
                      {template.store.primaryColor && (
                        <div
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: template.store.primaryColor }}
                        />
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleEdit(template)}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-gray-500">
            Không tìm thấy mẫu khung nào
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-2 mb-6">
        <button
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={!pagination.hasPrevPage}
          className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
        >
          Trang trước
        </button>

        <span className="px-3 py-1">
          Trang {pagination.page} / {pagination.totalPages}
        </span>

        <button
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={!pagination.hasNextPage}
          className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
        >
          Trang sau
        </button>
      </div>

      {/* Create/Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-full overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {isEditing ? 'Chỉnh sửa mẫu khung' : 'Tạo mẫu khung mới'}
            </h2>

            {uploadStatus && (
              <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
                {uploadStatus}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên mẫu *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại khung *
                </label>
                <select
                  name="frameTypeId"
                  value={formData.frameTypeId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Chọn loại khung</option>
                  {frameTypes && frameTypes.length > 0 && frameTypes.map(frameType => (
                    <option key={frameType.id} value={frameType.id}>
                      {frameType.name} ({frameType.columns}x{frameType.rows})
                    </option>
                  ))}
                </select>
              </div>

              {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loại mẫu
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="isGlobal"
                        checked={formData.isGlobal}
                        onChange={(e) => {
                          // Reset storeId if switching to global
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              isGlobal: true,
                              storeId: ''
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              isGlobal: false
                            }));
                          }
                        }}
                        className="mr-2"
                      />
                      Mẫu toàn hệ thống (dùng cho tất cả cửa hàng)
                    </label>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Mẫu toàn hệ thống sẽ dùng cho tất cả cửa hàng. Nếu muốn tạo mẫu riêng cho cửa hàng, hãy chọn cửa hàng bên dưới.
                  </p>
                </div>
              )}

              {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && !formData.isGlobal && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cửa hàng
                  </label>
                  <select
                    name="storeId"
                    value={formData.storeId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Chọn cửa hàng</option>
                    {stores && stores.length > 0 && stores.map(store => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    Nếu không chọn cửa hàng, mẫu sẽ được tạo thành mẫu toàn hệ thống.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ảnh nằm trên - Frame
                </label>
                <input
                  type="file"
                  name="backgroundFile"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {backgroundPreview && (
                  <div className="mt-2">
                    <Image
                      src={backgroundPreview}
                      alt="Xem trước ảnh trên"
                      width={128}
                      height={128}
                      className="w-32 h-32 object-cover rounded"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ảnh nằm dưới - Frame
                </label>
                <input
                  type="file"
                  name="overlayFile"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {overlayPreview && (
                  <div className="mt-2">
                    <Image
                      src={overlayPreview}
                      alt="Xem trước ảnh dưới"
                      width={128}
                      height={128}
                      className="w-32 h-32 object-cover rounded"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thứ tự hiển thị
                </label>
                <input
                  type="number"
                  min="0"
                  name="position"
                  value={formData.position}
                  onChange={(e) => setFormData(prev => ({ ...prev, position: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Số nhỏ hơn sẽ hiển thị trước. Mặc định là 0.
                </p>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  Đang hoạt động
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
                >
                  {isEditing ? 'Cập nhật mẫu' : 'Tạo mẫu'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
