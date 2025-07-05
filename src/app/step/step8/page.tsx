"use client";


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

// Import QR Code
import * as QRCode from 'qrcode';

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
    colorAdjust?: string;
    webkitPrintColorAdjust?: string;
    printColorAdjust: string;
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
    imageQrCode,
    videoQrCode,
    gifQrCode,
  } = useBooth();
  console.log("Step 8 - Current selected frame:", videoQrCode, gifQrCode, imageQrCode, selectedTemplate);

  const activeSkinFilter = useMemo(() => {
    return skinFilters.find(filter => filter.id === selectedFilter.id) || skinFilters[0];
  }, [selectedFilter]);

  const [frameTemplates, setFrameTemplates] = useState<FrameTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [mediaSessionUrl, setMediaSessionUrl] = useState<string>("");

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

  // Create media session URL on component mount
  useEffect(() => {
    const initializeMediaSession = async () => {
      if (photos && photos.length > 0) {
        const url = await createMediaSession();
        setMediaSessionUrl(url);
        console.log("Media session URL created:", url);
      }
    };

    initializeMediaSession();
  }, [photos]);

  // Slick carousel settings and refs
  const skinFilterSliderRef = useRef<Slider | null>(null);
  const frameTemplateSliderRef = useRef<Slider | null>(null);

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

  const prevSlide = (sliderRef: React.RefObject<Slider | null>) => {
    sliderRef.current?.slickPrev();
  };

  const nextSlide = (sliderRef: React.RefObject<Slider | null>) => {
    sliderRef.current?.slickNext();
  };

  const createMediaSession = async (): Promise<string> => {
    try {
      // Tạo một placeholder URL để có thể hiển thị QR code
      // Trong step8, chúng ta chưa có image/video/gif URL final
      // Nên tạo một session tạm thời với thông tin cơ bản
      const tempSessionData = {
        timestamp: Date.now(),
        preview: true, // Đánh dấu là preview session
        photos: photos.map(photo => photo.image).filter(Boolean)
      };

      console.log('Creating media session with data:', tempSessionData);

      // Tạo session tạm thời
      const response = await fetch('/api/media-session-temp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mediaUrls: tempSessionData.photos, // Sử dụng photos từ context
          isPreview: true
        })
      });

      console.log('API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to create media session:', errorText);
        // Trả về URL placeholder nếu API fail
        const baseUrl = typeof window !== 'undefined' ?
          `${window.location.protocol}//${window.location.host}` : '';
        const fallbackUrl = `${baseUrl}/session-temp/preview-${tempSessionData.timestamp}`;
        console.log('Using fallback URL:', fallbackUrl);
        return fallbackUrl;
      }

      const session = await response.json();
      console.log('Created session:', session);

      // Create session URL
      const baseUrl = typeof window !== 'undefined' ?
        `${window.location.protocol}//${window.location.host}` : '';
      const sessionUrl = `${baseUrl}/session-temp/${session.sessionCode}`;
      console.log('Generated session URL:', sessionUrl);
      return sessionUrl;

    } catch (error) {
      console.error('Error creating media session:', error);
      // Trả về URL placeholder nếu có lỗi
      const baseUrl = typeof window !== 'undefined' ?
        `${window.location.protocol}//${window.location.host}` : '';
      const fallbackUrl = `${baseUrl}/session-temp/preview-${Date.now()}`;
      console.log('Using fallback URL due to error:', fallbackUrl);
      return fallbackUrl;
    }
  };
  const handlePrint = async () => {
    setIsPrinting(true);

    try {
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
            "printerName": selectedFrame?.isCustom ? "DS-RX1-Cut" : "DS-RX1",
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
      // Use existing media session URL or create new one
      const sessionUrl = mediaSessionUrl || await createMediaSession();
      console.log("Using media session URL:", sessionUrl);
      const isCustomFrame = selectedFrame?.isCustom === true;
      const isSquare = selectedFrame?.columns === selectedFrame?.rows;

      // Optimize resolution for print quality while keeping file size manageable
      const desiredWidth = isLandscape ? 2400 : 1600;  // Reduced from 3600/2400 to keep file size under limits
      const desiredHeight = isLandscape ? 1600 : 2400; // Reduced from 2400/3600 to keep file size under limits

      const rect = previewContent.getBoundingClientRect();
      // Improved scale factor calculation based on target dimensions
      const scaleFactor = Math.max(
        desiredWidth / rect.width, 
        desiredHeight / rect.height,
        3
      ); // Ensure at least 3x scaling for quality

      // Pre-load and optimize all images to ensure high-quality rendering
      const images = previewContent.querySelectorAll("img");
      await preloadImages(Array.from(images));

      console.log("Starting high-quality image generation with HTML2Canvas");

      // Create QR code element if session URL exists
      let qrCodeElement: HTMLElement | null = null;
      if (sessionUrl) {
        console.log('Creating QR code for URL:', sessionUrl);
        qrCodeElement = document.createElement('div');
        qrCodeElement.style.position = 'absolute';
        const paddingPercent = isLandscape ? 5 : 10;
        qrCodeElement.style.bottom = `${paddingPercent}%`;
        qrCodeElement.style.left = `${paddingPercent}%`;
        qrCodeElement.style.width = '55px';
        qrCodeElement.style.height = '55px';
        qrCodeElement.style.zIndex = '30';
        qrCodeElement.style.backgroundColor = 'white';
        qrCodeElement.style.padding = '2px';
        qrCodeElement.style.borderRadius = '2px';
        qrCodeElement.style.border = '1px solid #ccc';

        // Create QR code canvas
        const qrCanvas = document.createElement('canvas');
        try {
          await QRCode.toCanvas(qrCanvas, sessionUrl, {
            width: 50,
            margin: 0,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            },
            errorCorrectionLevel: 'M' // Medium error correction
          });
          qrCanvas.style.width = '50px';
          qrCanvas.style.height = '50px';
          qrCodeElement.appendChild(qrCanvas);
          console.log('QR code created successfully');
        } catch (error) {
          console.error('Error generating QR code:', error);
          // Fallback for QR code errors
          const fallbackText = document.createElement('div');
          fallbackText.innerText = 'QR';
          fallbackText.style.fontSize = '10px';
          fallbackText.style.textAlign = 'center';
          fallbackText.style.lineHeight = '50px';
          fallbackText.style.color = '#000';
          qrCodeElement.appendChild(fallbackText);
        }

        previewContent.appendChild(qrCodeElement);
      } else {
        console.log('No session URL available for QR code');
      }

      const html2canvas = (await import("html2canvas-pro")).default;
      
      // Enhanced HTML2Canvas configuration for better quality
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
        ignoreElements: (element) => 
          element.tagName === "SCRIPT" || 
          element.classList?.contains("no-print"),
        onclone: (clonedDoc) => {
          const container = clonedDoc.querySelector("[data-preview]") as HTMLElement;
          if (container && container.style) {
            // Apply optimized styles to container
            container.style.backgroundColor = "#FFFFFF";
            container.style.transform = "translateZ(0)";
            container.style.backfaceVisibility = "hidden";
            container.style.position = "relative";
            container.style.overflow = "hidden";

            // Adjust padding based on frame type and orientation
            if (isCustomFrame) {
              container.style.paddingTop = "10%";
              container.style.paddingBottom = "10%";
            } else {
              container.style.paddingTop = isSquare && selectedFrame?.columns === 1 ? "20%" :
                isSquare && selectedFrame?.columns === 2 ? "10%" : "5%";
              container.style.paddingBottom = "10%";
            }

            // Adjust horizontal padding based on orientation
            container.style.paddingLeft = isLandscape ? "5%" : "10%";
            container.style.paddingRight = isLandscape ? "5%" : "10%";

            // Set correct aspect ratio for different frame types
            if (isCustomFrame) {
              container.style.aspectRatio = "1/3";
            } else if (isSquare && selectedFrame?.columns === 1) {
              container.style.aspectRatio = "2/3";
            } else {
              container.style.aspectRatio = isLandscape ? "3/2" : "2/3";
            }
          }

          // Process all images for optimal quality
          const images = clonedDoc.querySelectorAll("img");
          images.forEach((img) => {
            // Ensure high-quality rendering
            img.style.imageRendering = "crisp-edges";
            img.style.imageRendering = "-webkit-optimize-contrast";
            
            // Apply color adjustments for print
            const imgStyle = img.style as ExtendedCSSStyleDeclaration;
            imgStyle.colorAdjust = "exact";
            imgStyle.webkitPrintColorAdjust = "exact";
            imgStyle.printColorAdjust = "exact";

            // Apply filter effects if selected
            if (selectedFilter?.className) {
              // Parse CSS class names into proper filter string
              const filterClasses = selectedFilter.className.split(" ");
              const filterValues = filterClasses
                .filter((cls) => cls.includes("-"))
                .map((cls) => {
                  const [prop, val] = cls.split("-");
                  if (["brightness", "contrast", "saturate"].includes(prop)) {
                    return `${prop}(${val}%)`;
                  } else if (prop === "blur") {
                    return `${prop}(${val})`;
                  } else if (prop === "sepia") {
                    return `${prop}(1)`;
                  }
                  return "";
                })
                .filter(Boolean)
                .join(" ");
                
              img.style.filter = filterValues;
            }
          });

          // Optimize frame background rendering
          const backgroundElement = clonedDoc.querySelector(".pointer-events-none.absolute.inset-0.z-0 img");
          if (backgroundElement) {
            (backgroundElement as HTMLElement).style.objectFit = "contain";
            (backgroundElement as HTMLElement).style.width = "100%";
            (backgroundElement as HTMLElement).style.height = "100%";
          }

          // Optimize frame overlay rendering
          const overlayElement = clonedDoc.querySelector(".pointer-events-none.absolute.inset-0.z-20 img");
          if (overlayElement) {
            (overlayElement as HTMLElement).style.objectFit = "contain";
            (overlayElement as HTMLElement).style.width = "100%";
            (overlayElement as HTMLElement).style.height = "100%";
          }

          // Configure grid layout based on frame type
          if (isCustomFrame) {
            const gridElement = clonedDoc.querySelector(".grid");
            if (gridElement) {
              gridElement.className = "relative z-10 grid grid-cols-1 gap-[5%]";
            }
          } else {
            const gridElement = clonedDoc.querySelector(".grid");
            if (gridElement && selectedFrame) {
              gridElement.className = "relative z-10 grid gap-[calc(2.5%*3/2)]";
              (gridElement as HTMLElement).style.gridTemplateColumns = `repeat(${selectedFrame.columns}, 1fr)`;
            }
          }
        },
      });

      // Remove QR code element after capturing
      if (qrCodeElement) {
        previewContent.removeChild(qrCodeElement);
      }

      console.log("HTML2Canvas basic capture completed successfully");

      // Create the final canvas with the desired dimensions
      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = desiredWidth;
      finalCanvas.height = desiredHeight;
      
      // Get canvas context with optimized settings for print quality
      const ctx = finalCanvas.getContext("2d", {
        alpha: true,
        willReadFrequently: false,
        desynchronized: false,
      });
      
      if (!ctx) throw new Error("Cannot create 2D context");

      // Setup the final canvas with white background
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, desiredWidth, desiredHeight);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      if (isCustomFrame) {
        // Custom frame: Render two identical images side by side for 6x4 layout
        const singleImageWidth = desiredWidth / 2;
        const singleImageHeight = desiredHeight;
        
        // Draw first image (left)
        ctx.drawImage(
          canvas,
          0, 0, canvas.width, canvas.height,
          0, 0, singleImageWidth, singleImageHeight
        );

        // Draw second image (right) - exact duplicate
        ctx.drawImage(
          canvas,
          0, 0, canvas.width, canvas.height,
          singleImageWidth, 0, singleImageWidth, singleImageHeight
        );
      } else {
        // Regular frame: Render a single image centered and scaled
        const aspectRatio = canvas.width / canvas.height;
        const targetAspectRatio = desiredWidth / desiredHeight;

        // Calculate dimensions to maintain proper aspect ratio
        let drawWidth = desiredWidth;
        let drawHeight = desiredHeight;
        let offsetX = 0;
        let offsetY = 0;

        if (aspectRatio > targetAspectRatio) {
          // Canvas is wider than target - fit to width
          drawHeight = desiredWidth / aspectRatio;
          offsetY = (desiredHeight - drawHeight) / 2;
        } else {
          // Canvas is taller than target - fit to height
          drawWidth = desiredHeight * aspectRatio;
          offsetX = (desiredWidth - drawWidth) / 2;
        }

        // Draw the image centered
        ctx.drawImage(
          canvas,
          0, 0, canvas.width, canvas.height,
          offsetX, offsetY, drawWidth, drawHeight
        );
      }

      // Generate optimized JPEG with specified quality
      const highQualityImageUrl = finalCanvas.toDataURL("image/jpeg", quality);
      console.log(`Image generated successfully at ${desiredWidth}x${desiredHeight} resolution`);
      return highQualityImageUrl;
    } catch (error) {
      console.error("Error creating high-quality image:", error);
      alert("❌ An error occurred while creating the image. Please try again.");
    }
  };

  const handleFilterSelect = (filter: typeof skinFilters[0]) => {
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
          selectedFrame?.isCustom && selectedFrame?.rows == 4 ? "aspect-[4/3]" : selectedFrame?.isCustom && selectedFrame?.rows == 2 ? "ha aspect-[3/4]" : isSquare && selectedFrame?.columns == 2 ? "aspect-[3/4]" : selectedFrame?.columns == 2 ? "aspect-square" : isLandscape ? "aspect-[5/4]" : "aspect-[3/4]"
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

    const isLandscape = selectedFrame.columns > selectedFrame.rows && !selectedFrame.isCustom;
    const isSquare = selectedFrame.columns === selectedFrame.rows;

    // Set dimensions based on orientation
    const previewHeight = isLandscape ? "7.2in" : "10.8in";
    const previewWidth = isLandscape ? "10.8in" : "7.2in";
    const aspectRatio = isLandscape ? "3/2" : "2/3";

    // Frame background (ở phía sau - z-index thấp)
    const frameBackground = selectedTemplate?.background ? (
      <div className="pointer-events-none absolute inset-0 z-0">
        <Image
          src={selectedTemplate.background}
          alt="Frame Background"
          className="h-full w-full object-contain"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
    ) : null;

    // Frame overlay (ở phía trước - z-index cao)
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
      <div className={cn("relative w-full", commonClasses)} style={{ height: previewHeight, width: selectedFrame.isCustom ? "3.6in" : previewWidth }} >
        <div
          ref={printPreviewRef}
          data-preview
          id="photobooth-print-preview"
          className={cn(
            "flex flex-col gap-4 print-preview photo-booth-preview bg-white",
            selectedFrame.isCustom ? "pb-[10%] pt-[10%]" : "pb-[10%] pt-[5%]",
            isSquare && selectedFrame.columns == 2 ? "pt-[10%]" : "",
            isSquare && selectedFrame.columns == 1 ? "pt-[20%]" : "",
            isLandscape ? "px-[5%] pt-[5%]" : "px-[10%] pt-[10%]"
          )}
          style={{
            height: previewHeight,
            aspectRatio: selectedFrame.isCustom ? "1/3" : (isSquare && selectedFrame.columns == 1) ? "2/3" : aspectRatio,
          }}
        >
          {frameBackground}
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
    <div className="relative flex flex-col items-center justify-between min-h-screen bg-purple-900 text-white overflow-hidden">
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

      <header className="flex justify-between items-center w-full px-6 pt-10 z-10">
        <div className="flex items-center">
          <LogoApp />
        </div>
        <h1 className="text-white text-3xl md:text-5xl lg:text-6xl font-bold text-center tracking-wide">
          CHỈNH SỬA FILTER
        </h1>
        <HomeButton />
      </header>

      <div className="grid grid-cols-2 gap-6 mx-32 z-30">

        <div className="lg:col-span-1 flex flex-col gap-6">
               {renderPreview()}
         </div>

        <div className="lg:col-span-1">
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
                            <Image
                              src={photos[0].image || "/placeholder.svg"}
                              alt={filter.name}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              style={{ objectFit: "cover" }}
                              className={`w-full h-full object-cover ${filter.className}`}
                            />
                          ) : (
                            <Image
                              src={filter.preview || "/placeholder.svg"}
                              alt={filter.name}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              style={{ objectFit: "cover" }}
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
                            {/* Show background if available, otherwise show overlay */}
                            <Image
                              src={template.background || template.overlay || "/placeholder.svg"}
                              alt={template.name}
                              className="w-full h-full object-cover"
                              width={128}
                              height={128}
                            />

                            {/* Indicator for template type */}
                            <div className="absolute top-1 right-1 flex gap-1">
                              {template.background && (
                                <div className="w-4 h-4 bg-blue-500/80 backdrop-blur-sm rounded-full flex items-center justify-center">
                                  <span className="text-xs text-white">B</span>
                                </div>
                              )}
                              {template.overlay && (
                                <div className="w-4 h-4 bg-pink-500/80 backdrop-blur-sm rounded-full flex items-center justify-center">
                                  <span className="text-xs text-white">O</span>
                                </div>
                              )}
                            </div>

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
                            <div className="text-xs text-white/70 mt-1">
                              {template.background && template.overlay ? "BG + Overlay" :
                                template.background ? "Background" : "Overlay"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-2">
                    <div className="w-full flex items-center justify-center h-40 bg-gradient-to-br from-indigo-800/30 to-purple-800/30 rounded-2xl border border-indigo-500/30">
                      <div className="text-center">
                        <ImageIcon className="w-12 h-12 text-white mx-auto mb-2 opacity-50" />
                        <p className="text-white">Không có mẫu khung ảnh cho kiểu khung này</p>
                      </div>
                    </div>
                  </div>
                )}
              </Slider>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end w-full px-16 pb-20 z-10">
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