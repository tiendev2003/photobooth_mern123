import { clsx, type ClassValue } from "clsx";
import GIF from "gif.js";
import { twMerge } from "tailwind-merge";

export const TIMEOUT_DURATION = 10; 


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
  return new Promise((resolve, reject) => {
    try {
      // Create video element
      const video = document.createElement("video");
      video.src = videoUrl;
      video.muted = true;
      video.crossOrigin = "anonymous";

      // Create canvas for frame capture
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      // Wait for video metadata to load
      video.onloadedmetadata = () => {
        // Set canvas dimensions based on layout type
        const frameWidth = layoutType === 4 ? 600 : 1200;
        const frameHeight = 1800;
        canvas.width = frameWidth;
        canvas.height = frameHeight; // Calculate dimensions for video placement
        const cellWidth = frameWidth / (frameLayoutType === "4x1" ? 1 : 2);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const cellHeight = frameHeight / 4;
        const padding = 20;
        const videoWidth = cellWidth - padding * 2;
        const videoHeight = videoWidth * (video.videoHeight / video.videoWidth);
        const x = padding;
        const y = padding;

        // Create GIF encoder with optimized settings
        const gif = new GIF({
          workers: 4,
          quality: 5,
          width: frameWidth,
          height: frameHeight,
          workerScript: "/gif.worker.js",
          transparent: null,
          background: "#ffffff",
          repeat: 0,
          dither: false,
        });

        // Function to draw a single frame
        const drawFrame = async () => {
          // Always draw background first (no clear to avoid empty frames)
          if (frameGradient) {
            const gradient = ctx.createLinearGradient(0, 0, 0, frameHeight);
            const gradientColors = frameGradient.match(/#[0-9a-fA-F]{6}/g);
            if (gradientColors && gradientColors.length >= 2) {
              gradient.addColorStop(0, gradientColors[0]);
              gradient.addColorStop(1, gradientColors[1]);
            }
            ctx.fillStyle = gradient;
          } else {
            ctx.fillStyle = frameColor;
          }
          ctx.fillRect(0, 0, canvas.width, canvas.height); // Draw frame background/overlay if selected

          // No frame selected, just draw video normally
          try {
            if (video.readyState >= 1) {
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = "high";
              ctx.drawImage(video, x, y, videoWidth, videoHeight);
            } else {
              ctx.fillStyle = "#f8f9fa";
              ctx.fillRect(x, y, videoWidth, videoHeight);
            }
          } catch (error) {
            console.warn("Video draw error:", error);
            ctx.fillStyle = "#f8f9fa";
            ctx.fillRect(x, y, videoWidth, videoHeight);
          }

          // Add frame to GIF with optimized timing
          gif.addFrame(canvas, { delay: 100, copy: true }); // 100ms = 10fps
        };

        // Capture frames at intervals to create smooth video animation
        const captureFrames = async () => {
          const frameCount = 25; // Optimized frame count
          const duration = 2.5; // Total duration in seconds

          for (let i = 0; i < frameCount; i++) {
            const timeInVideo =
              (i / frameCount) * Math.min(duration, video.duration);
            video.currentTime = timeInVideo;

            // Optimized waiting for video seek
            await new Promise((resolve) => {
              const waitForSeek = () => {
                if (
                  video.readyState >= 1 &&
                  Math.abs(video.currentTime - timeInVideo) < 0.2
                ) {
                  resolve(true);
                } else {
                  requestAnimationFrame(waitForSeek);
                }
              };
              video.onseeked = () => resolve(true);
              requestAnimationFrame(waitForSeek);
              setTimeout(() => resolve(true), 50);
            });

            await drawFrame();

            // Progress logging
            if (i % 5 === 0) {
              console.log(
                `Single Video GIF Progress: ${((i / frameCount) * 100).toFixed(
                  1
                )}%`
              );
            }
          }

          // Finish GIF creation
          gif.on("finished", function (blob) {
            resolve(URL.createObjectURL(blob));
          });

          gif.render();
        };

        // Start capturing frames
        video.currentTime = 0;
        captureFrames().catch(reject);
      };

      video.onerror = () => {
        reject(new Error("Failed to load video"));
      };
    } catch (error) {
      reject(error);
    }
  });
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
