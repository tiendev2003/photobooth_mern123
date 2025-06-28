"use client";

import { useAuth } from '@/lib/context/AuthContext';
import { useEffect, useState } from 'react';

interface FrameType {
  id: string;
  name: string;
  description: string | null;
  columns: number;
  rows: number;
  totalImages: number;
  isActive: boolean;
  createdAt: string;
}

export default function FrameTypesManagement() {
  const { token } = useAuth();
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
  
  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    columns: 1,
    rows: 1,
    totalImages: 1,
    isActive: true
  });
  
  // Fetch frame types when component mounts or pagination changes
  useEffect(() => {
    if (token) {
      fetchFrameTypes(pagination.page, pagination.limit, searchQuery);
    }
  }, [token, pagination.page, pagination.limit, searchQuery]);
  
  const fetchFrameTypes = async (page = 1, limit = 10, search = '') => {
    try {
      setLoading(true);
      
      // Build query string with pagination and search parameters
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      if (search) {
        queryParams.append('search', search);
      }
      
      const response = await fetch(`/api/frame-types?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch frame types');
      }
      
      const data = await response.json();
      setFrameTypes(data.data);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching frame types:', err);
      setError('Failed to load frame types');
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
  
  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFrameTypes(1, pagination.limit, searchQuery); // Reset to page 1 when searching
  };
  
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    // Handle checkboxes
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [name]: target.checked }));
    } 
    // Handle number inputs
    else if (type === 'number') {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value, 10) }));
    } 
    // Handle other inputs
    else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };
  
  const handleCreateFrameType = () => {
    setIsEditing(false);
    setFormData({
      id: '',
      name: '',
      description: '',
      columns: 1,
      rows: 1,
      totalImages: 1,
      isActive: true
    });
    setIsFormOpen(true);
  };
  
  const handleEditFrameType = (frameType: FrameType) => {
    setIsEditing(true);
    setFormData({
      id: frameType.id,
      name: frameType.name,
      description: frameType.description || '',
      columns: frameType.columns,
      rows: frameType.rows,
      totalImages: frameType.totalImages,
      isActive: frameType.isActive
    });
    setIsFormOpen(true);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = isEditing ? `/api/frame-types/${formData.id}` : '/api/frame-types';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${isEditing ? 'update' : 'create'} frame type`);
      }
      
      setIsFormOpen(false);
      fetchFrameTypes(); // Refresh frame types list
      
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(`Failed to ${isEditing ? 'update' : 'create'} frame type`);
    }
  };
  
  const handleToggleActive = async (id: string, currentIsActive: boolean) => {
    try {
      const response = await fetch(`/api/frame-types/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !currentIsActive }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update frame type status');
      }
      
      fetchFrameTypes(); // Refresh frame types list
      
    } catch (err) {
      console.error('Error toggling active status:', err);
      setError('Failed to update frame type status');
    }
  };
  
  const handleDeleteFrameType = async (id: string) => {
    if (!confirm('Are you sure you want to delete this frame type? This will also delete all associated templates.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/frame-types/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete frame type');
      }
      
      fetchFrameTypes(); // Refresh frame types list
      
    } catch (err) {
      console.error('Error deleting frame type:', err);
      setError('Failed to delete frame type');
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
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Frame Types Management</h1>
        <button
          onClick={handleCreateFrameType}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create Frame Type
        </button>
      </div>
      
      {/* Search bar */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Search by name or description..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <button 
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Search
          </button>
        </form>
      </div>
      
      {/* Frame Type Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {isEditing ? 'Edit Frame Type' : 'Create New Frame Type'}
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
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
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
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                ></textarea>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="columns" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Columns</label>
                  <input
                    type="number"
                    id="columns"
                    name="columns"
                    value={formData.columns}
                    onChange={handleInputChange}
                    min={1}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="rows" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rows</label>
                  <input
                    type="number"
                    id="rows"
                    name="rows"
                    value={formData.rows}
                    onChange={handleInputChange}
                    min={1}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="totalImages" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Total Images</label>
                  <input
                    type="number"
                    id="totalImages"
                    name="totalImages"
                    value={formData.totalImages}
                    onChange={handleInputChange}
                    min={1}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
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
      
      {/* Frame Types Table */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Layout</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Images</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {frameTypes.length > 0 ? (
                frameTypes.map((frameType) => (
                  <tr key={frameType.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{frameType.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{frameType.description || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {frameType.columns} x {frameType.rows}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {frameType.totalImages}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        frameType.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {frameType.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEditFrameType(frameType)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(frameType.id, frameType.isActive)}
                        className={`${
                          frameType.isActive
                            ? 'text-amber-600 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200'
                            : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-200'
                        }`}
                      >
                        {frameType.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteFrameType(frameType.id)}
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
                    No frame types found
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
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} frame types
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
