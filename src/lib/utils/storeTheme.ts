import { Store } from "@/lib/models/Store";

/**
 * Get dynamic styles based on store branding
 */
export function getStoreTheme(store: Store | null) {
  const defaultPrimary = '#9333ea';
  const defaultSecondary = '#ec4899';
  
  const primaryColor = store?.primaryColor || defaultPrimary;
  const secondaryColor = store?.secondaryColor || store?.primaryColor || defaultSecondary;
  
  return {
    primaryColor,
    secondaryColor,
    gradientBackground: `linear-gradient(45deg, ${primaryColor}, ${secondaryColor})`,
    borderColor: primaryColor,
    shadowColor: `${primaryColor}30`,
    textGradient: `linear-gradient(45deg, ${primaryColor}, ${secondaryColor})`,
    buttonStyle: {
      background: `linear-gradient(45deg, ${primaryColor}, ${secondaryColor})`,
      borderColor: primaryColor,
      boxShadow: `0 0 20px ${primaryColor}50`
    },
    glowStyle: {
      borderColor: primaryColor,
      boxShadow: `0 0 20px ${primaryColor}50`
    }
  };
}

/**
 * Get store background style
 */
export function getStoreBackgroundStyle(store: Store | null) {
  if (store?.background) {
    return {
      background: `linear-gradient(rgba(147, 51, 234, 0.7), rgba(0, 0, 0, 0.8)), url(${store.background})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    };
  }
  
  return {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  };
}

/**
 * Check if store has custom branding
 */
export function hasStoreBranding(store: Store | null): boolean {
  return !!(store?.logo || store?.background || store?.primaryColor);
}

/**
 * Get store display name with fallback
 */
export function getStoreDisplayName(store: Store | null): string {
  return store?.name || 'Photobooth';
}

/**
 * Convert hex color to rgba with opacity
 */
export function hexToRgba(hex: string, opacity: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return `rgba(147, 51, 234, ${opacity})`; // fallback
}
