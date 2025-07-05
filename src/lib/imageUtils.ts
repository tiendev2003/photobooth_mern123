/**
 * Utility functions for handling images
 */

/**
 * Get a sanitized image URL that works with Next.js Image component
 * and handles paths that might contain _nextjs or other problematic patterns
 * 
 * @param url Original image URL
 * @returns A sanitized URL ready for Next.js Image component
 */
export function getSanitizedImageUrl(url: string): string {
  if (!url) return '';
  
  // If URL already has a proper protocol, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Handle relative URLs with _nextjs in them - strip the _nextjs part
  if (url.includes('/_nextjs/')) {
    return url.replace('/_nextjs/', '/');
  }
  
  // For relative URLs that start with a slash, ensure they're properly formatted
  if (url.startsWith('/')) {
    // If it's an upload, ensure it points to the right place
    if (url.includes('/uploads/')) {
      return url;
    }
  }
  
  return url;
}

/**
 * A function to handle image loading errors and provide fallbacks
 * 
 * @param event The error event from the image
 * @param fallbackSrc Optional fallback source to use
 */
export function handleImageError(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackSrc?: string
): void {
  const img = event.currentTarget;
  console.error('Image failed to load:', img.src);
  
  // Remove any _nextjs path segments that might be causing issues
  if (img.src.includes('/_nextjs/')) {
    const newSrc = img.src.replace('/_nextjs/', '/');
    console.log('Trying alternative path:', newSrc);
    img.src = newSrc;
    return;
  }
  
  // If we have a fallback, use it
  if (fallbackSrc) {
    img.src = fallbackSrc;
    img.onerror = null; // Prevent infinite error loop
  } else {
    // Default fallback - hide the image or show a placeholder
    img.onerror = null;
    img.style.display = 'none';
    
    // If there's a parent, we can add a placeholder
    const parent = img.parentElement;
    if (parent) {
      const fallbackEl = document.createElement('div');
      fallbackEl.className = 'bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center w-full h-full';
      fallbackEl.innerHTML = '<span class="text-gray-500 dark:text-gray-400 text-xs">Image not found</span>';
      parent.appendChild(fallbackEl);
    }
  }
}
