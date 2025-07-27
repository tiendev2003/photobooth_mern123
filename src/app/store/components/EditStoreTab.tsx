"use client";

import Image from "next/image";


interface StoreInfo {
  id: string;
  name: string;
  slogan?: string;
  logo?: string;
  background?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  primaryColor?: string;
  secondaryColor?: string;
  maxEmployees: number;
  maxAccounts: number;
}

interface EditForm {
  name: string;
  slogan: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  primaryColor: string;
  secondaryColor: string;
}

interface EditStoreTabProps {
  store: StoreInfo;
  editForm: EditForm;
  updateLoading: boolean;
  logoFile: File | null;
  logoPreview: string;
  logoUploading: boolean;
  backgroundFile: File | null;
  backgroundPreview: string;
  backgroundUploading: boolean;
  onFormChange: (field: string, value: string) => void;
  onLogoChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onLogoDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onLogoDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onBackgroundChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBackgroundDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onBackgroundDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onUpdateStore: () => void;
  onCancelEdit: () => void;
}

export default function EditStoreTab({
  store,
  editForm,
  updateLoading,
  logoPreview,
  logoUploading,
  backgroundPreview,
  backgroundUploading,
  onFormChange,
  onLogoChange,
  onLogoDrop,
  onLogoDragOver,
  onBackgroundChange,
  onBackgroundDrop,
  onBackgroundDragOver,
  onUpdateStore,
  onCancelEdit
}: EditStoreTabProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Chỉnh sửa thông tin cửa hàng</h2>

      <div className="bg-white shadow-sm rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Cập nhật thông tin</h3>
        </div>
        <div className="p-6">
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            {/* Logo Upload Section */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Logo cửa hàng</h4>

              <div className="flex items-start space-x-6">
                {/* Current Logo */}
                <div className="flex-shrink-0">
                  <div className="text-sm font-medium text-gray-700 mb-2">Logo hiện tại</div>
                  <div className="w-20 h-20 border border-gray-300 rounded-lg overflow-hidden bg-white flex items-center justify-center">
                    {store.logo ? (
                      <Image src={store.logo} alt="Current Logo" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-400 text-xs">Chưa có logo</span>
                    )}
                  </div>
                </div>

                {/* New Logo Preview */}
                {logoPreview && (
                  <div className="flex-shrink-0">
                    <div className="text-sm font-medium text-gray-700 mb-2">Logo mới</div>
                    <div className="w-20 h-20 border border-gray-300 rounded-lg overflow-hidden">
                      <Image src={logoPreview} alt="New Logo Preview" className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}

                {/* Upload Controls */}
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700 mb-2">Tải lên logo mới</div>
                  <div
                    className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors"
                    onDrop={onLogoDrop}
                    onDragOver={onLogoDragOver}
                  >
                    <div className="space-y-1 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label htmlFor="logo-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                          <span>Tải lên file</span>
                          <input id="logo-upload" name="logo-upload" type="file" className="sr-only" accept="image/*" onChange={onLogoChange} />
                        </label>
                        <p className="pl-1">hoặc kéo thả</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF tối đa 5MB</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Background Upload Section */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Hình nền cửa hàng</h4>

              <div className="flex items-start space-x-6">
                {/* Current Background */}
                <div className="flex-shrink-0">
                  <div className="text-sm font-medium text-gray-700 mb-2">Hình nền hiện tại</div>
                  <div className="w-32 h-20 border border-gray-300 rounded-lg overflow-hidden bg-white flex items-center justify-center">
                    {store.background ? (
                      <Image src={store.background} alt="Current Background" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-400 text-xs">Chưa có hình nền</span>
                    )}
                  </div>
                </div>

                {/* New Background Preview */}
                {backgroundPreview && (
                  <div className="flex-shrink-0">
                    <div className="text-sm font-medium text-gray-700 mb-2">Hình nền mới</div>
                    <div className="w-32 h-20 border border-gray-300 rounded-lg overflow-hidden">
                      <Image src={backgroundPreview} alt="New Background Preview" className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}

                {/* Upload Controls */}
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700 mb-2">Tải lên hình nền mới</div>
                  <div
                    className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors"
                    onDrop={onBackgroundDrop}
                    onDragOver={onBackgroundDragOver}
                  >
                    <div className="space-y-1 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label htmlFor="background-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                          <span>Tải lên file</span>
                          <input id="background-upload" name="background-upload" type="file" className="sr-only" accept="image/*" onChange={onBackgroundChange} />
                        </label>
                        <p className="pl-1">hoặc kéo thả</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF tối đa 10MB</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên cửa hàng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => onFormChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập tên cửa hàng"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slogan
                </label>
                <input
                  type="text"
                  value={editForm.slogan}
                  onChange={(e) => onFormChange('slogan', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập slogan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Địa chỉ
                </label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => onFormChange('address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập địa chỉ"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => onFormChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập số điện thoại"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => onFormChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Màu chính
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={editForm.primaryColor}
                    onChange={(e) => onFormChange('primaryColor', e.target.value)}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={editForm.primaryColor}
                    onChange={(e) => onFormChange('primaryColor', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="#3B82F6"
                  />
                  <div
                    className="w-8 h-8 rounded border border-gray-300 shadow-sm"
                    style={{ backgroundColor: editForm.primaryColor }}
                    title="Preview màu chính"
                  ></div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Màu phụ
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={editForm.secondaryColor}
                    onChange={(e) => onFormChange('secondaryColor', e.target.value)}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={editForm.secondaryColor}
                    onChange={(e) => onFormChange('secondaryColor', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="#10B981"
                  />
                  <div
                    className="w-8 h-8 rounded border border-gray-300 shadow-sm"
                    style={{ backgroundColor: editForm.secondaryColor }}
                    title="Preview màu phụ"
                  ></div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mô tả
              </label>
              <textarea
                value={editForm.description}
                onChange={(e) => onFormChange('description', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nhập mô tả về cửa hàng..."
              />
            </div>

            <div className="border-t pt-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-blue-800">
                    <strong>Lưu ý:</strong> Những thay đổi sẽ được áp dụng ngay lập tức sau khi cập nhật.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onCancelEdit}
                  disabled={updateLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={onUpdateStore}
                  disabled={updateLoading || logoUploading || backgroundUploading || !editForm.name.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {logoUploading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Đang tải logo...
                    </div>
                  ) : backgroundUploading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Đang tải hình nền...
                    </div>
                  ) : updateLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Đang cập nhật...
                    </div>
                  ) : (
                    '💾 Cập nhật thông tin'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
