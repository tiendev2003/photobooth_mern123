"use client";

import { filterOptions, useBooth } from "@/lib/context/BoothContext";
import { FrameTemplate } from "@/lib/models/FrameTemplate";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, HomeIcon, Printer } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Enhanced filters for skin beautification
const skinFilters = [
  { id: "none", name: "Bình thường", className: "", preview: "/anh/1.png" },
  { id: "soft", name: "Da mềm mịn", className: "brightness-105 contrast-95 saturate-95", preview: "/anh/2.png" },
  { id: "bright", name: "Da sáng", className: "brightness-110 contrast-90 saturate-105", preview: "/anh/3.png" },
  { id: "glow", name: "Da rạng rỡ", className: "brightness-110 contrast-110 saturate-110", preview: "/anh/4.png" },
  { id: "smooth", name: "Da mượt", className: "brightness-105 contrast-90 saturate-95 blur-[0.2px]", preview: "/anh/5.png" },
  { id: "vintage", name: "Hoài cổ", className: "sepia brightness-90 contrast-110", preview: "/anh/6.png" },
  { id: "cool", name: "Mát lạnh", className: "hue-rotate-[-10deg] brightness-105 saturate-90", preview: "/anh/7.png" },
  { id: "warm", name: "Ấm áp", className: "hue-rotate-[10deg] brightness-105 saturate-110", preview: "/anh/8.png" },
];

