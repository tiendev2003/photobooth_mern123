"use client";

import StoreBackground from "@/app/components/StoreBackground";
import StoreHeader from "@/app/components/StoreHeader";
import { useBooth } from "@/lib/context/BoothContext";
import { useDialog } from "@/lib/context/DialogContext";
import { FrameTemplate } from "@/lib/models/FrameTemplate";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Loader2,
  Printer,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick-theme.css";
import "slick-carousel/slick/slick.css";

// Enhanced filters for skin beautification with server-side processing support
const skinFilters = [
  {
    id: "none",
    name: "Bình thường",
    className: "",
    preview: "/anh/1.png",
    icon: "🌟",
  },
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
  {
    id: "vintage",
    name: "Hoài cổ",
    className: "sepia brightness-90 contrast-110",
    preview: "/anh/6.png",
    icon: "📸",
  },
  // Các filter nâng cao mới
  {
    id: "beauty",
    name: "Làm đẹp",
    className: "brightness-108 contrast-105 saturate-105 blur-[0.5px]",
    preview: "/anh/7.png",
    icon: "💄",
  },
  {
    id: "brightSkin",
    name: "Da sáng bóng",
    className: "brightness-115 contrast-100 saturate-100 blur-[0.3px]",
    preview: "/anh/8.png",
    icon: "✨",
  },
  {
    id: "pinkLips",
    name: "Môi hồng",
    className: "brightness-105 contrast-105 saturate-115",
    preview: "/anh/9.png",
    icon: "💋",
  },
  {
    id: "slimFace",
    name: "Mặt thon",
    className: "brightness-105 contrast-105 saturate-100 blur-[0.4px]",
    preview: "/anh/10.png",
    icon: "😊",
  },
];

