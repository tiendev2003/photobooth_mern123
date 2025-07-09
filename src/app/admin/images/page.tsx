"use client";

import { useAuth } from '@/lib/context/AuthContext';
import { cacheUtils } from '@/lib/utils/cache-utils';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';

interface Image {
  id: string;
  filename: string;
  path: string;
  fileType: "IMAGE" | "GIF" | "VIDEO";
  size: number | null;
  duration: number | null;
  createdAt: string;
}

export default function ImagesManagement() {
  const { token } = useAuth();
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  
  // Define fetchImages with useCallback
  const fetchImages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/images?page=${currentPage}&limit=${itemsPerPage}&fileType=${filterType}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch images');
      }
      
      const data = await response.json();
      setImages(data.images || data); // Handle both paginated and non-paginated responses
      
      // Set total pages if pagination info is available
      if (data.totalCount) {
        setTotalPages(Math.ceil(data.totalCount / itemsPerPage));
      }
    } catch (err) {
      console.error('Error fetching images:', err);
      setError('Failed to load images');
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, itemsPerPage, filterType]);
  
  // Fetch images when component mounts or dependencies change
  useEffect(() => {
    if (token) {
      fetchImages();
    }
  }, [token, fetchImages]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };
  
  const handleUpload = async () => {
    if (!uploadedFile) {
      setError('Please select a file to upload');
      return;
    }
    
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('file', uploadedFile);
      
      const response = await fetch('/api/images', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      setUploadedFile(null);
      
      // Clear cache and force refresh
      await cacheUtils.clearServiceWorkerCache();
      await cacheUtils.invalidateServerCache();
      cacheUtils.forceReloadImages('/uploads/');
      
      fetchImages(); // Refresh images list
      
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };
  
  const handleDeleteImage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/images/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete image');
      }
      
      fetchImages(); // Refresh images list
      
    } catch (err) {
      console.error('Error deleting image:', err);
      setError('Failed to delete image');
    }
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchImages();
  };
  
  // Format file size to human-readable format
  const formatFileSize = (bytes: number | null) => {
    if (bytes === null) return 'Unknown';
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Format duration to human-readable format
  const formatDuration = (seconds: number | null) => {
    if (seconds === null) return 'N/A';
    if (seconds < 60) return `${seconds}s`;
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes}m ${remainingSeconds}s`;
  };
  
  const filteredImages = images.filter(image => 
    image.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (loading && !images.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Images Management</h1>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileChange}
              accept="image/*,video/*"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer"
            >
              {uploadedFile ? 'Change File' : 'Select File'}
            </label>
            
            {uploadedFile && (
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                {uploadedFile.name.length > 20 
                  ? uploadedFile.name.substring(0, 17) + '...' 
                  : uploadedFile.name}
              </span>
            )}
          </div>
          
          <button
            onClick={handleUpload}
            disabled={!uploadedFile || uploading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 mb-6">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}
      
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex w-full sm:w-1/2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by filename..."
            className="block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
          />
          <button
            type="submit"
            className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 text-gray-500 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </form>
        
        {/* Filter */}
        <div className="w-full sm:w-1/4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
          >
            <option value="">All Types</option>
            <option value="IMAGE">Images</option>
            <option value="GIF">GIFs</option>
            <option value="VIDEO">Videos</option>
          </select>
        </div>
      </div>
      
      {/* Image Grid */}
      {filteredImages.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredImages.map((image) => (
            <div key={image.id} className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow">
              <div className="aspect-w-16 aspect-h-9 bg-gray-100 dark:bg-gray-700">
                {image.fileType === 'VIDEO' ? (
                  <video 
                    src={image.path} 
                    className="w-full h-full object-cover" 
                    controls={false}
                    muted
                    onMouseOver={(e) => (e.target as HTMLVideoElement).play()}
                    onMouseOut={(e) => {
                      const video = e.target as HTMLVideoElement;
                      video.pause();
                      video.currentTime = 0;
                    }}
                  />
                ) : (
                  <Image 
                    src={image.path} 
                    alt={image.filename}
                    width={320}
                    height={180}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              
              <div className="p-4">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={image.filename}>
                  {image.filename.length > 25 
                    ? image.filename.substring(0, 22) + '...' 
                    : image.filename}
                </p>
                
                <div className="mt-1 flex justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(image.createdAt).toLocaleDateString()}
                  </span>
                  <span 
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      image.fileType === 'IMAGE' 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                        : image.fileType === 'GIF'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}
                  >
                    {image.fileType}
                  </span>
                </div>
                
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                  <span>{formatFileSize(image.size)}</span>
                  {image.fileType === 'VIDEO' && (
                    <span>{formatDuration(image.duration)}</span>
                  )}
                </div>
                
                <div className="mt-3 flex justify-between">
                  <a
                    href={image.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200"
                  >
                    View
                  </a>
                  <button
                    onClick={() => handleDeleteImage(image.id)}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-gray-500 dark:text-gray-400">No images found</p>
        </div>
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <nav className="inline-flex rounded-md shadow">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Previous</span>
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            
            {[...Array(totalPages)].map((_, index) => {
              const page = index + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`relative inline-flex items-center px-4 py-2 border ${
                    page === currentPage
                      ? 'z-10 bg-blue-50 dark:bg-blue-900 border-blue-500 dark:border-blue-500 text-blue-600 dark:text-blue-200'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                  } text-sm font-medium`}
                >
                  {page}
                </button>
              );
            })}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Next</span>
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