export default function Step8() {
  const router = useRouter();
  const {
    photos,
    selectedFrame,
    selectedIndices,
    selectedFilter,
    setSelectedFilter,
    selectedTemplate,
    setSelectedTemplate
  } = useBooth();

  const [frameTemplates, setFrameTemplates] = useState<FrameTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printSuccess, setPrintSuccess] = useState(false);

  const skinFilterRef = useRef<HTMLDivElement>(null);
  const frameTemplateRef = useRef<HTMLDivElement>(null);
  const printPreviewRef = useRef<HTMLDivElement>(null);

  // Fetch frame templates for the selected frame type
  useEffect(() => {
    const fetchTemplates = async () => {
      if (selectedFrame?.id) {
        try {
          const response = await fetch(`/api/frame-templates?frameTypeId=${selectedFrame.id}`);
          if (response.ok) {
            const data = await response.json();
            console.log("Fetched frame templates:", data);
            // Check if data contains templates in different possible formats
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

  // Horizontal scroll handlers for carousels
  const scrollCarousel = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (!ref.current) return;

    const scrollAmount = 300;
    const scrollTo = direction === 'left'
      ? ref.current.scrollLeft - scrollAmount
      : ref.current.scrollLeft + scrollAmount;

    ref.current.scrollTo({
      left: scrollTo,
      behavior: 'smooth'
    });
  };


  const handleNext = () => {
    router.push("/step/step9");
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

      // For custom frames, always use landscape orientation (2 strips side by side)
      // For regular frames, check if columns > rows
      const isCustomFrame = selectedFrame?.isCustom === true;
      const isLandscape = isCustomFrame ? true : 
        (selectedFrame && selectedFrame.columns && selectedFrame.rows ?
        selectedFrame.columns > selectedFrame.rows : false);
      
      // Generate high-quality image
      const imageDataUrl = await generateHighQualityImage(isLandscape);
      if (!imageDataUrl) {
        alert('Không thể tạo ảnh để in. Vui lòng thử lại.');
        setIsPrinting(false);
        return;
      }

      // Create download link for the image
      const downloadLink = document.createElement('a');
      downloadLink.href = imageDataUrl;
      downloadLink.download = `photobooth_print_${new Date().getTime()}.jpg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      // Create print window with the image
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Vui lòng cho phép cửa sổ bật lên (popups) cho trang web này');
        setIsPrinting(false);
        return;
      }

      // Set up the print window with proper dimensions for DNP RX1 HS
      const printHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>DNP RX1 Photo Print</title>
            <style>
              @page {
                size: ${isLandscape ? '6in 4in' : '4in 6in'};
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                background-color: white;
                height: 100vh;
              }
              img {
                width: ${isLandscape ? '6in' : '4in'};
                height: ${isLandscape ? '4in' : '6in'};
                object-fit: contain;
                max-width: 100%;
                max-height: 100%;
              }
              /* Add loader styles */
              .loader {
                border: 3px solid #f3f3f3;
                border-radius: 50%;
                border-top: 3px solid #3498db;
                width: 30px;
                height: 30px;
                animation: spin 1s linear infinite;
                position: absolute;
                top: 20px;
                right: 20px;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              /* Removed print message styles */
            </style>
          </head>
          <body>
            <div class="loader" id="print-loader"></div>
            <img src="${imageDataUrl}" alt="Photobooth Print" />
            <script>
              window.onload = function() {
                // Make sure the image is fully loaded
                const img = document.querySelector('img');
                const loader = document.getElementById('print-loader');
                
                function startPrint() {
                  setTimeout(() => {
                    window.print();
                    setTimeout(() => window.close(), 500);
                  }, 500);
                }
                
                if (img.complete) {
                  startPrint();
                } else {
                  img.onload = startPrint;
                  img.onerror = function() {
                    message.textContent = "Lỗi tải ảnh!";
                    loader.style.display = "none";
                  };
                }
              };
            </script>
          </body>
        </html>
      `;

      printWindow.document.open();
      printWindow.document.write(printHTML);
      printWindow.document.close();

      // Show success message
      setTimeout(() => {
        setIsPrinting(false);
        setPrintSuccess(true);

        setTimeout(() => {
          setPrintSuccess(false);
        }, 5000);
      }, 2000);
    } catch (error) {
      console.error("Error during printing:", error);
      setIsPrinting(false);
      alert("Có lỗi xảy ra khi in ảnh: " + (error instanceof Error ? error.message : "Lỗi không xác định"));
    }
  };

  // Function to generate a high-quality image using html2canvas-pro - exact match of renderPreview
  const generateHighQualityImage = async (isLandscape: boolean): Promise<string | void> => {
    const previewContent = printPreviewRef.current;
    if (!previewContent) return;

    try {
      const isCustomFrame = selectedFrame?.isCustom === true;
      
      // Calculate high-resolution dimensions for better print quality (300dpi)
      // For custom frames (2in width), we'll create a 4in width by duplicating side by side
      const desiredWidth = isLandscape ? 1800 : 1200; // 6 inches or 4 inches at 300dpi
      const desiredHeight = isLandscape ? 1200 : 1800; // 4 inches or 6 inches at 300dpi
      
      const rect = previewContent.getBoundingClientRect();
      const scaleFactor = Math.max(desiredWidth / (isCustomFrame ? rect.width * 2 : rect.width), 2); // Adjust scale for custom frames
      
      // Dynamically import html2canvas-pro
      const html2canvas = (await import("html2canvas-pro")).default;

      // Generate high-quality canvas with optimized settings - capture exactly what's in renderPreview
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
        // Only ignore elements that are definitely not part of the visual display
        ignoreElements: (element) => {
          return (
            element.tagName === "SCRIPT" ||
            element.classList?.contains("no-print")
          );
        },
        onclone: (clonedDoc) => {
          // Optimize cloned document for better rendering while preserving exact appearance
          const images = clonedDoc.querySelectorAll("img");
          images.forEach((img) => {
            img.style.imageRendering = "crisp-edges";
            img.style.imageRendering = "-webkit-optimize-contrast";
            // Type assertion for vendor-specific CSS properties
            const imgStyle = img.style as any;
            imgStyle.colorAdjust = "exact";
            imgStyle.webkitPrintColorAdjust = "exact";
            imgStyle.printColorAdjust = "exact";
            
            // Ensure images are fully loaded with original styling preserved
            if (!img.complete || img.naturalWidth === 0) {
              img.style.visibility = "hidden"; // Hide incomplete images instead of removing them
            }
          });

          // Preserve the exact styling of the preview container
          const container = clonedDoc.querySelector(
            "[data-preview]"
          ) as HTMLElement;
          if (container && container.style) {
            container.style.transform = "translateZ(0)";
            container.style.backfaceVisibility = "hidden";
          }
        },
      });

      // Create final canvas with exact dimensions and high quality
      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = desiredWidth;
      finalCanvas.height = desiredHeight;
      const ctx = finalCanvas.getContext("2d", {
        alpha: true, // Use alpha to preserve transparency exactly as in preview
        willReadFrequently: false,
        desynchronized: false,
      });

      if (!ctx) throw new Error("Unable to get 2D context");

      // Fill background with white (as in preview)
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, desiredWidth, desiredHeight);

      // Set high-quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      if (isCustomFrame) {
        // For custom frames, duplicate the image side by side to create a 4in width
        const singleWidth = canvas.width;
        const singleHeight = canvas.height;
        
        // First copy - left side
        ctx.drawImage(
          canvas,
          0, 0, singleWidth, singleHeight,
          0, 0, desiredWidth / 2, desiredHeight
        );
        
        // Second copy - right side
        ctx.drawImage(
          canvas,
          0, 0, singleWidth, singleHeight,
          desiredWidth / 2, 0, desiredWidth / 2, desiredHeight
        );
      } else {
        // Regular frames - draw with proper sizing and positioning
        const aspectRatio = canvas.width / canvas.height;
        const targetAspectRatio = desiredWidth / desiredHeight;

        let drawWidth = desiredWidth;
        let drawHeight = desiredHeight;
        let offsetX = 0;
        let offsetY = 0;

        if (aspectRatio > targetAspectRatio) {
          // Canvas is wider - fit to width
          drawHeight = desiredWidth / aspectRatio;
          offsetY = (desiredHeight - drawHeight) / 2;
        } else {
          // Canvas is taller - fit to height
          drawWidth = desiredHeight * aspectRatio;
          offsetX = (desiredWidth - drawWidth) / 2;
        }

        ctx.drawImage(
          canvas,
          0, 0, canvas.width, canvas.height,
          offsetX, offsetY, drawWidth, drawHeight
        );
      }
      
      // Return high-quality JPEG with maximum quality
      return finalCanvas.toDataURL("image/jpeg", 0.98);
    } catch (error) {
      console.error("Error generating high-quality image:", error);
      alert("❌ Có lỗi xảy ra khi tạo ảnh. Vui lòng thử lại.");
    }
  };

  const handleFilterSelect = (filter: typeof filterOptions[0]) => {
    setSelectedFilter(filter);
  };

  const renderCell = (idx: number) => {
    const photoIndex = selectedIndices[idx];

    if (photoIndex === undefined || !photos[photoIndex]) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center text-gray-400 bg-gray-100/10">
          <span className="text-xs">{"Empty"}</span>
        </div>
      );
    }

    return (
      <img
        src={photos[photoIndex].image}
        alt={`Slot ${idx}`}
        className={cn(
          "h-full w-full object-cover",
          selectedFilter.className
        )}
      />
    );
  };

  const renderPreview = () => {
    if (!selectedFrame) return null;
    const commonClasses = "mx-auto overflow-hidden shadow-md";

    // Kiểm tra nếu columns > rows thì đổi từ 6x4 sang 4x6 inches
    const isLandscape = selectedFrame.columns > selectedFrame.rows && !selectedFrame.isCustom;

    // Xác định kích thước dựa trên hướng (portrait/landscape)
    const previewHeight = isLandscape ? "4in" : "6in";
    const previewWidth = isLandscape ? "6in" : "4in";
    const aspectRatio = isLandscape ? "3/2" : "2/3"; // Đảo ngược tỷ lệ nếu là landscape

    return (
      <div
        className={cn("relative w-full", commonClasses)}
        style={{ height: previewHeight, width: selectedFrame.isCustom ? "2in" : previewWidth }}
      >
        <div
          ref={printPreviewRef}
          data-preview="true"
          id="photobooth-print-preview"
          className={cn(
            "flex flex-col gap-4 p-[10%] print-preview bg-white"
          )}
          style={{
            height: previewHeight,
            aspectRatio: selectedFrame.isCustom ? "1/3 " : aspectRatio,
          }}
        >
          {selectedFrame.isCustom ? (
            <div className="relative z-10 grid grid-cols-1 gap-[5%]">
              {Array.from({ length: 4 }, (_, idx) => (
                <div key={idx} className="aspect-[4/3] overflow-hidden">
                  {renderCell(idx)}
                </div>
              ))}
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
                    const cellIdx = colIdx * selectedFrame.rows + rowIdx;
                    return (
                      <div key={rowIdx} className="aspect-square overflow-hidden">
                        {renderCell(cellIdx)}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="relative flex flex-col items-center justify-between min-h-screen bg-purple-900 text-white overflow-hidden">
      {/* Print Success Message */}
      {printSuccess && (
        <div className="fixed top-20 inset-x-0 z-50 flex justify-center">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in-down flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-lg font-semibold">In ảnh thành công!</span>
            <span className="ml-2 text-sm bg-green-700 px-2 py-1 rounded">Ảnh đã được tải xuống</span>
          </div>
        </div>
      )}

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

      <header className="flex justify-between items-center w-full p-6 z-10">
        <div className="flex items-center">
          <Image
            src="/logo.svg"
            alt="Music Box Photobooth"
            width={150}
            height={50}
            className="glow-image"
          />
        </div>
        <h1 className="text-white text-3xl md:text-5xl lg:text-6xl font-bold text-center tracking-wide">
          CHỈNH SỬA FILTER
        </h1>
        <div className="text-3xl font-bold mr-16">
          <HomeIcon />
        </div>
      </header>

      {/* Main content */}
      <div className="w-full max-w-6xl px-4 md:px-6 mx-auto z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column - Frame preview */}
          <div className="   rounded-lg  flex flex-col items-center justify-center">
            <div className="w-full flex justify-center">
              <div className={`w-full flex ${selectedFrame && selectedFrame.columns > selectedFrame.rows && !selectedFrame.isCustom ? 'max-w-md' : 'max-w-md'} mx-auto`}>
                {renderPreview()}
              </div>
            </div>
          </div>

          {/* Right column - Filter options and Frame Templates */}
          <div className="flex flex-col gap-6">
            {/* Skin Beautifying Filters */}
            <div className="">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold">Bộ lọc làm đẹp da</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => scrollCarousel(skinFilterRef, 'left')}
                    className="p-1 bg-purple-800 hover:bg-purple-700 rounded-full"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={() => scrollCarousel(skinFilterRef, 'right')}
                    className="p-1 bg-purple-800 hover:bg-purple-700 rounded-full"
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>
              </div>

              <div
                ref={skinFilterRef}
                className="flex gap-4 overflow-x-auto hide-scrollbar pb-2 scroll-smooth"
                style={{ scrollBehavior: 'smooth' }}
              >
                {skinFilters.map((filter) => (
                  <div
                    key={filter.id}
                    onClick={() => handleFilterSelect(filter)}
                    className={`flex-shrink-0 w-36 border-2 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${selectedFilter.id === filter.id
                      ? 'border-pink-500 ring-2 ring-pink-500'
                      : 'border-purple-700 hover:border-pink-300'
                      }`}
                  >
                    <div className="aspect-square relative overflow-hidden">
                      {photos && photos.length > 0 ? (
                        <img
                          src={photos[0].image}
                          alt={filter.name}
                          className={`w-full h-full object-cover ${filter.className}`}
                        />
                      ) : (
                        <img
                          src={filter.preview}
                          alt={filter.name}
                          className={`w-full h-full object-cover ${filter.className}`}
                        />
                      )}
                    </div>
                    <div className="bg-purple-900 bg-opacity-70 p-2 text-center">
                      <span className="text-sm">{filter.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Frame Templates */}
            <div className="  ">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold">Mẫu khung ảnh</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => scrollCarousel(frameTemplateRef, 'left')}
                    className="p-1 bg-purple-800 hover:bg-purple-700 rounded-full"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={() => scrollCarousel(frameTemplateRef, 'right')}
                    className="p-1 bg-purple-800 hover:bg-purple-700 rounded-full"
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>
              </div>

              <div
                ref={frameTemplateRef}
                className="flex gap-4 overflow-x-auto hide-scrollbar pb-2 scroll-smooth"
                style={{ scrollBehavior: 'smooth' }}
              >
                {loading ? (
                  <div className="flex-shrink-0 w-36 h-36 bg-purple-800/50 rounded-lg flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500"></div>
                  </div>
                ) : frameTemplates.length > 0 ? (
                  frameTemplates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => setSelectedTemplate(template)}
                      className={`flex-shrink-0 w-36 border-2 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${selectedTemplate?.id === template.id
                        ? 'border-pink-500 ring-2 ring-pink-500'
                        : 'border-purple-700 hover:border-pink-300'
                        }`}
                    >
                      <div className="aspect-square relative overflow-hidden">
                        <img
                          src={template.preview || template.path}
                          alt={template.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="bg-purple-900 bg-opacity-70 p-2 text-center">
                        <span className="text-sm">{template.name}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex-shrink-0 w-full flex items-center justify-center h-36 bg-purple-800/30 rounded-lg">
                    <p className="text-gray-300">Không có mẫu khung ảnh cho kiểu khung này</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-end w-full px-12 pb-16 z-10">
        <button
          onClick={handlePrint}
          className={`rounded-full p-6 bg-transparent border-2 border-pink-500 hover:bg-purple-900 hover:bg-opacity-30 transition glow-button mr-4 ${isPrinting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          disabled={isPrinting}
        >
          <div className="w-12 h-12 flex items-center justify-center text-pink-500 text-4xl">
            {isPrinting ? (
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500"></div>
            ) : (
              <Printer />
            )}
          </div>
        </button>

        <button
          onClick={handleNext}
          className="rounded-full p-6 bg-transparent border-2 border-pink-500 hover:bg-purple-900 hover:bg-opacity-30 transition glow-button"
        >
          <div className="w-12 h-12 flex items-center justify-center text-pink-500 text-4xl">
            <ChevronRight />
          </div>
        </button>
      </div>
    </div>
  );
}
