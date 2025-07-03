"use client";

// Import polyfill for better browser compatibility
import "@/lib/mediaRecorderPolyfill";

import HomeButton from "@/app/components/HomeButton";
import LogoApp from "@/app/components/LogoApp";
import { useBooth } from "@/lib/context/BoothContext";
import { FrameTemplate } from "@/lib/models/FrameTemplate";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ImageIcon, Printer, Sparkles } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

// Import React Slick
import Slider from "react-slick";
import "slick-carousel/slick/slick-theme.css";
import "slick-carousel/slick/slick.css";

// Enhanced filters for skin beautification with server-side processing support
const skinFilters = [
  { id: "none", name: "Bình thường", className: "", preview: "/anh/1.png", icon: "🌟" },
  {
    id: "soft",
    name: "Da mềm mịn",
    className: "brightness-105 contrast-95 saturate-95",
    preview: "/anh/2.png",
    icon: "✨",
  },
  {
    id: "bright",
    name: "Da sáng",
    className: "brightness-110 contrast-90 saturate-105",
    preview: "/anh/3.png",
    icon: "💫",
  },
  {
    id: "glow",
    name: "Da rạng rỡ",
    className: "brightness-110 contrast-110 saturate-110",
    preview: "/anh/4.png",
    icon: "🌈",
  },
  {
    id: "smooth",
    name: "Da mượt",
    className: "brightness-105 contrast-90 saturate-95 blur-[0.2px]",
    preview: "/anh/5.png",
    icon: "🎭",
  },
  { id: "vintage", name: "Hoài cổ", className: "sepia brightness-90 contrast-110", preview: "/anh/6.png", icon: "📸" },
  // Các filter nâng cao mới
  { id: "beauty", name: "Làm đẹp", className: "brightness-108 contrast-105 saturate-105 blur-[0.5px]", preview: "/anh/7.png", icon: "💄" },
  { id: "brightSkin", name: "Da sáng bóng", className: "brightness-115 contrast-100 saturate-100 blur-[0.3px]", preview: "/anh/8.png", icon: "✨" },
  { id: "pinkLips", name: "Môi hồng", className: "brightness-105 contrast-105 saturate-115", preview: "/anh/9.png", icon: "💋" },
  { id: "slimFace", name: "Mặt thon", className: "brightness-105 contrast-105 saturate-100 blur-[0.4px]", preview: "/anh/10.png", icon: "😊" }
]

