// Utility functions for cache management
export const cacheUtils = {
  // Add timestamp to image URLs to force refresh
  addCacheBuster: (url: string): string => {
    if (!url) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${Date.now()}`;
  },

  // Invalidate image cache in browser
  invalidateImageCache: (imageUrl: string): void => {
    if (typeof window !== 'undefined') {
      // Remove from browser cache
      const img = new Image();
      img.src = imageUrl + '?bust=' + Date.now();
    }
  },

  // Force reload all images with specific src pattern
  forceReloadImages: (pattern: string): void => {
    if (typeof window !== 'undefined') {
      const images = document.querySelectorAll(`img[src*="${pattern}"]`);
      images.forEach((img: Element) => {
        const imgElement = img as HTMLImageElement;
        const currentSrc = imgElement.src;
        const newSrc = currentSrc.split('?')[0] + '?t=' + Date.now();
        imgElement.src = newSrc;
      });
    }
  },

  // Clear service worker cache for uploads
  clearServiceWorkerCache: async (): Promise<void> => {
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cacheNames = await caches.keys();
        const uploadCacheNames = cacheNames.filter(name => 
          name.includes('uploaded-images') || 
          name.includes('static-image-assets')
        );
        
        await Promise.all(
          uploadCacheNames.map(cacheName => caches.delete(cacheName))
        );
        
        console.log('Service worker cache cleared for uploads');
      } catch (error) {
        console.warn('Failed to clear service worker cache:', error);
      }
    }
  },

  // Invalidate server cache
  invalidateServerCache: async (paths: string[] = []): Promise<void> => {
    try {
      await fetch('/api/cache/invalidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paths: ['/uploads', '/', ...paths],
          tags: ['images', 'uploads']
        })
      });
    } catch (error) {
      console.warn('Failed to invalidate server cache:', error);
    }
  }
};

// Hook for automatic cache management
export const useImageCacheRefresh = () => {
  const refreshImage = (imageUrl: string) => {
    cacheUtils.invalidateImageCache(imageUrl);
    cacheUtils.forceReloadImages(imageUrl.split('/').pop() || '');
  };

  const refreshAllUploads = async () => {
    await cacheUtils.clearServiceWorkerCache();
    await cacheUtils.invalidateServerCache();
    cacheUtils.forceReloadImages('/uploads/');
  };

  return { refreshImage, refreshAllUploads };
};
