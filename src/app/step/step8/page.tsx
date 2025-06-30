"use client";

import HomeButton from "@/app/components/HomeButton";
import { filterOptions, useBooth } from "@/lib/context/BoothContext";
import { FrameTemplate } from "@/lib/models/FrameTemplate";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Printer } from "lucide-react";
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
    setSelectedTemplate
  } = useBooth();

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

      // For custom frames, use portrait orientation (vertical strip)
      // For regular frames, check if columns > rows
      const isCustomFrame = selectedFrame?.isCustom === true;
      const isLandscape = isCustomFrame ? false :
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
      return;

      fetch("/api/print", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          base64Image: imageDataUrl,
          isLandscape: isLandscape, // Pass orientation
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
          router.push("/step/step9");
        })
        .catch((error) => {
          console.error("Error submitting print job:", error);
        })
        .finally(() => {
          setIsPrinting(false);
        });
    } catch (error) {
      console.error("Error during printing:", error);
      setIsPrinting(false);
      alert("Có lỗi xảy ra khi in ảnh: " + (error instanceof Error ? error.message : "Lỗi không xác định"));
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

  const generateHighQualityImage = async (isLandscape: boolean): Promise<string | void> => {
    const previewContent = printPreviewRef.current;
    if (!previewContent) return;

    try {
      const isCustomFrame = selectedFrame?.isCustom === true;
      const desiredWidth = isLandscape ? 1800 : 1200;
      const desiredHeight = isLandscape ? 1200 : 1800;
      const rect = previewContent.getBoundingClientRect();
      const scaleFactor = Math.max(desiredWidth / (isCustomFrame ? rect.width * 2 : rect.width), 3);

      // Dynamically import html2canvas-pro
      const html2canvas = (await import("html2canvas-pro")).default;

      // Preload all images
      const images = previewContent.querySelectorAll("img");
      await preloadImages(Array.from(images));

      // Capture the preview area
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
          const images = clonedDoc.querySelectorAll("img");
          images.forEach((img) => {
            // Ensure high-quality rendering
            img.style.imageRendering = "crisp-edges";
            img.style.imageRendering = "-webkit-optimize-contrast";
            const imgStyle = img.style as ExtendedCSSStyleDeclaration;
            imgStyle.colorAdjust = "exact";
            imgStyle.webkitPrintColorAdjust = "exact";
            imgStyle.printColorAdjust = "exact";

            // Apply CSS filters directly as a filter string
            if (selectedFilter?.className) {
              // Convert className to a valid CSS filter string
              const filterString = selectedFilter.className
                .split(" ")
                .filter((cls) => cls.includes("-"))
                .map((cls) => {
                  const [prop, val] = cls.split("-");
                  if (["brightness", "contrast", "saturate"].includes(prop)) {
                    return `${prop}(${val}%)`;
                  } else if (prop === "hue-rotate") {
                    return `${prop}(${val})`;
                  } else if (prop === "blur") {
                    return `${prop}(${val})`;
                  } else if (prop === "sepia") {
                    return `${prop}(1)`; // Sepia is a boolean-like filter in CSS
                  }
                  return "";
                })
                .filter(Boolean)
                .join(" ");
              img.style.filter = filterString;
            }
          });

          const container = clonedDoc.querySelector("[data-preview]") as HTMLElement;
          if (container && container.style) {
            container.style.transform = "translateZ(0)";
            container.style.backfaceVisibility = "hidden";
            container.style.backgroundColor = "#FFFFFF";
          }
        },
      });

      // Create final canvas
      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = desiredWidth;
      finalCanvas.height = desiredHeight;
      const ctx = finalCanvas.getContext("2d", {
        alpha: true,
        willReadFrequently: false,
        desynchronized: false,
      });

      if (!ctx) throw new Error("Không thể tạo 2D context");

      // Fill background with white
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, desiredWidth, desiredHeight);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      if (isCustomFrame) {
        // Custom frame: Render two identical images side by side
        const singleImageWidth = desiredWidth / 2;
        const singleImageHeight = desiredHeight;

        // Calculate dimensions to fit the image
        const aspectRatio = canvas.width / canvas.height;
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
        ctx.drawImage(
          canvas,
          0, 0, canvas.width, canvas.height,
          offsetX, offsetY, drawWidth, drawHeight
        );

        // Draw second image (right)
        ctx.drawImage(
          canvas,
          0, 0, canvas.width, canvas.height,
          singleImageWidth + offsetX, offsetY, drawWidth, drawHeight
        );
      } else {
        // Regular frame: Render a single image
        const aspectRatio = canvas.width / canvas.height;
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

        ctx.drawImage(
          canvas,
          0, 0, canvas.width, canvas.height,
          offsetX, offsetY, drawWidth, drawHeight
        );
      }

      // Return high-quality JPEG data URL
      return finalCanvas.toDataURL("image/jpeg", 0.98);
    } catch (error) {
      console.error("Lỗi khi tạo ảnh chất lượng cao:", error);
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

    // Determine if the frame is landscape (columns > rows) unless it's a custom frame
    const isLandscape = selectedFrame.columns > selectedFrame.rows && !selectedFrame.isCustom;

    // Set dimensions based on orientation (portrait/landscape)
    const previewHeight = isLandscape ? "4in" : "6in";
    const previewWidth = isLandscape ? "6in" : "4in";
    const aspectRatio = isLandscape ? "3/2" : "2/3"; // Reverse aspect ratio for landscape

    // Frame overlay using selectedTemplate (similar to frameOverlay in the second code)
    const frameOverlay = selectedTemplate?.path ? (
      <div className="pointer-events-none absolute inset-0 z-20">
        <Image
          src={selectedTemplate.path}
          alt="Frame Overlay"
          className="h-full w-full object-contain"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
    ) : null;

    return (
      <div
        className={cn("relative w-full", commonClasses)}
        style={{
          height: previewHeight,
          // Custom frames display as 2in preview, but print as two copies for 4in
          width: selectedFrame.isCustom ? "2in" : previewWidth,
          border: selectedFrame.isCustom ? "1px dashed #ff69b4" : "none",
        }}
      >
        {selectedFrame.isCustom && (
          <div className="absolute -right-8 top-1/2 transform -translate-y-1/2 bg-pink-500 text-white px-1 py-3 rounded-r text-xs writing-mode-vertical">
            <span className="transform rotate-180" style={{ writingMode: 'vertical-rl' }}>
              Sẽ in đôi (2x)
            </span>
          </div>
        )}
        <div
          ref={printPreviewRef}
          data-preview="true"
          id="photobooth-print-preview"
          className={cn(
            "flex flex-col gap-4 p-[10%] print-preview bg-white"
          )}
          style={{
            height: previewHeight,
            aspectRatio: selectedFrame.isCustom ? "1/3" : aspectRatio,
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
                gridTemplateColumns: `repeat(${selectedFrame.columns}, 1fr)`,
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
          {frameOverlay}
        </div>
      </div>
    );
  };

  return (
    <div className="relative flex flex-col items-center justify-between min-h-screen bg-purple-900 text-white overflow-hidden">
      {/* Print Success Message */}


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

      <header className="flex justify-between items-start w-full p-6 z-10">
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
        <HomeButton />
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