export default function Step8() {
  interface ExtendedCSSStyleDeclaration extends CSSStyleDeclaration {
    colorAdjust?: string; // Optional, as it is non-standard
    webkitPrintColorAdjust?: string; // Optional, vendor-prefixed property
    printColorAdjust: string; // Non-optional to match CSSStyleDeclaration
  }

  const router = useRouter();
  const {
    photos,
    selectedFrame,
    selectedIndices,
    selectedFilter,
    setSelectedFilter,
    selectedTemplate,
    setSelectedTemplate,
    setImageQrCode,
    videos,
    setVideoQrCode,
    setGifQrCode,
  } = useBooth();

  // Use this to keep skinFilters and context filter in sync
  const activeSkinFilter = useMemo(() => {
    return skinFilters.find(filter => filter.id === selectedFilter.id) || skinFilters[0];
  }, [selectedFilter]);

  const [frameTemplates, setFrameTemplates] = useState<FrameTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);

  const skinFilterRef = useRef<HTMLDivElement>(null);
  const frameTemplateRef = useRef<HTMLDivElement>(null);
  const printPreviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      if (selectedFrame?.id) {
        try {
          const response = await fetch(`/api/frame-templates?frameTypeId=${selectedFrame.id}`);
          if (response.ok) {
            const data = await response.json();
            if (data.data && Array.isArray(data.data)) {
              setFrameTemplates(data.data);

              // Select first template by default if available
              if (data.data.length > 0) {
                setSelectedTemplate(data.data[0]);
              }
            } else if (data.templates && Array.isArray(data.templates)) {
              setFrameTemplates(data.templates);

              // Select first template by default if available
              if (data.templates.length > 0) {
                setSelectedTemplate(data.templates[0]);
              }
            } else if (data && Array.isArray(data)) {
              setFrameTemplates(data);

              // Select first template by default if available
              if (data.length > 0) {
                setSelectedTemplate(data[0]);
              }
            } else {
              console.error("Invalid response format:", data);
            }
          } else {
            console.error("Error fetching templates:", response.status, await response.text());
          }
        } catch (error) {
          console.error("Error fetching frame templates:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchTemplates();
  }, [selectedFrame, setSelectedTemplate]);

  // Slick carousel settings and refs
  const skinFilterSliderRef = useRef<Slider | null>(null);
  const frameTemplateSliderRef = useRef<Slider | null>(null);

  // Settings for React Slick carousels
  const slickSettings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: 5, // Show more items to make them smaller
    slidesToScroll: 2,
    arrows: false,
    responsive: [
      {
        breakpoint: 1280,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 2
        }
      },
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 2
        }
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1
        }
      }
    ]
  };

  // Navigation functions for slick carousels
  const prevSlide = (sliderRef: React.RefObject<Slider | null>) => {
    sliderRef.current?.slickPrev();
  };

  const nextSlide = (sliderRef: React.RefObject<Slider | null>) => {
    sliderRef.current?.slickNext();
  };
  const handlePrint = async () => {
    setIsPrinting(true);

    try {
      // Get the preview content
      const previewContent = printPreviewRef.current;
      if (!previewContent) {
        alert('Không tìm thấy nội dung để in');
        setIsPrinting(false);
        return;
      }

      const isCustomFrame = selectedFrame?.isCustom === true;
      const isLandscape = isCustomFrame ? false :
        (selectedFrame && selectedFrame.columns && selectedFrame.rows ?
          selectedFrame.columns > selectedFrame.rows : false);


      try {
        // Generate and upload image
        const imageDataUrl = await generateHighQualityImage(isLandscape);
        if (!imageDataUrl) {
          throw new Error("Không thể tạo ảnh");
        }

        // Convert and upload image
        const arr = imageDataUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const imageFile = new File([u8arr], "photobooth.jpg", { type: mime });

        const imageFormData = new FormData();
        imageFormData.append("file", imageFile);

        const imageResponse = await fetch("/api/images", {
          method: "POST",
          body: imageFormData,
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token") || ""}`,
          }
        });

        if (!imageResponse.ok) {
          if (imageResponse.status === 413) {
            throw new Error("Ảnh quá lớn để tải lên. Hệ thống đang tối ưu hóa để giải quyết vấn đề này.");
          }
          throw new Error("Lỗi khi tải ảnh lên");
        }

        const imageData = await imageResponse.json();
        console.log("Ảnh đã được tải lên thành công:", imageData);
        setImageQrCode(imageData.data.url);
        localStorage.setItem("imageQrCode", imageData.data.url);

        // Send to printer
        fetch("http://localhost:4000/api/print", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            "imageUrl": imageData.data.url,
            "fileName": imageData.data.fileName,
            "printerName": selectedFrame?.isCustom ? "DS-RX1" : "DS-RX1-Cut",
          }),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Failed to print image");
            }
            return response.json();
          })
          .then((data) => {
            console.log("Print job submitted successfully:", data);
          })
          .catch((error) => {
            console.error("Error submitting print job:", error);
          });

        // Check if the browser supports the required APIs for video/GIF generation
        const supportsMediaGeneration = typeof window !== 'undefined' &&
          window.MediaRecorder &&
          HTMLCanvasElement.prototype.captureStream;

        // Generate video and GIF in parallel, but don't block navigation
        if (supportsMediaGeneration) {
          // Start media generation in the background
          console.log("Starting media generation in background");

          // Generate video and GIF simultaneously
          Promise.all([
            generateVideo().catch(e => {
              console.error("Video generation failed:", e);
              return null;
            }),
            generateGIF().catch(e => {
              console.error("GIF generation failed:", e);
              return null;
            })
          ])
            .then(([videoUrl, gifUrl]) => {
              console.log("Background media generation completed", { videoUrl, gifUrl });
              // Even if these fail, we'll still have the image QR code to show in step9
            });
        } else {
          console.log("Browser doesn't support media generation APIs, skipping video/GIF creation");
        }

        // Navigate to step 9 after the image is ready
        router.push("/step/step9");
      } catch (error) {
        console.error("Lỗi khi tạo hoặc tải ảnh lên:", error);
        alert(`Có lỗi xảy ra: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        setIsPrinting(false);
      }
    } catch (error) {
      console.error("Lỗi khi in ảnh:", error);
      alert(`Có lỗi xảy ra: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
      setIsPrinting(false);
    }
  };
  const preloadImages = async (images: HTMLImageElement[]): Promise<void> => {
    const promises = Array.from(images).map((img) => {
      if (img.complete && img.naturalWidth !== 0) {
        return Promise.resolve();
      }
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve(); // Xử lý lỗi để không bị treo
        if (img.src) img.src = img.src; // Kích hoạt tải lại nếu cần
      });
    });
    await Promise.all(promises);
  };
  const generateHighQualityImage = async (isLandscape: boolean, quality: number = 0.85): Promise<string | void> => {
    const previewContent = printPreviewRef.current;
    if (!previewContent) return;

    try {
      const isCustomFrame = selectedFrame?.isCustom === true;
      const desiredWidth = isLandscape ? 2400 : 1800;
      const desiredHeight = isLandscape ? 1800 : 2400;
      const rect = previewContent.getBoundingClientRect();
      const scaleFactor = Math.max(desiredWidth / (isCustomFrame ? rect.width * 2 : rect.width), 3);

      const html2canvas = (await import("html2canvas-pro")).default;

      // Preload all images
      const images = previewContent.querySelectorAll("img");
      await preloadImages(Array.from(images));

      // Capture the preview area without filters - this gives us a clean base image
      console.log("Bắt đầu tạo ảnh chất lượng cao với HTML2Canvas");
      const canvas = await html2canvas(previewContent, {
        allowTaint: true,
        useCORS: true,
        backgroundColor: "#FFFFFF",
        width: rect.width,
        height: rect.height,
        scale: scaleFactor,
        logging: false,
        imageTimeout: 30000,
        removeContainer: true,
        foreignObjectRendering: false,
        ignoreElements: (element) => element.tagName === "SCRIPT" || element.classList?.contains("no-print"),
        onclone: (clonedDoc) => {
          // Remove any filter classes from images before capturing
          const images = clonedDoc.querySelectorAll("img");
          images.forEach((img) => {
            // Remove filter classes while keeping other classes
            if (img.className && selectedFilter?.className) {
              const classes = img.className.split(' ').filter(cls =>
                !selectedFilter.className.split(' ').includes(cls));
              img.className = classes.join(' ');
            }

            img.style.imageRendering = "crisp-edges";
            img.style.imageRendering = "-webkit-optimize-contrast";
            const imgStyle = img.style as ExtendedCSSStyleDeclaration;
            imgStyle.colorAdjust = "exact";
            imgStyle.webkitPrintColorAdjust = "exact";
            imgStyle.printColorAdjust = "exact";
          });

          const container = clonedDoc.querySelector("[data-preview]") as HTMLElement;
          if (container && container.style) {
            container.style.transform = "translateZ(0)";
            container.style.backfaceVisibility = "hidden";
            container.style.backgroundColor = "#FFFFFF";
          }
        },
      });
      console.log("HTML2Canvas đã tạo ảnh cơ bản thành công");

      // Create a temporary canvas for working with the image
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) throw new Error("Không thể tạo temporary canvas context");

      // Draw the base image to the temporary canvas
      tempCtx.drawImage(canvas, 0, 0);

      // Get the image data as a blob
      const imageBlob = await new Promise<Blob>((resolve) => {
        tempCanvas.toBlob((blob) => {
          resolve(blob!);
        }, "image/jpeg", 0.95);
      });

      let processedImageUrl: string;

      // If a filter is selected, send to server for processing
      if (selectedFilter?.id && selectedFilter.id !== "none") {
        console.log(`Áp dụng filter "${selectedFilter.id}" với server-side processing`);

        // Find the filter in skinFilters array for more accurate processing
        const skinFilter = skinFilters.find(filter => filter.id === selectedFilter.id);
        const filterToApply = skinFilter ? skinFilter.id : selectedFilter.id;

        // Create form data with the image and filter type
        const formData = new FormData();
        formData.append("image", imageBlob);
        formData.append("filterType", filterToApply);

        // Send to the server for filter processing
        const response = await fetch("/api/filters", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Server không thể xử lý filter: ${response.statusText}`);
        }

        // Get the processed image as a blob
        const processedImageBlob = await response.blob();
        processedImageUrl = URL.createObjectURL(processedImageBlob);
        console.log("Server đã xử lý filter thành công");
      } else {
        // No filter needed
        processedImageUrl = URL.createObjectURL(imageBlob);
        console.log("Không cần áp dụng filter");
      }

      // Load the processed image
      const processedImage = document.createElement('img');
      processedImage.src = processedImageUrl;
      await new Promise<void>((resolve) => {
        processedImage.onload = () => resolve();
        processedImage.onerror = () => {
          console.error("Lỗi khi tải ảnh đã xử lý");
          resolve();
        };
      });

      // Create the final canvas with the desired dimensions
      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = desiredWidth;
      finalCanvas.height = desiredHeight;
      const ctx = finalCanvas.getContext("2d", {
        alpha: true,
        willReadFrequently: false,
        desynchronized: false,
      });
      if (!ctx) throw new Error("Không thể tạo 2D context");

      // Setup the final canvas
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, desiredWidth, desiredHeight);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Draw the processed image onto the final canvas
      if (isCustomFrame) {
        // Custom frame: Draw two identical copies side by side
        const singleImageWidth = desiredWidth / 2;
        const singleImageHeight = desiredHeight;
        const aspectRatio = processedImage.width / processedImage.height;
        const targetAspectRatio = singleImageWidth / singleImageHeight;

        let drawWidth = singleImageWidth;
        let drawHeight = singleImageHeight;
        let offsetX = 0;
        let offsetY = 0;

        if (aspectRatio > targetAspectRatio) {
          drawHeight = singleImageWidth / aspectRatio;
          offsetY = (singleImageHeight - drawHeight) / 2;
        } else {
          drawWidth = singleImageHeight * aspectRatio;
          offsetX = (singleImageWidth - drawWidth) / 2;
        }

        // Draw first image (left)
        ctx.drawImage(processedImage, 0, 0, processedImage.width, processedImage.height, offsetX, offsetY, drawWidth, drawHeight);

        // Draw second image (right)
        ctx.drawImage(processedImage, 0, 0, processedImage.width, processedImage.height, singleImageWidth + offsetX, offsetY, drawWidth, drawHeight);
      } else {
        // Regular frame: Single image
        const aspectRatio = processedImage.width / processedImage.height;
        const targetAspectRatio = desiredWidth / desiredHeight;

        let drawWidth = desiredWidth;
        let drawHeight = desiredHeight;
        let offsetX = 0;
        let offsetY = 0;

        if (aspectRatio > targetAspectRatio) {
          drawHeight = desiredWidth / aspectRatio;
          offsetY = (desiredHeight - drawHeight) / 2;
        } else {
          drawWidth = desiredHeight * aspectRatio;
          offsetX = (desiredWidth - drawWidth) / 2;
        }

        ctx.drawImage(processedImage, 0, 0, processedImage.width, processedImage.height, offsetX, offsetY, drawWidth, drawHeight);
      }

      // Release the object URL to prevent memory leaks
      URL.revokeObjectURL(processedImageUrl);

      // Get the final high quality image
      const highQualityImageUrl = finalCanvas.toDataURL("image/jpeg", quality);
      console.log("Ảnh đã được tạo với độ phân giải:", desiredWidth, "x", desiredHeight);
      return highQualityImageUrl;
    } catch (error) {
      console.error("Lỗi khi tạo ảnh chất lượng cao:", error);
      alert("❌ Có lỗi xảy ra khi tạo ảnh. Vui lòng thử lại.");
    }
  };

  const generateVideo = async (): Promise<string | void> => {
    try {
      console.log("Bắt đầu tạo video từ ảnh");
      const previewContent = printPreviewRef.current;
      if (!previewContent) return;

      // First check if the browser supports MediaRecorder
      if (typeof window === 'undefined' || !window.MediaRecorder) {
        console.error("MediaRecorder is not supported in this browser");
        alert("Trình duyệt của bạn không hỗ trợ tạo video. Vui lòng sử dụng Chrome, Edge, hoặc Firefox mới nhất.");
        return;
      }

      // Create a canvas to capture the preview with willReadFrequently flag
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("Không thể tạo canvas context");

      // Set dimensions based on the frame type - use smaller dimensions for better performance
      const isLandscape = selectedFrame && selectedFrame.columns > selectedFrame.rows && !selectedFrame.isCustom;
      // Use even smaller dimensions for better compatibility
      const width = isLandscape ? 640 : 360;  // Reduced for compatibility
      const height = isLandscape ? 480 : 640;  // Reduced for compatibility
      canvas.width = width;
      canvas.height = height;

      // Capture a single snapshot of the preview content to use in all frames
      console.log("Capturing initial snapshot of preview content...");
      const html2canvas = (await import("html2canvas-pro")).default;

      // Capture once for all frames
      const previewSnapshot = await html2canvas(previewContent, {
        backgroundColor: "#FFFFFF",
        scale: 1,  // Reduced scale for performance
        logging: false,
        useCORS: true,
        allowTaint: true,
        removeContainer: false,  // Prevent removal of the cloned container
        onclone: (clonedDoc) => {
          // Ensure all images are fully loaded in the clone
          const images = clonedDoc.getElementsByTagName('img');
          for (let img of Array.from(images)) {
            img.crossOrigin = "anonymous";
            if (img.complete) continue;
            img.src = img.src; // Reload the image
          }
        }
      });
      console.log("Initial snapshot captured successfully");

      // Setup media recorder with more compatible options
      let mediaRecorder: MediaRecorder;
      let stream: MediaStream;
      const chunks: BlobPart[] = [];

      try {
        // Test if captureStream is supported
        if (!canvas.captureStream) {
          throw new Error("Canvas captureStream not supported");
        }

        // Create a media stream from the canvas with error handling
        stream = canvas.captureStream(24); // Reduced to 24 FPS for compatibility

        // Try multiple codecs in order of preference
        const mimeOptions = [
          "video/webm;codecs=vp8",
          "video/webm",
          "video/mp4",
          "" // Empty string means use default
        ];

        // Find the first supported MIME type
        let mimeType = "";
        for (const mime of mimeOptions) {
          if (!mime || MediaRecorder.isTypeSupported(mime)) {
            mimeType = mime;
            break;
          }
        }

        // Create media recorder with the supported MIME type
        const options = mimeType ? { mimeType, videoBitsPerSecond: 1000000 } : {};
        mediaRecorder = new MediaRecorder(stream, options);
        console.log(`Using MIME type: ${mimeType || 'browser default'}`);
      } catch (streamError) {
        console.error("Error creating media stream:", streamError);
        alert("Trình duyệt của bạn không hỗ trợ tạo video. Chỉ tạo ảnh.");
        return;
      }

      // Handle data chunks
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
          console.log(`Video data chunk received: ${e.data.size} bytes`);
        }
      };

      // Handle recording errors
      mediaRecorder.onerror = (event) => {
        console.error("Media Recorder error:", event);
      };

      // Setup animation variables - use shorter animation for better reliability
      let frameCount = 0;
      const totalFrames = 36; // 1.5 seconds at 24fps
      const animationDuration = 1500; // 1.5 seconds

      // Start recording with explicit error handling
      try {
        // Request small chunks of data every 100ms
        mediaRecorder.start(100);
        console.log("Media recording started");
      } catch (startError) {
        console.error("Failed to start media recording:", startError);
        return;
      }

      // Animation loop with simpler animations for better compatibility
      const startTime = Date.now();
      const animate = () => {
        try {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / animationDuration, 1);
          frameCount = Math.floor(progress * totalFrames);

          if (progress < 1) {
            // Clear canvas for new frame
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, width, height);

            // Apply simple animation - just scale
            let scale = 0.95 + (0.05 * Math.sin(progress * Math.PI * 2));

            // Apply transformations
            ctx.save();
            ctx.translate(width / 2, height / 2);
            ctx.scale(scale, scale);
            ctx.translate(-width / 2, -height / 2);

            // Draw the snapshot
            try {
              // Draw the captured content with proper scaling
              const aspectRatio = previewSnapshot.width / previewSnapshot.height;
              let drawWidth = width * 0.9;
              let drawHeight = height * 0.9;

              if (aspectRatio > width / height) {
                drawHeight = drawWidth / aspectRatio;
              } else {
                drawWidth = drawHeight * aspectRatio;
              }

              const offsetX = (width - drawWidth) / 2;
              const offsetY = (height - drawHeight) / 2;

              ctx.drawImage(previewSnapshot, offsetX, offsetY, drawWidth, drawHeight);

              // Add a simple border
              ctx.lineWidth = 5;
              ctx.strokeStyle = "rgba(0,0,0,0.2)";
              ctx.strokeRect(5, 5, width - 10, height - 10);

              // Add frame info for debugging
              ctx.fillStyle = "rgba(255,255,255,0.5)";
              ctx.font = "10px Arial";
              ctx.fillText(`S Photobooth - Frame ${frameCount + 1}/${totalFrames}`, 10, 15);
            } catch (drawError) {
              console.warn("Error drawing frame:", drawError);
              // If drawing fails, create a simple colored frame as fallback
              ctx.fillStyle = "#FFFFFF";
              ctx.fillRect(0, 0, width, height);

              ctx.fillStyle = "rgba(0,0,0,0.7)";
              ctx.font = "20px Arial";
              ctx.textAlign = "center";
              ctx.fillText("S Photobooth", width / 2, height / 2);
            }

            // Restore canvas state
            ctx.restore();

            // Continue animation
            requestAnimationFrame(animate);
          } else {
            console.log("Animation complete, stopping recorder");
            // End recording safely
            try {
              mediaRecorder.stop();
              console.log("Media recorder stopped");
            } catch (stopError) {
              console.error("Error stopping media recorder:", stopError);
            }
          }
        } catch (animateError) {
          console.error("Animation frame error:", animateError);
          // If animation fails, stop recording
          try {
            mediaRecorder.stop();
          } catch (e) {
            console.error("Failed to stop media recorder after error:", e);
          }
        }
      };

      // Start animation
      console.log("Starting animation loop");
      animate();

      // Create blob URL for preview with improved error handling
      return new Promise((resolve) => {
        // Set up the onstop handler
        mediaRecorder.onstop = async () => {
          console.log(`Processing ${chunks.length} video chunks`);

          if (chunks.length === 0) {
            console.error("No video data chunks collected");
            resolve("");
            return;
          }

          // Try different MIME types for the blob based on browser support
          let videoBlob;
          try {
            // First try with webm
            videoBlob = new Blob(chunks, { type: "video/webm" });
            if (videoBlob.size < 1000) {
              // If too small, try with MP4
              videoBlob = new Blob(chunks, { type: "video/mp4" });
            }
          } catch (blobError) {
            console.error("Error creating video blob:", blobError);
            // Try without specifying type as last resort
            videoBlob = new Blob(chunks);
          }

          console.log(`Video blob created: ${videoBlob.size} bytes, type: ${videoBlob.type}`);

          if (videoBlob.size < 1000) {
            console.error("Video is too small, likely corrupt");
            resolve("");
            return;
          }

          // Create a preview URL
          const blobUrl = URL.createObjectURL(videoBlob);

          // Upload video with improved error handling
          try {
            console.log("Uploading video...");
            // Determine file extension based on blob type
            const fileExt = videoBlob.type.includes('webm') ? 'webm' : 'mp4';
            const videoFile = new File([videoBlob], `photobooth.${fileExt}`, { type: videoBlob.type });
            const videoFormData = new FormData();
            videoFormData.append("file", videoFile);

            // Set longer timeout for the fetch
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30-second timeout

            const videoResponse = await fetch("/api/images/video", {
              method: "POST",
              body: videoFormData,
              headers: {
                "Authorization": `Bearer ${localStorage.getItem("token") || ""}`,
              },
              signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!videoResponse.ok) {
              const errorText = await videoResponse.text();
              throw new Error(`Lỗi khi tải video lên (${videoResponse.status}): ${errorText}`);
            }

            const videoData = await videoResponse.json();
            console.log("Video đã được tải lên thành công:", videoData);

            // Store video URL in context and localStorage
            const videoUrl = (process.env.API_BASE_URL || "") + videoData.path;
            setVideoQrCode(videoUrl);
            localStorage.setItem("videoQrCode", videoUrl);

            resolve(blobUrl);
          } catch (error) {
            console.error("Lỗi khi tải video:", error);
            // Still return the blob URL even if upload fails
            resolve(blobUrl);
          }
        };
      });
    } catch (error) {
      console.error("Lỗi khi tạo video:", error);
      return "";
    }
  };

  const generateGIF = async (): Promise<string | void> => {
    try {
      console.log("Bắt đầu tạo GIF từ ảnh");
      const previewContent = printPreviewRef.current;
      if (!previewContent) return;

      // Import gif.js
      const GIF = (await import("gif.js")).default;

      // Set dimensions based on the frame type
      const isLandscape = selectedFrame && selectedFrame.columns > selectedFrame.rows && !selectedFrame.isCustom;
      const width = isLandscape ? 600 : 300;
      const height = isLandscape ? 450 : 600;

      // Create a GIF encoder with optimized settings to prevent errors
      const gif = new GIF({
        workers: 2, // Reduce worker count to avoid memory issues
        quality: 10,
        width: width,
        height: height,
        workerScript: "/gif.worker.js",
        transparent: null,
        background: "#ffffff",
        repeat: 0,
        dither: false, // Disable dithering for better performance
        debug: true, // Enable debug mode to see more detailed errors
      });

      // Create a canvas for capturing frames with willReadFrequently attribute to fix the warning
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("Không thể tạo canvas context");
      canvas.width = width;
      canvas.height = height;

      // Add frames to the GIF
      const frameCount = 15; // Number of frames for the animation
      const html2canvas = (await import("html2canvas-pro")).default;

      // Create a snapshot of the preview content once instead of for each frame
      // This avoids the "Unable to find element in cloned iframe" error
      const previewSnapshot = await html2canvas(previewContent, {
        backgroundColor: "#FFFFFF",
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        removeContainer: false, // Prevent removal of the cloned container
        onclone: (clonedDoc) => {
          // Ensure all images are fully loaded in the clone
          const images = clonedDoc.getElementsByTagName('img');
          for (let img of Array.from(images)) {
            img.crossOrigin = "anonymous";
            if (img.complete) continue;
            img.src = img.src; // Reload the image
          }
        }
      });

      for (let i = 0; i < frameCount; i++) {
        // Progress indicator
        console.log(`Tạo GIF: Khung hình ${i + 1}/${frameCount}`);

        try {
          // Apply different animation effects to the preview
          const scale = 0.95 + (0.05 * Math.sin(i * 0.6));
          const rotate = Math.sin(i * 0.7) * 3;

          // Prepare canvas for this frame
          ctx.clearRect(0, 0, width, height);
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);

          // Use the snapshot we captured earlier instead of capturing for each frame
          const capturedCanvas = previewSnapshot;

          // Apply transformations to the canvas with safe error handling
          ctx.save();

          // Simple animation for frames that's less prone to errors
          if (i % 2 === 0) {
            // Even frames: zoom effect
            const zoomScale = 0.95 + (0.05 * (i / frameCount));
            ctx.translate(width / 2, height / 2);
            ctx.scale(zoomScale, zoomScale);
            ctx.translate(-width / 2, -height / 2);
          } else {
            // Odd frames: slight rotation
            const angle = (i / frameCount) * 6 - 3; // -3 to +3 degrees
            ctx.translate(width / 2, height / 2);
            ctx.rotate((angle * Math.PI) / 180);
            ctx.translate(-width / 2, -height / 2);
          }

          // Draw the captured content with proper scaling
          const aspectRatio = capturedCanvas.width / capturedCanvas.height;
          let drawWidth = width * 0.9; // Slightly smaller to avoid edge issues
          let drawHeight = height * 0.9;

          if (aspectRatio > width / height) {
            drawHeight = drawWidth / aspectRatio;
          } else {
            drawWidth = drawHeight * aspectRatio;
          }

          const offsetX = (width - drawWidth) / 2;
          const offsetY = (height - drawHeight) / 2;

          // Draw with error handling
          try {
            ctx.drawImage(capturedCanvas, offsetX, offsetY, drawWidth, drawHeight);
          } catch (drawError) {
            console.warn("Error drawing to canvas:", drawError);
            // Draw a fallback colored rectangle if image drawing fails
            ctx.fillStyle = `hsl(${(i * 30) % 360}, 80%, 70%)`;
            ctx.fillRect(offsetX, offsetY, drawWidth, drawHeight);
          }

          // Add a subtle pulsing overlay for visual interest
          const pulseValue = Math.sin(i * 0.6) * 0.5 + 0.5; // 0 to 1
          const hue = (i * 20) % 360; // Cycle through colors
          ctx.fillStyle = `hsla(${hue}, 70%, 60%, ${0.03 + pulseValue * 0.05})`;
          ctx.fillRect(0, 0, width, height);

          ctx.restore();
        } catch (frameRenderError) {
          console.warn(`Error rendering frame ${i}:`, frameRenderError);
          // Create a simple fallback frame
          ctx.clearRect(0, 0, width, height);
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);
          ctx.fillStyle = `hsl(${(i * 30) % 360}, 80%, 70%)`;
          ctx.font = "20px Arial";
          ctx.textAlign = "center";
          ctx.fillText("S Photobooth", width / 2, height / 2);
        }

        // Add the frame to the GIF with a safe approach
        try {
          // Use a promise to ensure frame is added properly
          await new Promise<void>((resolveFrame) => {
            // Add frame with error handling
            try {
              gif.addFrame(canvas, {
                delay: 100,
                copy: true,
                dispose: 1 // Dispose previous frame to reduce memory usage
              });
              resolveFrame();
            } catch (frameErr) {
              console.error("Error adding frame:", frameErr);
              resolveFrame(); // Continue even if frame fails
            }
          });

          // Allow UI to update and GC to run
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (frameError) {
          console.warn("Frame processing error:", frameError);
          // Continue with next frame even if this one fails
        }
      }

      // Render the GIF and upload it with enhanced error handling
      return new Promise((resolve) => {
        // Handle progress events
        gif.on('progress', (p: number) => {
          console.log(`GIF rendering progress: ${Math.round(p * 100)}%`);
        });

        // Handle errors during rendering
        gif.on('error' as string, (...args: unknown[]) => {
          console.error('GIF rendering error:', args[0]);
          resolve(''); // Resolve with empty string to continue workflow
        });

        // Handle successful completion
        gif.on("finished", async (blob: Blob) => {
          try {
            console.log(`GIF created successfully: ${blob.size} bytes`);

            // Skip upload if blob is too small (likely corrupted)
            if (blob.size < 1000) {
              throw new Error("GIF quá nhỏ, có thể bị hỏng");
            }

            // Convert blob to file for upload
            const gifFile = new File([blob], "photobooth.gif", { type: "image/gif" });
            const gifFormData = new FormData();
            gifFormData.append("file", gifFile);

            // Upload the GIF
            const gifResponse = await fetch("/api/images/gif", {
              method: "POST",
              body: gifFormData,
              headers: {
                "Authorization": `Bearer ${localStorage.getItem("token") || ""}`,
              }
            });

            if (!gifResponse.ok) {
              throw new Error("Lỗi khi tải GIF lên");
            }

            const gifData = await gifResponse.json();
            console.log("GIF đã được tải lên thành công:", gifData);

            // Store GIF URL in context and localStorage
            const gifUrl = process.env.API_BASE_URL + gifData.path;
            setGifQrCode(gifUrl);
            localStorage.setItem("gifQrCode", gifUrl);

            // Return blob URL for preview
            resolve(URL.createObjectURL(blob));
          } catch (error) {
            console.error("Lỗi khi tải GIF:", error);

            // Still try to return a blob URL if we have a valid blob
            if (blob && blob.size > 0) {
              resolve(URL.createObjectURL(blob));
            } else {
              resolve('');
            }
          }
        });

        // Start rendering with try-catch
        try {
          console.log("Starting GIF rendering...");
          gif.render();
        } catch (renderError) {
          console.error("Error starting GIF render:", renderError);
          resolve('');
        }
      });
    } catch (error) {
      console.error("Lỗi khi tạo GIF:", error);
      alert("❌ Có lỗi xảy ra khi tạo GIF. Vui lòng thử lại.");
    }
  };

  const handleFilterSelect = (filter: typeof skinFilters[0]) => {
    // Convert skin filter to the format expected by the context
    const convertedFilter = {
      id: filter.id,
      name: filter.name,
      className: filter.className
    };
    setSelectedFilter(convertedFilter);
  };

  const renderCell = (idx: number) => {
    const photoIndex = selectedIndices[idx];

    const cellContent = photoIndex !== undefined ? (
      <Image
        src={photos[photoIndex].image || "/placeholder.svg"}
        alt={`Slot ${idx}`}
        className={cn(
          "h-full w-full object-cover photo-booth-image",
          selectedFilter.className,
          selectedFrame?.isCircle && "rounded-full"
        )}
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
      />
    ) : (
      <div className={cn(
        "flex h-full w-full flex-col items-center justify-center text-gray-400",
        selectedFrame?.isCircle && "rounded-full"
      )}
      >
        <span className="text-xs">{"Empty"}</span>
      </div>
    );

    const baseClass =
      "relative w-full flex items-center justify-center transition-all duration-200 overflow-hidden border border-transparent";
    const emptyClass = "border-dashed border-gray-200 bg-gray-50/50";
    const hasPhoto = selectedIndices[idx] !== undefined;
    const isLandscape = (selectedFrame?.columns ?? 0) > (selectedFrame?.rows ?? 0) && !selectedFrame?.isCustom;
    const isSquare = selectedFrame?.columns === selectedFrame?.rows;
    return (
      <div
        key={idx}
        className={cn(
          baseClass,
          !hasPhoto && emptyClass,
          hasPhoto && "cursor-pointer",
          selectedFrame?.isCustom && selectedFrame?.rows == 4 ? "aspect-[4/3]" : selectedFrame?.isCustom && selectedFrame?.rows == 2 ? "ha aspect-[3/4]" : isSquare && selectedFrame?.columns == 2 ? "aspect-[3/4]" : selectedFrame?.columns == 2 ? "aspect-square" : isLandscape ? "aspect-[5/4]" : "aspect-square"
        )}
      // No click handler needed in step8
      >
        {cellContent}
      </div>
    );
  };

  const renderPreview = () => {
    if (!selectedFrame) return null;
    const commonClasses = "mx-auto overflow-hidden shadow-md";

    // Determine if the frame is landscape based on its columns and rows
    // For a landscape frame, columns > rows (e.g., 3x2 is landscape)
    const isLandscape = selectedFrame.columns > selectedFrame.rows && !selectedFrame.isCustom;
    const isSquare = selectedFrame.columns === selectedFrame.rows;

    // Set dimensions based on orientation
    const previewHeight = isLandscape ? "4in" : "6in";
    const previewWidth = isLandscape ? "6in" : "4in";
    const aspectRatio = isLandscape ? "3/2" : "2/3";

    // Frame overlay using selectedTemplate
    const frameOverlay = selectedTemplate?.overlay ? (
      <div className="pointer-events-none absolute inset-0 z-20">
        <Image
          src={selectedTemplate.overlay}
          alt="Frame Overlay"
          className="h-full w-full object-contain"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
    ) : null;

    return (
      <div className={cn("relative w-full", commonClasses)} style={{ height: previewHeight, width: selectedFrame.isCustom ? "2in" : previewWidth }} >
        <div
          ref={printPreviewRef}
          data-preview
          id="photobooth-print-preview"
          className={cn(
            "flex flex-col gap-4 print-preview photo-booth-preview bg-white",
            selectedFrame.isCustom ? "pb-[10%] pt-[10%]" : "pb-[10%] pt-[5%]",
            isSquare && selectedFrame.columns == 2 ? "pt-[10%]" : "",
            isSquare && selectedFrame.columns == 1 ? "pt-[20%]" : "",
            isLandscape ? "px-[5%]" : "px-[10%]"
          )}
          style={{
            height: previewHeight,
            aspectRatio: selectedFrame.isCustom ? "1/3" : (isSquare && selectedFrame.columns == 1) ? "2/3" : aspectRatio,
          }}
        >
          {selectedFrame.isCustom ? (
            <div className="relative z-10 grid grid-cols-1 gap-[5%]">
              {Array.from({ length: selectedFrame.rows }, (_, idx) => renderCell(idx))}
            </div>
          ) : (
            <div
              className={cn(
                "relative z-10 grid gap-[calc(2.5%*3/2)]"
              )}
              style={{
                gridTemplateColumns: `repeat(${selectedFrame.columns}, 1fr)`
              }}
            >
              {Array.from({ length: selectedFrame.columns }, (_, colIdx) => (
                <div key={colIdx} className="flex flex-col gap-1">
                  {Array.from({ length: selectedFrame.rows }, (_, rowIdx) => {
                    // Correctly calculate the index for each cell based on column and row
                    const cellIdx = colIdx + (rowIdx * selectedFrame.columns);
                    return (
                      <div key={rowIdx} className="">
                        {renderCell(cellIdx)}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
          {frameOverlay}
        </div>
      </div>
    );
  };

  // Custom styles for Slick carousel
  useEffect(() => {
    // Add custom styles for slick carousels
    const style = document.createElement('style');
    style.textContent = `
      /* Custom styles for Slick carousels */
      .slick-track {
        display: flex !important;
        gap: 4px;
        padding: 4px 0;
      }
      .slick-slide {
        height: inherit !important;
      }
      .slick-slide > div {
        height: 100%;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-between min-h-screen bg-purple-900 text-white  ">
      {/* Background graphics */}
      <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-black to-transparent z-0"></div>
      <div className="absolute top-0 left-0 right-0 w-full h-full">
        <Image
          src="/anh/bg.png"
          alt="Background"
          layout="fill"
          objectFit="cover"
          className="opacity-30"
          priority
        />
      </div>

      <header className="flex justify-between items-start w-full px-6 pt-6 z-10">
        <div className="flex items-center">
          <LogoApp />
        </div>
        <h1 className="text-white text-3xl md:text-5xl lg:text-6xl font-bold text-center tracking-wide">
          CHỈNH SỬA FILTER
        </h1>
        <HomeButton />
      </header>

      {/* Main content */}
      <div className="w-full px-4 md:px-16 z-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left column - Frame preview */}
          <div className="w-full lg:w-2/5 rounded-lg flex flex-col items-center justify-center">
            <div className="w-full flex justify-center">
              <div className={`w-full flex ${selectedFrame && selectedFrame.columns > selectedFrame.rows && !selectedFrame.isCustom ? 'max-w-xl' : 'max-w-md'} mx-auto`}>
                {renderPreview()}
              </div>
            </div>
          </div>

          {/* Right column - Filter options and Frame Templates */}
          <div className="w-full lg:w-3/5 flex flex-col gap-8">
            {/* Enhanced Skin Beautifying Filters */}
            <div className=" bg-zinc-200 rounded-2xl p-2 border border-indigo-500/30  ">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black">
                      Bộ lọc làm đẹp da
                    </h3>
                    <p className="text-xs text-black opacity-80">Chọn hiệu ứng yêu thích</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => prevSlide(skinFilterSliderRef)}
                    className="p-1.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg"
                  >
                    <ChevronLeft size={18} className="text-white" />
                  </button>
                  <button
                    onClick={() => nextSlide(skinFilterSliderRef)}
                    className="p-1.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg"
                  >
                    <ChevronRight size={18} className="text-white" />
                  </button>
                </div>
              </div>

              <div className="px-2">
                <Slider ref={skinFilterSliderRef} {...slickSettings}>
                  {skinFilters.map((filter) => (
                    <div key={filter.id} className="px-2">
                      <div
                        onClick={() => handleFilterSelect(filter)}
                        className="cursor-pointer"
                      >
                        <div
                          className={`relative rounded-2xl overflow-hidden ${activeSkinFilter.id === filter.id
                            ? "border-2 border-pink-400"
                            : "border border-purple-400/50"
                            }`}
                        >
                          <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-purple-900/50 to-pink-900/50">
                            {photos && photos.length > 0 ? (
                              <img
                                src={photos[0].image || "/placeholder.svg"}
                                alt={filter.name}
                                className={`w-full h-full object-cover ${filter.className}`}
                              />
                            ) : (
                              <img
                                src={filter.preview || "/placeholder.svg"}
                                alt={filter.name}
                                className={`w-full h-full object-cover ${filter.className}`}
                              />
                            )}

                            {/* Filter icon overlay */}
                            <div className="absolute top-1 right-1 w-6 h-6 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
                              <span className="text-sm">{filter.icon}</span>
                            </div>

                            {/* Selected indicator */}
                            {activeSkinFilter.id === filter.id && (
                              <div className="absolute bottom-1 left-1 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center">
                                <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                              </div>
                            )}
                          </div>

                          <div
                            className={`p-2 text-center ${activeSkinFilter.id === filter.id
                              ? "bg-pink-600/80"
                              : "bg-purple-900/60"
                              }`}
                          >
                            <span className="text-xs font-medium text-white">
                              {filter.name}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </Slider>
              </div>
            </div>

            {/* Enhanced Frame Templates */}
            <div className=" bg-zinc-200 rounded-2xl p-2 border border-indigo-500/30 mt-2 ">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                    <ImageIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black">
                      Mẫu khung ảnh
                    </h3>
                    <p className="text-xs text-black opacity-80">Tùy chỉnh khung cho ảnh</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => prevSlide(frameTemplateSliderRef)}
                    className="p-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg"
                  >
                    <ChevronLeft size={18} className="text-white" />
                  </button>
                  <button
                    onClick={() => nextSlide(frameTemplateSliderRef)}
                    className="p-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg"
                  >
                    <ChevronRight size={18} className="text-white" />
                  </button>
                </div>
              </div>

              <div className="px-2">
                <Slider ref={frameTemplateSliderRef} {...slickSettings}>
                  {loading ? (
                    <div className="px-2">
                      <div className="bg-gradient-to-br from-indigo-800/50 to-purple-800/50 rounded-2xl flex items-center justify-center border border-indigo-500/30 aspect-square">
                        <div className="relative">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-400"></div>
                          <div className="absolute inset-0 animate-ping rounded-full h-8 w-8 border border-indigo-400/30"></div>
                        </div>
                      </div>
                    </div>
                  ) : frameTemplates.length > 0 ? (
                    frameTemplates.map((template) => (
                      <div key={template.id} className="px-2">
                        <div
                          onClick={() => setSelectedTemplate(template)}
                          className="cursor-pointer"
                        >
                          <div
                            className={`relative rounded-2xl overflow-hidden ${selectedTemplate?.id === template.id
                              ? "border-2 border-indigo-400"
                              : "border border-indigo-400/50"
                              }`}
                          >
                            <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-indigo-900/50 to-purple-900/50">
                              <img
                                src={template.overlay || template.overlay}
                                alt={template.name}
                                className="w-full h-full object-cover"
                              />

                              {/* Selected indicator */}
                              {selectedTemplate?.id === template.id && (
                                <div className="absolute bottom-1 left-1 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                                  <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                                </div>
                              )}
                            </div>

                            <div
                              className={`p-2 text-center ${selectedTemplate?.id === template.id
                                ? "bg-indigo-600/80"
                                : "bg-indigo-900/60"
                                }`}
                            >
                              <span className="text-xs font-medium text-white">
                                {template.name}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-2">
                      <div className="w-full flex items-center justify-center h-40 bg-gradient-to-br from-indigo-800/30 to-purple-800/30 rounded-2xl border border-indigo-500/30">
                        <div className="text-center">
                          <ImageIcon className="w-12 h-12 text-indigo-300 mx-auto mb-2 opacity-50" />
                          <p className="text-indigo-200">Không có mẫu khung ảnh cho kiểu khung này</p>
                        </div>
                      </div>
                    </div>
                  )}
                </Slider>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-end w-full px-12 pb-8 z-10">
        <button
          onClick={handlePrint}
          className={`rounded-full p-6 bg-transparent border-2 border-white glow-button mr-4 ${isPrinting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          disabled={isPrinting}
        >
          <div className="w-12 h-12 flex items-center justify-center text-pink-500 text-4xl">
            {isPrinting ? (
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500"></div>
            ) : (
              <Printer size={50} />
            )}
          </div>
        </button>


      </div>
    </div>
  );
}
