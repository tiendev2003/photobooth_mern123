import { Store } from "./models/Store";

export const getStoreStyles = (currentStore: Store | null) => {
  const backgroundImage = currentStore?.background 
    ? `linear-gradient(rgba(147, 51, 234, 0.7), rgba(0, 0, 0, 0.8)), url(${currentStore.background})`
    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    
  return {
    backgroundImage,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed'
  };
};

export const getStorePrimaryColor = (currentStore: Store | null) => {
  return currentStore?.primaryColor || '#ffffff';
};

export const getStoreAccentColor = (currentStore: Store | null) => {
  return currentStore?.primaryColor || '#ec4899';
};

export const getStoreGradient = (currentStore: Store | null) => {
  return currentStore?.primaryColor 
    ? `linear-gradient(45deg, ${currentStore.primaryColor}, ${currentStore.secondaryColor || currentStore.primaryColor})`
    : 'linear-gradient(to right, #ec4899, #8b5cf6)';
};

export const getStoreBorderColor = (currentStore: Store | null) => {
  return currentStore?.primaryColor || '#ffffff';
};