export default function Step8() {
  const { showDialog, hideDialog } = useDialog();

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
    currentStore,
    selectedQuantity,
  } = useBooth();

  const activeSkinFilter = useMemo(() => {
    const found = skinFilters.find((filter) => filter.id === selectedFilter.id);
    console.log("Filter debug:", {
      selectedFilterId: selectedFilter.id,
      selectedFilterClassName: selectedFilter.className,
      foundFilter: found,
      willUseDefault: !found,
    });
    return found || skinFilters[0];
  }, [selectedFilter]);

  const [frameTemplates, setFrameTemplates] = useState<FrameTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [mediaSessionCode, setMediaSessionCode] = useState<string>("");

  // Tối ưu thời gian xử lý bằng cách xử lý song song và cache
  const [isProcessing, setIsProcessing] = useState(false);

  // Ref to track active video elements for cleanup
 
  const printPreviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      if (selectedFrame?.id) {
        try {
          const response = await fetch(
            `/api/frame-templates?frameTypeId=${selectedFrame.id}`
          );
          if (response.ok) {
            const data = await response.json();
            console.log("Templates response:", data);

            if (data.data && Array.isArray(data.data)) {
              setFrameTemplates(data.data);

              // Select first template by default if available
              if (data.data.length > 0) {
                setSelectedTemplate(data.data[0]);
                console.log("Selected default template:", data.data[0]);
              }
            } else if (data.templates && Array.isArray(data.templates)) {
              setFrameTemplates(data.templates);

              // Select first template by default if available
              if (data.templates.length > 0) {
                setSelectedTemplate(data.templates[0]);
                console.log("Selected default template:", data.templates[0]);
              }
            } else if (data && Array.isArray(data)) {
              setFrameTemplates(data);

              // Select first template by default if available
              if (data.length > 0) {
                setSelectedTemplate(data[0]);
                console.log("Selected default template:", data[0]);
              }
            } else {
              console.error("Invalid response format:", data);
            }
          } else {
            console.error(
              "Error fetching templates:",
              response.status,
              await response.text()
            );
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

  useEffect(() => {
    const initializeMediaSession = async () => {
      if (photos && photos.length > 0) {
        try {
          const response = await fetch("/api/media-session", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              storeId: currentStore?.id || null,
            }),
          });

          if (response.ok) {
            const session = await response.json();
            setMediaSessionCode(session.sessionCode);

            // Lưu session code vào localStorage để step9 sử dụng
            localStorage.setItem("mediaSessionCode", session.sessionCode);

            // Tạo URL cho session
            const baseUrl =
              typeof window !== "undefined"
                ? `${window.location.protocol}//${window.location.host}`
                : "";
            const sessionUrl = `${baseUrl}/session/${session.sessionCode}`;

            console.log(
              "Media session created:",
              session.sessionCode,
              sessionUrl
            );
          } else {
            console.error(
              "Failed to create media session:",
              response.status,
              await response.text()
            );
          }
        } catch (error) {
          console.error("Error creating media session:", error);
        }
      }
    };

    initializeMediaSession();
  }, [photos, currentStore]);

   

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
          slidesToScroll: 2,
        },
      },
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 2,
        },
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
    ],
  };

  const prevSlide = (sliderRef: React.RefObject<Slider | null>) => {
    sliderRef.current?.slickPrev();
  };

  const nextSlide = (sliderRef: React.RefObject<Slider | null>) => {
    sliderRef.current?.slickNext();
  };

 

  const handlePrint = async () => {
    showDialog({
      header: "Thông báo",
      content: "Vui lòng đợi trong giây lát, ảnh đang được tạo...",
    });
    setIsProcessing(true);

    try {
      // Create media session first
      const currentSessionCode =
        mediaSessionCode || localStorage.getItem("mediaSessionCode");
      if (!currentSessionCode) {
        try {
          const response = await fetch("/api/media-session", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              storeId: currentStore?.id || null,
            }),
          });

          if (response.ok) {
            const session = await response.json();
            setMediaSessionCode(session.sessionCode);
            localStorage.setItem("mediaSessionCode", session.sessionCode);
 
           }
        } catch (error) {
          console.error("Error creating media session:", error);
        }
      }

      // Prepare FormData for image processing
      const imageFormData = new FormData();
      imageFormData.append("frame_type", selectedFrame?.id ?? "1");
      imageFormData.append("mediaSessionCode", currentSessionCode || "");
      imageFormData.append("quantity", selectedQuantity.toString());

      // Convert blob URLs to files and add to FormData
      const selectedPhotos = selectedIndices
        .filter(idx => idx !== undefined)
        .map(idx => photos[idx])
        .filter(photo => photo && photo.image);

      console.log("Selected photos for processing:", selectedPhotos.length);

      // Convert photo blob URLs to files
      for (let i = 0; i < selectedPhotos.length; i++) {
        const photo = selectedPhotos[i];
        try {
          const response = await fetch(photo.image);
          const blob = await response.blob();
          const file = new File([blob], `photo_${i}.jpg`, { type: 'image/jpeg' });
          imageFormData.append("files", file);
        } catch (error) {
          console.error(`Error converting photo ${i}:`, error);
        }
      }

      // Add background if selected template has one
      if (selectedTemplate && selectedTemplate.background) {
        try {
          const response = await fetch(selectedTemplate.background);
          const blob = await response.blob();
          const file = new File([blob], 'background.jpg', { type: 'image/jpeg' });
          imageFormData.append("background", file);
          console.log("Added background to processing");
        } catch (error) {
          console.error("Error converting background:", error);
        }
      }

      // Add overlay if selected template has one
      if (selectedTemplate && selectedTemplate.overlay) {
        try {
          const response = await fetch(selectedTemplate.overlay);
          const blob = await response.blob();
          const file = new File([blob], 'overlay.png', { type: 'image/png' });
          imageFormData.append("overlay", file);
          console.log("Added overlay to processing");
        } catch (error) {
          console.error("Error converting overlay:", error);
        }
      }

      // Call image processing API and wait for result
      const pythonServerUrl = process.env.NEXT_PUBLIC_API_BACKEND || 'http://localhost:4000';
      const imageResponse = await fetch(`${pythonServerUrl}/api/process-image`, {
        method: 'POST',
        body: imageFormData,
      });

      if (!imageResponse.ok) {
        const errorText = await imageResponse.text();
        throw new Error(`Image API Error: ${errorText}`);
      }

      const imageResult = await imageResponse.json();
      console.log("Image API Response:", imageResult);
        fetch("http://localhost:4000/api/print", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                "filePath": pythonServerUrl + imageResult.image,
                "fileName": "photobooth.jpg",
                "printerName": selectedFrame?.isCustom ? "DS-RX1-Cut" : "DS-RX1",
                "quantity": selectedFrame?.isCustom ? selectedQuantity : selectedQuantity * 2 ,
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

      // Update state with image result
      if (imageResult.image) {
        setImageQrCode(imageResult.image);
        localStorage.setItem("imageQrCode", imageResult.image);
      }

      // Lưu thông tin video processing để step9 sử dụng
      if (videos && videos.length > 0) {
        const videoProcessingData = {
          frameType: selectedFrame?.id ?? "1",
          duration: "10",
          mediaSessionCode: currentSessionCode || "",
          hasVideos: true,
          selectedTemplate: selectedTemplate ? {
            background: selectedTemplate.background,
            overlay: selectedTemplate.overlay
          } : null
        };
        localStorage.setItem("videoProcessingData", JSON.stringify(videoProcessingData));
        localStorage.setItem("videosForProcessing", JSON.stringify(videos));
        console.log("Video processing data saved for step9:", videoProcessingData);
      }

      hideDialog();
      setTimeout(() => {
        router.push("/step/step9");
      }, 500);

    } catch (error) {
      console.error("Lỗi khi xử lý:", error);
      hideDialog();
      showDialog({
        header: "Lỗi",
        content: `Có lỗi xảy ra: ${
          error instanceof Error ? error.message : "Lỗi không xác định"
        }`,
      });
      setIsProcessing(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFilterSelect = (filter: (typeof skinFilters)[0]) => {
    const convertedFilter = {
      id: filter.id,
      name: filter.name,
      className: filter.className,
    };
    setSelectedFilter(convertedFilter);
  };

  const renderCell = (idx: number) => {
    const photoIndex = selectedIndices[idx];

    const cellContent =
      photoIndex !== undefined ? (
        <Image
          src={photos[photoIndex].image || "/placeholder.svg"}
          alt={`Slot ${idx}`}
          className={cn(
            "h-full w-full object-cover photo-booth-image",
            activeSkinFilter.className,
            selectedFrame?.isCircle && "rounded-full"
          )}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw"
        />
      ) : (
        <div
          className={cn(
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
    const isLandscape =
      (selectedFrame?.columns ?? 0) > (selectedFrame?.rows ?? 0) &&
      !selectedFrame?.isCustom;
    const isSquare = selectedFrame?.columns === selectedFrame?.rows;
    return (
      <div
        key={idx}
        className={cn(
          baseClass,
          !hasPhoto && emptyClass,
          hasPhoto && "cursor-pointer",
          selectedFrame?.isCustom && selectedFrame?.rows == 4
            ? "aspect-[4/3]"
            : selectedFrame?.isCustom && selectedFrame?.rows == 2
            ? " aspect-[3/4]"
            : isSquare && selectedFrame?.columns == 2
            ? "aspect-[3/4]"
            : selectedFrame?.columns == 2 || selectedFrame?.isCircle
            ? "aspect-square"
            : isLandscape
            ? "aspect-[5/4]"
            : "aspect-[3/4]",
          selectedFrame?.columns === 2 && selectedFrame?.rows === 3
            ? "aspect-[13/12]"
            : ""
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

    const isLandscape =
      selectedFrame.columns > selectedFrame.rows && !selectedFrame.isCustom;
    const isSquare = selectedFrame.columns === selectedFrame.rows;

    const previewHeight = isLandscape ? "4.8in" : "7.2in";
    const previewWidth = isLandscape ? "7.2in" : "4.8in";
    const aspectRatio = isLandscape ? "3/2" : "2/3";

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
      <div
        className={cn("relative w-full", commonClasses)}
        style={{
          height: previewHeight,
          width: selectedFrame.isCustom ? "2.4in" : previewWidth,
        }}
      >
        <div
          ref={printPreviewRef}
          data-preview
          id="photobooth-print-preview"
          className={cn(
            "flex flex-col gap-4 print-preview photo-booth-preview bg-white px-[5%] ",
            selectedFrame.isCustom
              ? "pb-[10%] pt-[10%] px-[10%]"
              : isSquare &&
                (selectedFrame.columns == 2 || selectedFrame.columns == 1) &&
                !selectedFrame?.isCircle
              ? "pt-[5%]"
              : selectedFrame.isCircle
              ? "pt-[20%]"
              : isLandscape
              ? "px-[5%] pt-[5%]"
              : "px-[5%] pt-[5%]",
            selectedFrame?.isCircle && "px-[5%] pt-[20%]"
          )}
          style={{
            height: previewHeight,
            aspectRatio: selectedFrame.isCustom
              ? "1/3"
              : isSquare && selectedFrame.columns == 1
              ? "2/3"
              : aspectRatio,
          }}
        >
          {frameBackground}
          {selectedFrame.isCustom ? (
            <div className="relative z-10 grid grid-cols-1 gap-[10px]">
              {Array.from({ length: selectedFrame.rows }, (_, idx) =>
                renderCell(idx)
              )}
            </div>
          ) : (
            <div
              className={cn("relative z-10 grid gap-[20px]")}
              style={{
                gridTemplateColumns: `repeat(${selectedFrame.columns}, 1fr)`,
              }}
            >
              {Array.from({ length: selectedFrame.columns }, (_, colIdx) => (
                <div key={colIdx} className="flex flex-col gap-[20px]">
                  {Array.from({ length: selectedFrame.rows }, (_, rowIdx) => {
                    // Correctly calculate the index for each cell based on column and row
                    const cellIdx = colIdx + rowIdx * selectedFrame.columns;
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
    const style = document.createElement("style");
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
    <StoreBackground currentStore={currentStore}>
      <StoreHeader currentStore={currentStore} title="CHỈNH SỬA FILTER" />

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
                  <p className="text-xs text-black opacity-80">
                    Chọn hiệu ứng yêu thích
                  </p>
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
                        className={`relative rounded-2xl overflow-hidden ${
                          activeSkinFilter.id === filter.id
                            ? "border-2 border-pink-400"
                            : "border border-purple-400/50"
                        }`}
                      >
                        <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-purple-900/50 to-pink-900/50">
                          {photos && photos.length > 0 ? (
                            <Image
                              src={"/preview.png"}
                              alt={filter.name}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              style={{ objectFit: "cover" }}
                              className={`w-full h-full object-cover ${filter.className}`}
                            />
                          ) : (
                            <Image
                              src={"/preview.png"}
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
                          className={`p-2 text-center ${
                            activeSkinFilter.id === filter.id
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
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                  <ImageIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-black">
                    Mẫu khung ảnh
                  </h3>
                  <p className="text-xs text-black opacity-80">
                    Tùy chỉnh khung cho ảnh
                  </p>
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
                    <div className="bg-gradient-to-br from-indigo800/50 to-purple-800/50 rounded-2xl flex items-center justify-center border border-indigo-500/30 aspect-square">
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
                          className={`relative rounded-2xl overflow-hidden ${
                            selectedTemplate?.id === template.id
                              ? "border-2 border-indigo-400"
                              : "border border-indigo-400/50"
                          }`}
                        >
                          <div
                            className={`relative overflow-hidden bg-gradient-to-br from-indigo-900/50 to-purple-900/50 aspect-square`}
                          >
                            {template.background && (
                              <div className="pointer-events-none absolute inset-0 z-0">
                                <Image
                                  src={template.background}
                                  alt={template.name}
                                  className="h-full w-full object-cover"
                                  width={128}
                                  height={128}
                                />
                              </div>
                            )}
                            {template.overlay && (
                              <Image
                                src={template.overlay}
                                alt={template.name}
                                className="w-full h-full object-cover absolute inset-0"
                                width={128}
                                height={128}
                              />
                            )}

                            {/* Selected indicator */}
                            {selectedTemplate?.id === template.id && (
                              <div className="absolute bottom-1 left-1 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                                <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                              </div>
                            )}
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
                        <p className="text-white">
                          Không có mẫu khung ảnh cho kiểu khung này
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </Slider>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end w-full px-16 pb-20 z-10 items-center">
        <div className="rounded-full p-6 bg-transparent border-2">
          {isProcessing ? (
            <div className="w-12 h-12 flex items-center justify-center text-4xl">
              <Loader2 className="animate-spin text-indigo-500" />
            </div>
          ) : (
            <Printer
              className="w-12 h-12 text-indigo-500"
              onClick={() => {
                console.time("Tạo ảnh");
                handlePrint();
                console.timeEnd("Tạo ảnh");
              }}
            />
          )}
        </div>
      </div>
    </StoreBackground>
  );
}
