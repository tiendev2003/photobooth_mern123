import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

export function convertTailwindFilterToCss(tailwindClasses: string): string {
  if (!tailwindClasses) return '';
  
  const cssFilters: string[] = [];
  const classes = tailwindClasses.split(' ');
  
  classes.forEach(cls => {
    // Brightness
    if (cls.startsWith('brightness-')) {
      const value = parseInt(cls.replace('brightness-', '')) / 100;
      cssFilters.push(`brightness(${value})`);
    }
    // Contrast
    else if (cls.startsWith('contrast-')) {
      const value = parseInt(cls.replace('contrast-', '')) / 100;
      cssFilters.push(`contrast(${value})`);
    }
    // Saturate
    else if (cls.startsWith('saturate-')) {
      const value = parseInt(cls.replace('saturate-', '')) / 100;
      cssFilters.push(`saturate(${value})`);
    }
    // Blur
    else if (cls.startsWith('blur-')) {
      const value = cls.replace('blur-', '').replace('[', '').replace(']', '');
      cssFilters.push(`blur(${value})`);
    }
    // Sepia
    else if (cls === 'sepia') {
      cssFilters.push(`sepia(1)`);
    }
    // Hue rotate
    else if (cls.startsWith('hue-rotate-')) {
      const value = cls.replace('hue-rotate-', '').replace('[', '').replace(']', '');
      cssFilters.push(`hue-rotate(${value})`);
    }
  });
  
  return cssFilters.join(' ');
}