/**
 * Domain configuration for the application
 * This centralizes domain settings to make it easier to manage and update
 */

// Main configuration object
export const domainConfig = {
  // Base domain settings
  main: {
    domain: process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'localhost:3000',
    loginPath: '/login',
  },
  admin: {
    // Admin domain will be admin.yourdomain.com in production
    domain: process.env.NEXT_PUBLIC_ADMIN_DOMAIN || 'admin.localhost:3000',
    loginPath: '/admin/login',
    dashboardPath: '/admin',
  },
  // Determine if we're running in a production environment
  isProduction: process.env.NODE_ENV === 'production',
};

/**
 * Helper function to check if the current hostname is the admin domain
 */
export function isAdminDomain(hostname?: string): boolean {
  if (!hostname && typeof window !== 'undefined') {
    hostname = window.location.hostname;
  }
  
  if (!hostname) return false;
  
  // In production, check for the admin subdomain
  if (domainConfig.isProduction) {
    return hostname === domainConfig.admin.domain || 
           hostname.startsWith('admin.');
  }
  
  // In development, also check for localhost with /admin path
  return hostname === domainConfig.admin.domain || 
         hostname.startsWith('admin.');
}

/**
 * Get the appropriate login URL based on the current domain
 */
export function getLoginUrl(isAdmin: boolean = false): string {
  if (isAdmin) {
    return domainConfig.admin.loginPath;
  }
  return domainConfig.main.loginPath;
}

/**
 * Get the appropriate dashboard URL based on user role
 */
export function getDashboardUrl(isAdmin: boolean = false): string {
  if (isAdmin) {
    return domainConfig.admin.dashboardPath;
  }
  return '/'; // Main client dashboard is the homepage
}

/**
 * Function to get the correct absolute URL including domain
 */
export function getAbsoluteUrl(path: string, isAdmin: boolean = false): string {
  const baseDomain = isAdmin ? domainConfig.admin.domain : domainConfig.main.domain;
  // Ensure path starts with slash
  const formattedPath = path.startsWith('/') ? path : `/${path}`;
  return `${domainConfig.isProduction ? 'https' : 'http'}://${baseDomain}${formattedPath}`;
}
