// Utility functions for GIF handling in production
export function getGifWorkerPath(): string {
  // In production, use the correct path
  if (process.env.NODE_ENV === 'production') {
    return '/gif.worker.js';
  }
  return '/gif.worker.js';
}

export function validateGifWorker(): Promise<boolean> {
  return new Promise((resolve) => {
    // Check if gif.worker.js is accessible
    fetch(getGifWorkerPath())
      .then(response => {
        if (response.ok) {
          console.log('GIF worker is accessible');
          resolve(true);
        } else {
          console.error('GIF worker not accessible:', response.status);
          resolve(false);
        }
      })
      .catch(error => {
        console.error('Error checking GIF worker:', error);
        resolve(false);
      });
  });
}

export function getGifWorkerUrl(): string {
  // Create a proper URL for the worker
  const workerPath = getGifWorkerPath();
  
  if (typeof window !== 'undefined') {
    const baseUrl = window.location.origin;
    return `${baseUrl}${workerPath}`;
  }
  
  return workerPath;
}

// Production-safe GIF creation with fallback
export async function createGifWithFallback(
  videoUrl: string,
  frameColor: string,
  frameGradient?: string,
  selectedFrame?: string | null,
  layoutType: number = 4,
  frameLayoutType: "4x1" | "4x2" = "4x1"
): Promise<string> {
  // First check if worker is available
  const workerAvailable = await validateGifWorker();
  
  if (!workerAvailable) {
    throw new Error('GIF worker not available in production environment');
  }
  
  // Import GIF.js dynamically
  const GIF = (await import('gif.js')).default;
  
  return new Promise((resolve, reject) => {
    try {
      // Create video element
      const video = document.createElement("video");
      video.src = videoUrl;
      video.muted = true;
      video.crossOrigin = "anonymous";
      video.preload = "auto";

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
        canvas.height = frameHeight;
        
        // Calculate dimensions for video placement
        const cellWidth = frameWidth / (frameLayoutType === "4x1" ? 1 : 2);
         const padding = 20;
        const videoWidth = cellWidth - padding * 2;
        const videoHeight = videoWidth * (video.videoHeight / video.videoWidth);
        const x = padding;
        const y = padding;

        // Create GIF encoder with production-safe settings
        const gif = new GIF({
          workers: 2, // Reduced for production stability
          quality: 10, // Higher quality number for smaller size
          width: frameWidth,
          height: frameHeight,
          workerScript: getGifWorkerUrl(), // Use the proper URL
          transparent: null,
          background: "#ffffff",
          repeat: 0,
          dither: false,
        });

        // Function to draw a single frame
        const drawFrame = async () => {
          // Always draw background first
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
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw video frame
          try {
            if (video.readyState >= 2) {
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

          // Add frame to GIF
          gif.addFrame(canvas, { delay: 150, copy: true }); // Slower for production
        };

        // Capture frames at intervals
        const captureFrames = async () => {
          const frameCount = 20; // Reduced for production
          const duration = 2.0; // Shorter duration

          for (let i = 0; i < frameCount; i++) {
            const timeInVideo = (i / frameCount) * Math.min(duration, video.duration);
            video.currentTime = timeInVideo;

            // Wait for video seek
            await new Promise<void>((resolve) => {
              const waitForSeek = () => {
                if (video.readyState >= 2 && 
                    Math.abs(video.currentTime - timeInVideo) < 0.3) {
                  resolve();
                } else {
                  requestAnimationFrame(waitForSeek);
                }
              };
              
              video.onseeked = () => resolve();
              requestAnimationFrame(waitForSeek);
              
              // Timeout fallback
              setTimeout(() => resolve(), 100);
            });

            await drawFrame();

            // Progress logging
            if (i % 5 === 0) {
              console.log(`GIF Progress: ${((i / frameCount) * 100).toFixed(1)}%`);
            }
          }

          // Finish GIF creation
          gif.on("finished", function (blob) {
            const url = URL.createObjectURL(blob);
            console.log("GIF created successfully");
            resolve(url);
          });

          gif.on("error", function (error) {
            console.error("GIF creation error:", error);
            reject(error);
          });

          gif.render();
        };

        // Start capturing frames
        video.currentTime = 0;
        captureFrames().catch(reject);
      };

      video.onerror = (error) => {
        console.error("Video load error:", error);
        reject(new Error("Failed to load video"));
      };

      // Set timeout for video loading
      setTimeout(() => {
        if (video.readyState < 2) {
          reject(new Error("Video loading timeout"));
        }
      }, 10000);

    } catch (error) {
      reject(error);
    }
  });
}
