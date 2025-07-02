"use client";

import { useAuth } from '@/lib/context/AuthContext';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';

interface FrameType {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface FrameTemplate {
  id: string;
  name: string;
  filename: string;
  background: string;
  overlay: string;
  frameTypeId: string;
  frameType: FrameType;
  userId?: string | null;
  user?: User | null;
  isActive: boolean;
  createdAt: string;
}

export default function TemplatesManagement() {
  const { token } = useAuth();
  const [templates, setTemplates] = useState<FrameTemplate[]>([]);
  const [frameTypes, setFrameTypes] = useState<FrameType[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [previewImagePreview, setPreviewImagePreview] = useState<string | null>(null);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFrameType, setFilterFrameType] = useState('');
  
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
    userId: '',
    isActive: true
  });
  
  const [file, setFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  
  // Define fetchData with useCallback
  const fetchData = useCallback(async (page = 1, limit = 10, search = '', frameTypeId = '') => {
    try {
      setLoading(true);
      
      // Build query string with pagination, search, and filter parameters
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      if (search) {
        queryParams.append('search', search);
      }
      
      if (frameTypeId) {
        queryParams.append('frameTypeId', frameTypeId);
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
      setTemplates(templatesData.data);
      setPagination(templatesData.pagination);
      
      // Fetch frame types for dropdown (don't need pagination for the dropdown)
      const frameTypesResponse = await fetch('/api/frame-types', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!frameTypesResponse.ok) {
        throw new Error('Failed to fetch frame types');
      }
      
      const frameTypesData = await frameTypesResponse.json();
      setFrameTypes(frameTypesData.data);
      
      // Fetch users for dropdown
      const usersResponse = await fetch('/api/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!usersResponse.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const usersData = await usersResponse.json();
      setUsers(usersData.users);
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [token]);
  
  // Fetch templates and frame types when component mounts or filters change
  useEffect(() => {
    if (token) {
      fetchData(pagination.page, pagination.limit, searchQuery, filterFrameType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, pagination.page, pagination.limit, filterFrameType, fetchData]);
  
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
  
  // Handle frame type filter change
  const handleFrameTypeFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterFrameType(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 when changing filter
  };
  
  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(1, pagination.limit, searchQuery, filterFrameType);
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
      
      if (e.target.name === 'backgroundFile') {
        setFile(selectedFile);
        // Auto-generate filename if creating new template
        if (!isEditing) {
          setFormData(prev => ({
            ...prev,
            filename: selectedFile.name,
          }));
        }
        
        // Create preview for background file
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
        
      } else if (e.target.name === 'overlayFile') {
        setPreviewFile(selectedFile);
        
        // Create preview for overlay file
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewImagePreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
      }
    }
  };
  
  const handleCreateTemplate = () => {
    setIsEditing(false);
    setFormData({
      id: '',
      name: '',
      filename: '',
      background: '',
      overlay: '',
      frameTypeId: frameTypes.length > 0 ? frameTypes[0].id : '',
      userId: '', // Default to no user selected
      isActive: true
    });
    setFile(null);
    setPreviewFile(null);
    setFilePreview(null);
    setPreviewImagePreview(null);
    setUploadStatus(null);
    setIsFormOpen(true);
  };
  
  const handleEditTemplate = (template: FrameTemplate) => {
    setIsEditing(true);
    setFormData({
      id: template.id,
      name: template.name,
      filename: template.filename,
      background: template.background,
      overlay: template.overlay,
      frameTypeId: template.frameTypeId,
      userId: template.userId || '',
      isActive: template.isActive
    });
    setFile(null);
    setPreviewFile(null);
    setFilePreview(null);
    setPreviewImagePreview(null);
    setUploadStatus(null);
    setIsFormOpen(true);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadStatus('Uploading files and saving template...');
    setLoading(true);
    
    try {
      // Create a FormData object
      const submitFormData = new FormData();
      
      // Add all text fields
      submitFormData.append('name', formData.name);
      submitFormData.append('frameTypeId', formData.frameTypeId);
      submitFormData.append('isActive', formData.isActive.toString());
      
      // Add userId if it's not empty
      if (formData.userId) {
        submitFormData.append('userId', formData.userId);
      } else {
        // If userId is empty string, set it to null to remove any existing assignment
        submitFormData.append('userId', 'null');
      }
      
      // For editing, we need to keep existing file paths if no new files are provided
      if (isEditing && !file && formData.background) {
        submitFormData.append('background', formData.background);
        submitFormData.append('filename', formData.filename);
      }
      
      if (isEditing && !previewFile && formData.overlay) {
        submitFormData.append('overlay', formData.overlay);
      }
      
      // Add background file if provided
      if (file) {
        submitFormData.append('backgroundFile', file);
        setUploadStatus('Uploading background file...');
      }
      
      // Add overlay file if provided
      if (previewFile) {
        submitFormData.append('overlayFile', previewFile);
        setUploadStatus('Uploading overlay file...');
      }
      
      // Create or update template directly with FormData
      const url = isEditing ? `/api/frame-templates/${formData.id}` : '/api/frame-templates';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          // Do not set Content-Type for FormData, browser will set it automatically with boundary
          Authorization: `Bearer ${token}`,
        },
        body: submitFormData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to ${isEditing ? 'update' : 'create'} template: ${errorData.error || 'Unknown error'}`);
      }
      
      setUploadStatus('Template saved successfully!');
      setTimeout(() => {
        setUploadStatus(null);
        setIsFormOpen(false);
        fetchData(); // Refresh templates list
      }, 1500);
      
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(`Failed to ${isEditing ? 'update' : 'create'} template: ${err instanceof Error ? err.message : String(err)}`);
      setUploadStatus(null);
    } finally {
      setLoading(false);
    }
  };
  
  const handleToggleActive = async (id: string, currentIsActive: boolean) => {
    try {
      const response = await fetch(`/api/frame-templates/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !currentIsActive }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update template status');
      }
      
      fetchData(); // Refresh list
      
    } catch (err) {
      console.error('Error toggling active status:', err);
      setError('Failed to update template status');
    }
  };
  
  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/frame-templates/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete template');
      }
      
      fetchData(); // Refresh list
      
    } catch (err) {
      console.error('Error deleting template:', err);
      setError('Failed to delete template');
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Templates Management</h1>
        <button
          onClick={handleCreateTemplate}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Create Template</span>
        </button>
      </div>
      
      {/* Search and filter bar */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Search by template name..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <select
            value={filterFrameType}
            onChange={handleFrameTypeFilterChange}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">All Frame Types</option>
            {frameTypes.map((type) => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
          <button 
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Search
          </button>
        </form>
      </div>
      
      {/* Template Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {isEditing ? 'Edit Template' : 'Create New Template'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Template Name</label>
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
                <label htmlFor="frameTypeId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Frame Type</label>
                <select
                  id="frameTypeId"
                  name="frameTypeId"
                  value={formData.frameTypeId}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="" disabled>Select Frame Type</option>
                  {frameTypes.map(frameType => (
                    <option key={frameType.id} value={frameType.id}>{frameType.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="userId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assign to User (Optional)</label>
                <select
                  id="userId"
                  name="userId"
                  value={formData.userId}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">No user assigned</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="backgroundFile" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Background Image {isEditing && '(Leave empty to keep current)'}
                </label>
                <input
                  type="file"
                  id="backgroundFile"
                  name="backgroundFile"
                  onChange={handleFileChange}
                  className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200"
                  required={!isEditing}
                  accept="image/*"
                />
                {isEditing && formData.background && !filePreview && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Current background: {formData.filename}
                    </p>
                    <div className="mt-2 relative w-32 h-32 border border-gray-300 overflow-hidden rounded-md">
                      <Image 
                        src={formData.background}
                        alt="Background preview"
                        fill
                        sizes="128px"
                        className="object-contain"
                      />
                    </div>
                  </div>
                )}
                {filePreview && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Preview of selected background:
                    </p>
                    <div className="mt-2 relative w-32 h-32 border border-gray-300 overflow-hidden rounded-md">
                      <Image 
                        src={filePreview}
                        alt="Background preview"
                        fill
                        sizes="128px"
                        className="object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <label htmlFor="overlayFile" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Overlay Image {isEditing && formData.overlay && '(Leave empty to keep current)'}
                </label>
                <input
                  type="file"
                  id="overlayFile"
                  name="overlayFile"
                  onChange={handleFileChange}
                  className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200"
                  required={!isEditing}
                  accept="image/*"
                />
                {isEditing && formData.overlay && !previewImagePreview && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Current overlay:
                    </p>
                    <div className="mt-2 relative w-32 h-32 border border-gray-300 overflow-hidden rounded-md">
                      <Image 
                        src={formData.overlay}
                        alt="Overlay image"
                        fill
                        sizes="128px"
                        className="object-contain"
                      />
                    </div>
                  </div>
                )}
                {previewImagePreview && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Preview of selected overlay:
                    </p>
                    <div className="mt-2 relative w-32 h-32 border border-gray-300 overflow-hidden rounded-md">
                      <Image 
                        src={previewImagePreview}
                        alt="Overlay image"
                        fill
                        sizes="128px"
                        className="object-contain"
                      />
                    </div>
                  </div>
                )}
                {isEditing && formData.overlay && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Current overlay: {formData.overlay.split('/').pop()}
                  </p>
                )}
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                  Active
                </label>
              </div>
              
              {uploadStatus && (
                <div className="mt-4 p-2 bg-blue-50 text-blue-700 rounded-md flex items-center">
                  <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {uploadStatus}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                  disabled={loading}
                >
                  {isEditing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Templates Table */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Frame Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Preview</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Assigned User</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {templates.length > 0 ? (
                templates.map((template) => (
                  <tr key={template.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{template.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{template.filename}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {template.frameType?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <div className="relative h-10 w-10 border border-gray-200 rounded-sm overflow-hidden">
                          <Image 
                            src={template.background} 
                            alt={`${template.name} background`}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                        <div className="relative h-10 w-10 border border-gray-200 rounded-sm overflow-hidden">
                          <Image 
                            src={template.overlay} 
                            alt={`${template.name} overlay`}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {template.user ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{template.user.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{template.user.email}</div>
                        </div>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400 text-sm">No user assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        template.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {template.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button
                        onClick={() => handleEditTemplate(template)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900"
                        title="Edit template"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleToggleActive(template.id, template.isActive)}
                        className={`p-1 rounded-full ${
                          template.isActive
                            ? 'text-amber-600 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900'
                            : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-200 hover:bg-green-100 dark:hover:bg-green-900'
                        }`}
                        title={template.isActive ? 'Deactivate template' : 'Activate template'}
                      >
                        {template.isActive ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900"
                        title="Delete template"
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
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No templates found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination controls */}
        {pagination.totalPages > 0 && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} templates
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(1)}
                disabled={!pagination.hasPrevPage}
                className={`px-3 py-1 rounded ${
                  pagination.hasPrevPage 
                    ? 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                }`}
              >
                &laquo; First
              </button>
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPrevPage}
                className={`px-3 py-1 rounded ${
                  pagination.hasPrevPage 
                    ? 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                }`}
              >
                &lsaquo; Prev
              </button>
              
              {/* Page number buttons - show up to 5 pages */}
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  // Calculate page numbers to show based on current page
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else {
                    const startPage = Math.max(1, pagination.page - 2);
                    pageNum = startPage + i;
                    if (pageNum > pagination.totalPages) {
                      pageNum = pagination.totalPages - (4 - i);
                    }
                  }
                  
                  return (
                    <button
                      key={i}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 rounded ${
                        pagination.page === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasNextPage}
                className={`px-3 py-1 rounded ${
                  pagination.hasNextPage 
                    ? 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                }`}
              >
                Next &rsaquo;
              </button>
              <button
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={!pagination.hasNextPage}
                className={`px-3 py-1 rounded ${
                  pagination.hasNextPage 
                    ? 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                }`}
              >
                Last &raquo;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
