"use client";

import { useAuth } from '@/lib/context/AuthContext';
import { useEffect, useState } from 'react';

interface FrameType {
  id: string;
  name: string;
}

interface FrameTemplate {
  id: string;
  name: string;
  filename: string;
  path: string;
  preview: string | null;
  frameTypeId: string;
  frameType: FrameType;
  isActive: boolean;
  createdAt: string;
}

export default function TemplatesManagement() {
  const { token } = useAuth();
  const [templates, setTemplates] = useState<FrameTemplate[]>([]);
  const [frameTypes, setFrameTypes] = useState<FrameType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
    path: '',
    preview: '',
    frameTypeId: '',
    isActive: true
  });
  
  const [file, setFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  
  // Fetch templates and frame types when component mounts or filters change
  useEffect(() => {
    if (token) {
      fetchData(pagination.page, pagination.limit, searchQuery, filterFrameType);
    }
  }, [token, pagination.page, pagination.limit, searchQuery, filterFrameType]);
  
  const fetchData = async (page = 1, limit = 10, search = '', frameTypeId = '') => {
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
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  
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
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 when searching
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
      if (e.target.name === 'template') {
        setFile(selectedFile);
        // Auto-generate filename if creating new template
        if (!isEditing) {
          setFormData(prev => ({
            ...prev,
            filename: selectedFile.name,
          }));
        }
      } else if (e.target.name === 'preview') {
        setPreviewFile(selectedFile);
      }
    }
  };
  
  const handleCreateTemplate = () => {
    setIsEditing(false);
    setFormData({
      id: '',
      name: '',
      filename: '',
      path: '',
      preview: '',
      frameTypeId: frameTypes.length > 0 ? frameTypes[0].id : '',
      isActive: true
    });
    setFile(null);
    setPreviewFile(null);
    setIsFormOpen(true);
  };
  
  const handleEditTemplate = (template: FrameTemplate) => {
    setIsEditing(true);
    setFormData({
      id: template.id,
      name: template.name,
      filename: template.filename,
      path: template.path,
      preview: template.preview || '',
      frameTypeId: template.frameTypeId,
      isActive: template.isActive
    });
    setFile(null);
    setPreviewFile(null);
    setIsFormOpen(true);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let uploadedTemplate = '';
      let uploadedPreview = '';
      
      // Upload template file if provided
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        
        const uploadResponse = await fetch('/api/images', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload template file');
        }
        
        const uploadData = await uploadResponse.json();
        uploadedTemplate = uploadData.path;
      }
      
      // Upload preview file if provided
      if (previewFile) {
        const previewFormData = new FormData();
        previewFormData.append('file', previewFile);
        
        const previewUploadResponse = await fetch('/api/images', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: previewFormData,
        });
        
        if (!previewUploadResponse.ok) {
          throw new Error('Failed to upload preview file');
        }
        
        const previewUploadData = await previewUploadResponse.json();
        uploadedPreview = previewUploadData.path;
      }
      
      // Prepare data for API
      const templateData = {
        ...formData,
        path: uploadedTemplate || formData.path,
        preview: uploadedPreview || formData.preview
      };
      
      // Create or update template
      const url = isEditing ? `/api/frame-templates/${formData.id}` : '/api/frame-templates';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(templateData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${isEditing ? 'update' : 'create'} template`);
      }
      
      setIsFormOpen(false);
      fetchData(); // Refresh templates list
      
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(`Failed to ${isEditing ? 'update' : 'create'} template`);
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
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create Template
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
                <label htmlFor="template" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Template File {isEditing && '(Leave empty to keep current)'}
                </label>
                <input
                  type="file"
                  id="template"
                  name="template"
                  onChange={handleFileChange}
                  className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200"
                  required={!isEditing}
                  accept="image/*"
                />
                {isEditing && formData.path && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Current file: {formData.filename}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="preview" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Preview Image (optional) {isEditing && formData.preview && '(Leave empty to keep current)'}
                </label>
                <input
                  type="file"
                  id="preview"
                  name="preview"
                  onChange={handleFileChange}
                  className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200"
                  accept="image/*"
                />
                {isEditing && formData.preview && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Current preview: {formData.preview.split('/').pop()}
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
              
              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
                      {template.preview ? (
                        <img 
                          src={template.preview} 
                          alt={template.name} 
                          className="h-10 w-auto object-cover rounded-sm"
                        />
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 text-sm">No preview</span>
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
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEditTemplate(template)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(template.id, template.isActive)}
                        className={`${
                          template.isActive
                            ? 'text-amber-600 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200'
                            : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-200'
                        }`}
                      >
                        {template.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200"
                      >
                        Delete
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
