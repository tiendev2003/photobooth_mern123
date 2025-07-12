import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const TIMEOUT_DURATION = 2; 


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

export function convertTailwindFilterToCss(tailwindClasses: string): string {
  if (!tailwindClasses) return "";

  const cssFilters: string[] = [];
  const classes = tailwindClasses.split(" ");

  classes.forEach((cls) => {
    // Brightness
    if (cls.startsWith("brightness-")) {
      const value = parseInt(cls.replace("brightness-", "")) / 100;
      cssFilters.push(`brightness(${value})`);
    }
    // Contrast
    else if (cls.startsWith("contrast-")) {
      const value = parseInt(cls.replace("contrast-", "")) / 100;
      cssFilters.push(`contrast(${value})`);
    }
    // Saturate
    else if (cls.startsWith("saturate-")) {
      const value = parseInt(cls.replace("saturate-", "")) / 100;
      cssFilters.push(`saturate(${value})`);
    }
    // Blur
    else if (cls.startsWith("blur-")) {
      const value = cls.replace("blur-", "").replace("[", "").replace("]", "");
      cssFilters.push(`blur(${value})`);
    }
    // Sepia
    else if (cls === "sepia") {
      cssFilters.push(`sepia(1)`);
    }
    // Hue rotate
    else if (cls.startsWith("hue-rotate-")) {
      const value = cls
        .replace("hue-rotate-", "")
        .replace("[", "")
        .replace("]", "");
      cssFilters.push(`hue-rotate(${value})`);
    }
  });

  return cssFilters.join(" ");
}

export async function createGifFromVideo(
  videoUrl: string,
  frameColor: string,
  frameGradient?: string,
  selectedFrame?: string | null,
  layoutType: number = 4,
  frameLayoutType: "4x1" | "4x2" = "4x1"
): Promise<string> {
  // Import the production-safe GIF creation function
  const { createGifWithFallback } = await import('./gif-utils');
  
  try {
    return await createGifWithFallback(
      videoUrl,
      frameColor,
      frameGradient,
      selectedFrame,
      layoutType,
      frameLayoutType
    );
  } catch (error) {
    console.error('GIF creation failed:', error);
    throw new Error('Không thể tạo GIF. Vui lòng thử lại.');
  }
}

// Function to sanitize filenames for URL compatibility
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/\s+/g, "_")
    .replace(
      /[()[\]{}áàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữự]/g,
      ""
    )
    .replace(/[^\w.-]/g, "");
}

// Function to create a URL with cache-busting parameter
export function getCacheBustedUrl(url: string): string {
  if (!url) return "";
  const cacheBuster = `v=${Date.now()}`;
  return url.includes("?") ? `${url}&${cacheBuster}` : `${url}?${cacheBuster}`;
}

// Function to preload an image and verify it loads correctly
export function preloadImage(imageUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    const timeoutId = setTimeout(() => {
      reject(new Error(`Image load timeout for ${imageUrl}`));
    }, 10000); // 10 second timeout

    img.onload = () => {
      clearTimeout(timeoutId);
      if (img.naturalWidth === 0 || img.naturalHeight === 0) {
        reject(
          new Error(`Image loaded but has invalid dimensions: ${imageUrl}`)
        );
      } else {
        resolve(img);
      }
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      reject(new Error(`Failed to load image: ${imageUrl}`));
    };

    // Add cache-busting
    img.src = getCacheBustedUrl(imageUrl);
  });
}
