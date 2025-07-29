"use client";

import StoreBackground from "@/app/components/StoreBackground";
import StoreHeader from "@/app/components/StoreHeader";
import { useBooth } from "@/lib/context/BoothContext";
import { useDialog } from "@/lib/context/DialogContext";
import { FrameTemplate } from "@/lib/models/FrameTemplate";
import { cn } from "@/lib/utils";
import { uploadImage, uploadVideo } from "@/lib/utils/universalUpload";
import { ChevronLeft, ChevronRight, ImageIcon, Loader2, Printer, Sparkles } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
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
    colorAdjust?: string;
    webkitPrintColorAdjust?: string;
    printColorAdjust: string;
  }
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
    setVideoQrCode,
    setGifQrCode,
    videos,
    currentStore,
    selectedQuantity,
    
  } = useBooth();

  const activeSkinFilter = useMemo(() => {
    return skinFilters.find(filter => filter.id === selectedFilter.id) || skinFilters[0];
  }, [selectedFilter]);

  const [frameTemplates, setFrameTemplates] = useState<FrameTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [mediaSessionCode, setMediaSessionCode] = useState<string>("");
  const [mediaSessionUrl, setMediaSessionUrl] = useState<string>("");

  // Tối ưu thời gian xử lý bằng cách xử lý song song và cache
  const [isProcessing, setIsProcessing] = useState(false);

  // Ref to track active video elements for cleanup
  const activeVideoElementsRef = useRef<Set<HTMLVideoElement>>(new Set());

  // Helper function to check browser support for video recording
  const checkVideoRecordingSupport = (): boolean => {
    try {
      if (!MediaRecorder) {
        console.error('MediaRecorder API not supported');
        return false;
      }

      // Check for HTMLCanvasElement.captureStream support
      const canvas = document.createElement('canvas');
      if (!canvas.captureStream) {
        console.error('Canvas.captureStream not supported');
        return false;
      }

      // Check for basic codec support
      const supportedFormats = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4'
      ];

      const hasSupportedFormat = supportedFormats.some(format => 
        MediaRecorder.isTypeSupported(format)
      );

      if (!hasSupportedFormat) {
        console.error('No supported video formats for recording');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking video recording support:', error);
      return false;
    }
  };

  // Helper function để đánh giá khả năng phần cứng
  const getHardwareCapabilities = () => {
    const cores = navigator.hardwareConcurrency || 4;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const memory = (navigator as any).deviceMemory || 4; // GB - deviceMemory is experimental API
    
    let tier = 'medium';
    if (cores < 4 || memory < 4) {
      tier = 'low';
    } else if (cores >= 8 && memory >= 8) {
      tier = 'high';
    }
    
    console.log(`Hardware assessment: ${tier} (${cores} cores, ${memory}GB RAM)`);
    
    return {
      tier,
      cores,
      memory,
      recommendedFPS: tier === 'low' ? 15 : tier === 'high' ? 30 : 20,
      recommendedBitrate: tier === 'low' ? 2000000 : tier === 'high' ? 8000000 : 4000000,
      recommendedTimeout: tier === 'low' ? 6 : tier === 'high' ? 10 : 8
    };
  };

  // Use hardware capabilities để tối ưu hóa performance
  const hardwareCapabilities = getHardwareCapabilities();

  // Helper function to cleanup video elements
  const cleanupVideoElement = (video: HTMLVideoElement) => {
    try {
      video.pause();
      video.removeAttribute('src');
      video.load(); // Reset the video element
      // Remove all event listeners
      video.onloadedmetadata = null;
      video.oncanplaythrough = null;
      video.onerror = null;
      video.onended = null;
      video.onplay = null;
      video.onpause = null;
      activeVideoElementsRef.current.delete(video);
    } catch (error) {
      console.warn("Error cleaning up video element:", error);
    }
  };

  const printPreviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      if (selectedFrame?.id) {
        try {
          const response = await fetch(`/api/frame-templates?frameTypeId=${selectedFrame.id}`);
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



  useEffect(() => {
    const initializeMediaSession = async () => {
      if (photos && photos.length > 0) {
        try {
          const response = await fetch('/api/media-session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              storeId: currentStore?.id || null
            })
          });

          if (response.ok) {
            const session = await response.json();
            setMediaSessionCode(session.sessionCode);

            // Lưu session code vào localStorage để step9 sử dụng
            localStorage.setItem("mediaSessionCode", session.sessionCode);

            // Tạo URL cho session
            const baseUrl = typeof window !== 'undefined' ?
              `${window.location.protocol}//${window.location.host}` : '';
            const sessionUrl = `${baseUrl}/session/${session.sessionCode}`;
            setMediaSessionUrl(sessionUrl);

            console.log("Media session created:", session.sessionCode, sessionUrl);
          } else {
            console.error("Failed to create media session:", response.status, await response.text());
          }
        } catch (error) {
          console.error("Error creating media session:", error);
        }
      }
    };

    initializeMediaSession();
  }, [photos, currentStore]);

  // Cleanup effect - Stop all video elements when component unmounts
  useEffect(() => {
    return () => {
      console.log("Step 8 cleanup: Stopping all active video elements");
      // Copy ref value to avoid stale closure
      const activeVideos = activeVideoElementsRef.current;
      // Stop and cleanup all active video elements
      activeVideos.forEach(video => {
        cleanupVideoElement(video);
      });
      activeVideos.clear();
    };
  }, [cleanupVideoElement]);

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



  // Convert data URL to file
  const dataURLtoFile = (dataURL: string, filename: string): File => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };


  const handlePrint = async () => {
    showDialog({
      header: "Thông báo",
      content: "Vui lòng đợi trong giây lát, ảnh đang được tạo...",
    });
    setIsProcessing(true);

    try {
      const previewContent = printPreviewRef.current;
      if (!previewContent) {
        alert('Không tìm thấy nội dung để in');
        setIsProcessing(false);
        return;
      }

      const currentSessionCode = mediaSessionCode || localStorage.getItem("mediaSessionCode");
      if (!currentSessionCode) {
        try {
          const response = await fetch('/api/media-session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              storeId: currentStore?.id || null
            })
          });

          if (response.ok) {
            const session = await response.json();
            setMediaSessionCode(session.sessionCode);
            localStorage.setItem("mediaSessionCode", session.sessionCode);

            const baseUrl = typeof window !== 'undefined' ?
              `${window.location.protocol}//${window.location.host}` : '';
            const sessionUrl = `${baseUrl}/session/${session.sessionCode}`;
            setMediaSessionUrl(sessionUrl);

          } else {
          }
        } catch (error) {
          console.error("Error creating emergency media session:", error);
        }
      }

      const isCustomFrame = selectedFrame?.isCustom === true;
      const isLandscape = isCustomFrame ? false :
        (selectedFrame && selectedFrame.columns && selectedFrame.rows ?
          selectedFrame.columns > selectedFrame.rows : false);

      try {
        const processTasks = [];

        // Create image processing task
        const imageTask = (async () => {
          try {
            const imageDataUrl = await generateHighQualityImage(isLandscape);
            if (!imageDataUrl) {
              throw new Error("Không thể tạo ảnh");
            }

            const imageFile = dataURLtoFile(imageDataUrl, "photobooth.jpg");
            const imageUrl = await uploadImage(imageFile);

            setImageQrCode(imageUrl);
            localStorage.setItem("imageQrCode", imageUrl);

            fetch("http://localhost:4000/api/print", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                "filePath": imageUrl,
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

            return imageUrl; // Return the URL for later use
          } catch (error) {
            console.error("Error processing image:", error);
            return null;
          }
        })();
        processTasks.push(imageTask);

        // Create 3 processing tasks: Image, Normal Video, Fast Video (2s)
        if (videos && videos.length > 0) {
          const videoTask = (async () => {
            try {
              console.log('Starting video generation...');
              const videoUrl = await generateSmoothVideo(isLandscape);
              if (videoUrl) {
                console.log('Video generation successful, uploading...');
                const serverUrl = await uploadVideo(videoUrl);
                setVideoQrCode(serverUrl);
                localStorage.setItem("videoQrCode", serverUrl);
                console.log('Video uploaded successfully:', serverUrl);
                return serverUrl; // Return the URL for later use
              } else {
                console.error("Failed to generate video - no URL returned");
                // Don't fail the entire process, just log the error
                return null;
              }
            } catch (error) {
              console.error("Error processing video:", error);
              // Show user-friendly error but don't stop the entire process
              console.warn("Video creation failed, continuing with other media types");
              return null;
            }
          })();
          processTasks.push(videoTask);

          const fastVideoTask = (async () => {
            try {
              console.log('Starting fast video generation...');
              const fastVideoUrl = await generateFastVideo(isLandscape);
              if (fastVideoUrl) {
                console.log('Fast video generation successful, uploading...');
                const serverUrl = await uploadVideo(fastVideoUrl);
                setGifQrCode(serverUrl); // Reuse GIF state for fast video
                localStorage.setItem("gifQrCode", serverUrl);
                console.log('Fast video uploaded successfully:', serverUrl);
                return serverUrl; // Return the URL for later use
              } else {
                console.error("Failed to generate fast video - no URL returned");
                return null;
              }
            } catch (error) {
              console.error("Error processing fast video:", error);
              console.warn("Fast video creation failed, continuing with other media types");
              return null;
            }
          })();
          processTasks.push(fastVideoTask);
        }

        const results = await Promise.all(processTasks);

        // Xử lý kết quả dựa trên số lượng tasks
        let uploadedImageUrl = null;
        let uploadedVideoUrl = null;
        let uploadedFastVideoUrl = null;

        if (videos && videos.length > 0) {
          // Có cả image, video và fast video tasks
          [uploadedImageUrl, uploadedVideoUrl, uploadedFastVideoUrl] = results;
        } else {
          // Chỉ có image task
          [uploadedImageUrl] = results;
        }

        // Cập nhật media session với các URLs đã upload
        const currentSessionCode = mediaSessionCode || localStorage.getItem("mediaSessionCode");
        if (currentSessionCode) {
          try {
            const updateData: {
              sessionCode: string;
              imageUrl?: string;
              videoUrl?: string;
              gifUrl?: string;
            } = {
              sessionCode: currentSessionCode,
            };

            if (uploadedImageUrl) updateData.imageUrl = uploadedImageUrl;
            if (uploadedVideoUrl) updateData.videoUrl = uploadedVideoUrl;
            if (uploadedFastVideoUrl) updateData.gifUrl = uploadedFastVideoUrl; // Use gifUrl for fast video

            const updateResponse = await fetch('/api/media-session', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(updateData)
            });

            if (updateResponse.ok) {
              console.log("Media session updated successfully with URLs:", {
                image: uploadedImageUrl,
                video: uploadedVideoUrl,
                fastVideo: uploadedFastVideoUrl
              });
            } else {
              console.error("Failed to update media session:", await updateResponse.text());
            }
          } catch (error) {
            console.error("Error updating media session:", error);
          }
        }
        hideDialog();
        setTimeout(() => {
          router.push("/step/step9");
        }, 500);

      } catch (error) {
        console.error("Lỗi khi xử lý và tải lên:", error);
        alert(`Có lỗi xảy ra: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Lỗi khi xử lý:", error);
      alert(`Có lỗi xảy ra: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
      setIsProcessing(false);
    } finally {
      setIsProcessing(false);

    }
  };
  const preloadImages = async (images: HTMLImageElement[]): Promise<void> => {
    const promises = Array.from(images).map((img) => {
      if (img.complete && img.naturalWidth !== 0) {
        return Promise.resolve();
      }
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
        if (img.src) img.src = img.src;
      });
    });
    await Promise.all(promises);
  };
  const convertFilterToCanvasString = (className: string): string => {
    return className
      .split(" ")
      .map((cls) => {
        if (cls === "sepia") {
          return "sepia(100%)";
        } else if (cls === "grayscale") {
          return "grayscale(100%)";
        } else if (cls === "invert") {
          return "invert(100%)";
        } else if (cls.includes("-")) {
          const [prop, val] = cls.split("-");
          if (["brightness", "contrast", "saturate"].includes(prop)) {
            return `${prop}(${val}%)`;
          } else if (prop === "blur") {
            return `${prop}(${val}px)`;
          } else if (prop === "hue-rotate") {
            return `hue-rotate(${val}deg)`;
          }
        }
        return "";
      })
      .filter(Boolean)
      .join(" ");
  };

  const generateSmoothVideo = async (isLandscape: boolean): Promise<string | void> => {
    // This function creates a normal quality video (8-10 seconds, 30fps, 8Mbps)
    // Rendering logic synchronized with generateFastVideo and generateHighQualityImage
    console.log('=== Starting generateSmoothVideo ===');
    try {
      // Check browser support first
      if (!checkVideoRecordingSupport()) {
        console.error('Browser does not support video recording');
        throw new Error("Trình duyệt không hỗ trợ tạo video. Vui lòng sử dụng Chrome, Firefox hoặc Edge.");
      }

      const previewContent = printPreviewRef.current;
      if (!previewContent) {
        console.error('No preview content found');
        alert('Không tìm thấy nội dung để xử lý video');
        return;
      }

      if (!videos || videos.length === 0) {
        console.error('No videos available');
        alert("Không có video để xử lý.");
        return;
      }

      console.log('Video count:', videos.length);

      const isCustomFrame = selectedFrame?.isCustom === true;
      const desiredWidth = isLandscape ? 3600 : 2400;  // Same as generateHighQualityImage
      const desiredHeight = isLandscape ? 2400 : 3600; // Same as generateHighQualityImage


      const rect = previewContent.getBoundingClientRect();

      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = desiredWidth;
      outputCanvas.height = desiredHeight;
      const outputCtx = outputCanvas.getContext('2d', {
        alpha: true,
        desynchronized: false
      });

      if (!outputCtx) {
        throw new Error("Không thể tạo video canvas context");
      }

      outputCtx.imageSmoothingEnabled = true;
      outputCtx.imageSmoothingQuality = 'high';

      // Giảm FPS cho máy yếu, tăng FPS cho máy mạnh
      const fps = hardwareCapabilities.recommendedFPS;
      const stream = outputCanvas.captureStream(fps);
      
      // Try different codecs for better browser support
      let mediaRecorder;
      let selectedMimeType = '';
      
      // Điều chỉnh bitrate dựa trên khả năng phần cứng
      let videoBitsPerSecond = hardwareCapabilities.recommendedBitrate;

      try {
        // Thử các codec theo thứ tự ưu tiên
        const codecOptions = [
          { mimeType: 'video/webm;codecs=vp9', bitrate: videoBitsPerSecond },
          { mimeType: 'video/webm;codecs=vp8', bitrate: Math.min(videoBitsPerSecond, 6000000) },
          { mimeType: 'video/webm', bitrate: Math.min(videoBitsPerSecond, 6000000) },
          { mimeType: 'video/mp4', bitrate: Math.min(videoBitsPerSecond, 6000000) }
        ];

        for (const option of codecOptions) {
          if (MediaRecorder.isTypeSupported(option.mimeType)) {
            selectedMimeType = option.mimeType;
            videoBitsPerSecond = option.bitrate;
            mediaRecorder = new MediaRecorder(stream, {
              mimeType: option.mimeType,
              videoBitsPerSecond: option.bitrate,
            });
            console.log(`Using codec: ${option.mimeType} with bitrate: ${option.bitrate}`);
            break;
          }
        }

        if (!mediaRecorder) {
          // Fallback không có codec cụ thể
          mediaRecorder = new MediaRecorder(stream, {
            videoBitsPerSecond: Math.min(videoBitsPerSecond, 4000000), // Giảm bitrate cho tương thích
          });
          selectedMimeType = 'video/webm'; // Default
          console.log('Using default MediaRecorder without specific codec');
        }
      } catch (error) {
        console.error("Error creating MediaRecorder:", error);
        throw new Error("Không thể tạo MediaRecorder. Trình duyệt không hỗ trợ.");
      }

      const recordedChunks: Blob[] = [];
      let dataIntervalId: NodeJS.Timeout | null = null;
      let hasRecordedData = false;

      mediaRecorder.ondataavailable = (e) => {
        console.log('Data available:', e.data.size, 'bytes');
        if (e.data && e.data.size > 0) {
          recordedChunks.push(e.data);
          hasRecordedData = true;
        }
      };

      mediaRecorder.addEventListener('start', () => {
        console.log('MediaRecorder started successfully');
        hasRecordedData = false;
        
        // Yêu cầu dữ liệu thường xuyên hơn để tránh mất chunks
        dataIntervalId = setInterval(() => {
          if (mediaRecorder.state === 'recording') {
            try {
              mediaRecorder.requestData();
            } catch (error) {
              console.warn('Error requesting data:', error);
            }
          } else {
            if (dataIntervalId) {
              clearInterval(dataIntervalId);
              dataIntervalId = null;
            }
          }
        }, 500); // Giảm từ 1000ms xuống 500ms để thu thập chunks thường xuyên hơn
      });

      mediaRecorder.addEventListener('error', (e) => {
        console.error('MediaRecorder error:', e);
        if (dataIntervalId) {
          clearInterval(dataIntervalId);
          dataIntervalId = null;
        }
      });

      const processedVideoPromise = new Promise<string>((resolve, reject) => {
        const stopTimeout = setTimeout(() => {
          console.warn('Video processing timeout - forcing resolution with existing data');
          if (recordedChunks.length > 0) {
            const finalBlob = new Blob(recordedChunks, {
              type: selectedMimeType || 'video/webm'
            });
            if (finalBlob.size > 0) {
              const processedVideoUrl = URL.createObjectURL(finalBlob);
              resolve(processedVideoUrl);
              return;
            }
          }
          reject(new Error('Video processing timeout - no valid data'));
        }, 30000); // 30 giây timeout

        mediaRecorder.onstop = () => {
          clearTimeout(stopTimeout);
          if (dataIntervalId) {
            clearInterval(dataIntervalId);
            dataIntervalId = null;
          }
          
          console.log('MediaRecorder stopped, processing chunks:', recordedChunks.length);
          
          // Kiểm tra nếu không có chunks nhưng có dữ liệu
          if (recordedChunks.length === 0) {
            console.error('No video chunks recorded!');
            
            // Thử yêu cầu dữ liệu cuối cùng
            if (hasRecordedData) {
              console.log('Attempting final data request...');
              setTimeout(() => {
                if (recordedChunks.length > 0) {
                  const finalBlob = new Blob(recordedChunks, {
                    type: selectedMimeType || 'video/webm'
                  });
                  if (finalBlob.size > 0) {
                    const processedVideoUrl = URL.createObjectURL(finalBlob);
                    resolve(processedVideoUrl);
                    return;
                  }
                }
                reject(new Error('Không thể ghi dữ liệu video. Vui lòng thử lại.'));
              }, 1000);
              return;
            }
            
            reject(new Error('Không thể ghi dữ liệu video. Vui lòng thử lại.'));
            return;
          }
          
          const finalBlob = new Blob(recordedChunks, {
            type: selectedMimeType || 'video/webm'
          });
          console.log(`Video file size: ${(finalBlob.size / (1024 * 1024)).toFixed(2)} MB`);
          
          if (finalBlob.size === 0) {
            console.error('Video blob is empty!');
            reject(new Error('Dữ liệu video trống. Vui lòng thử lại.'));
            return;
          }
          
          const processedVideoUrl = URL.createObjectURL(finalBlob);
          console.log('Video URL created successfully');
          resolve(processedVideoUrl);
        };
      });

      const previewCanvas = document.createElement('canvas');
      previewCanvas.width = rect.width;
      previewCanvas.height = rect.height;
      const previewCtx = previewCanvas.getContext('2d', {
        alpha: true,
        desynchronized: false
      });

      if (!previewCtx) {
        throw new Error("Không thể tạo preview canvas context");
      }

      previewCtx.imageSmoothingEnabled = true;
      previewCtx.imageSmoothingQuality = 'high';

      const cellIndices = selectedFrame?.isCustom
        ? Array.from({ length: selectedFrame.rows }, (_, i) => i)
        : Array.from({ length: selectedFrame!.columns * selectedFrame!.rows }, (_, i) => i);

      const cellVideoMap = new Map<number, HTMLVideoElement>();
      const photoToVideoMap = new Map<number, string>();

      // Create video mapping
      if (videos.length > 0) {
        const selectedPhotoIndices = selectedIndices.filter(idx => idx !== undefined) as number[];

        for (let i = 0; i < selectedPhotoIndices.length; i++) {
          const photoIndex = selectedPhotoIndices[i];
          if (photoIndex < videos.length) {
            photoToVideoMap.set(photoIndex, videos[photoIndex]);
          }
        }
      }

      for (const idx of cellIndices) {
        if (selectedIndices[idx] !== undefined) {
          const photoIndex = selectedIndices[idx]!;
          let videoUrl: string | undefined = undefined;

          if (photoToVideoMap.has(photoIndex)) {
            videoUrl = photoToVideoMap.get(photoIndex);
          } else if (photoIndex < videos.length) {
            videoUrl = videos[photoIndex];
          }

          if (videoUrl) {
            console.log(`Loading video ${idx}:`, videoUrl);
            const videoElement = document.createElement('video');
            videoElement.src = videoUrl;
            videoElement.muted = true;
            videoElement.playsInline = true;
            videoElement.preload = 'auto'; // Preload for smoother playback
            videoElement.setAttribute('playsinline', ''); // iOS support
            videoElement.style.objectFit = 'cover';
            videoElement.style.width = '100%';
            videoElement.style.height = '100%';

            videoElement.crossOrigin = "anonymous";

            activeVideoElementsRef.current.add(videoElement);

            await new Promise<void>((resolve) => {
              let resolved = false;
              
              const resolveOnce = () => {
                if (!resolved) {
                  resolved = true;
                  resolve();
                }
              };

              videoElement.setAttribute('poster', '');
              videoElement.oncanplay = resolveOnce;
              videoElement.oncanplaythrough = resolveOnce;
              videoElement.onloadedmetadata = () => {
                if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
                  console.log(`Video ${idx} loaded with dimensions: ${videoElement.videoWidth}x${videoElement.videoHeight}`);
                  resolveOnce();
                }
              };

              videoElement.onerror = (error) => {
                console.error(`Error loading video ${idx}:`, error);
                resolveOnce();
              };

              // Increase timeout for video loading
              setTimeout(resolveOnce, 8000); // Increased from 3000 to 8000
            });
            
            cellVideoMap.set(idx, videoElement);
            console.log(`Video ${idx} loaded successfully`);
          }
        }
      }

      let backgroundImg: HTMLImageElement | null = null;
      let backgroundValid = false;
      if (selectedTemplate?.background) {
        backgroundImg = document.createElement('img');
        backgroundImg.crossOrigin = "anonymous";

        await new Promise<void>((resolve) => {
          backgroundImg!.onload = () => {
            backgroundValid = true;
            resolve();
          };
          backgroundImg!.onerror = (error) => {
            console.error("Error loading background image:", error);
            backgroundValid = false;
            resolve();
          };
          setTimeout(() => {
            if (!backgroundValid) {
              backgroundValid = false;
            }
            resolve();
          }, 10000); // Increase timeout to 10 seconds

          backgroundImg!.src = selectedTemplate.background;
          if (backgroundImg!.complete && backgroundImg!.naturalWidth > 0) {
            backgroundValid = true;
            resolve();
          }
        });
      }

      let overlayImg: HTMLImageElement | null = null;
      let overlayValid = false;
      if (selectedTemplate?.overlay) {
        overlayImg = document.createElement('img');
        overlayImg.crossOrigin = "anonymous";

        await new Promise<void>((resolve) => {
          overlayImg!.onload = () => {
            overlayValid = true;
            resolve();
          };
          overlayImg!.onerror = (error) => {
            console.error('Error loading overlay image:', error);
            overlayValid = false;
            resolve();
          };
          setTimeout(() => {
            if (!overlayValid) {
              overlayValid = false;
            }
            resolve();
          }, 10000);

          overlayImg!.src = selectedTemplate.overlay;
          if (overlayImg!.complete && overlayImg!.naturalWidth > 0) {
            overlayValid = true;
            resolve();
          }
        });
      }
      // Start videos with better error handling
      console.log('Starting videos, total count:', cellVideoMap.size);
      const videoStartPromises = Array.from(cellVideoMap.values()).map(async (video, index) => {
        try {
          console.log(`Starting video ${index}...`);
          video.loop = true;
          
          // Add a small delay between video starts to prevent browser overwhelm
          await new Promise(resolve => setTimeout(resolve, index * 100));
          
          const playPromise = video.play();
          if (playPromise !== undefined) {
            await playPromise;
            console.log(`Video ${index} started successfully`);
          }
          return true;
        } catch (e) {
          console.error(`Error starting video ${index}:`, e);
          // Try to recover by setting a different currentTime
          try {
            video.currentTime = 0;
            await video.play();
            console.log(`Video ${index} recovered and started`);
            return true;
          } catch (retryError) {
            console.error(`Retry failed for video ${index}:`, retryError);
            return false;
          }
        }
      });

      const startResults = await Promise.all(videoStartPromises);
      const successfulStarts = startResults.filter(Boolean).length;
      console.log(`Successfully started ${successfulStarts}/${cellVideoMap.size} videos`);
      
      if (successfulStarts === 0) {
        throw new Error("Không thể phát bất kỳ video nào. Vui lòng thử lại.");
      }
      // Enhanced safety check before starting recording
      console.log('MediaRecorder state before start:', mediaRecorder.state);
      if (mediaRecorder.state !== 'inactive') {
        console.warn('MediaRecorder is not in inactive state, resetting...');
        try {
          mediaRecorder.stop();
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (resetError) {
          console.warn('Error resetting MediaRecorder:', resetError);
        }
      }

      // Đợi video ổn định trước khi bắt đầu recording
      await new Promise(resolve => setTimeout(resolve, 1000)); // Tăng thời gian đợi
      
      console.log('Starting MediaRecorder...');
      
      // Kiểm tra lại trạng thái trước khi start
      if (mediaRecorder.state === 'inactive') {
        try {
          // Bắt đầu với timeslice nhỏ hơn để thu chunks thường xuyên
          mediaRecorder.start(250); // Giảm từ 1000ms xuống 250ms
          console.log('MediaRecorder started with state:', mediaRecorder.state);
        } catch (startError) {
          console.error('Error starting MediaRecorder:', startError);
          throw new Error("Không thể bắt đầu ghi video. Vui lòng thử lại.");
        }
      } else {
        throw new Error("MediaRecorder không thể bắt đầu - trạng thái không hợp lệ");
      }

      let frameCount = 0;
      const targetFPS = hardwareCapabilities.recommendedFPS; // Sử dụng hardware capabilities
      const frameInterval = 1000 / targetFPS;
      let lastTime = performance.now();
      const recordingStartTime = performance.now();

      // Store initial positions and dimensions for consistency - FIX: Use correct cell selection logic
      const cellPositions = new Map();

      const gridContainer = selectedFrame?.isCustom
        ? previewContent.querySelector('.grid-cols-1')
        : previewContent.querySelector('.grid');

      console.log('Video Generation - Frame type:', selectedFrame?.isCustom ? 'Custom' : 'Regular', 'Grid container found:', !!gridContainer);
      console.log('Video Preview canvas size:', previewCanvas.width, 'x', previewCanvas.height);
      console.log('Video Output canvas size:', outputCanvas.width, 'x', outputCanvas.height);

      if (gridContainer) {
        if (selectedFrame?.isCustom) {
          const cellElements = Array.from(gridContainer.children);
          cellElements.forEach((cell, idx) => {
            if (cellVideoMap.has(idx)) {
              const cellRect = cell.getBoundingClientRect();
              const relativeLeft = cellRect.left - rect.left;
              const relativeTop = cellRect.top - rect.top;

              cellPositions.set(idx, {
                left: relativeLeft,
                top: relativeTop,
                width: cellRect.width,
                height: cellRect.height
              });
            }
          });
        } else {
          // For regular frames: need to handle the nested column structure
          const columnElements = Array.from(gridContainer.children);
          columnElements.forEach((column, colIdx) => {
            const cellsInColumn = Array.from(column.children);
            cellsInColumn.forEach((cellContainer, rowIdx) => {
              // Find the actual cell div inside the container
              const cell = cellContainer.querySelector('div[class*="aspect-"]');
              if (cell) {
                // Calculate correct index: colIdx + (rowIdx * columns)
                const cellIdx = colIdx + (rowIdx * selectedFrame!.columns);

                if (cellVideoMap.has(cellIdx)) {
                  const cellRect = cell.getBoundingClientRect();
                  const relativeLeft = cellRect.left - rect.left;
                  const relativeTop = cellRect.top - rect.top;

                  cellPositions.set(cellIdx, {
                    left: relativeLeft,
                    top: relativeTop,
                    width: cellRect.width,
                    height: cellRect.height
                  });
                }
              }
            });
          });
        }
      }

      const renderFrame = () => {
        const now = performance.now();
        const elapsedTime = (now - recordingStartTime) / 1000; // Thời gian đã trôi qua tính bằng giây

        // Check if MediaRecorder is still recording
        if (mediaRecorder.state !== 'recording') {
          console.log('MediaRecorder stopped, ending frame rendering. Final state:', mediaRecorder.state);
          return;
        }

        // Throttle frame rate for consistency
        if (now - lastTime < frameInterval) {
          requestAnimationFrame(renderFrame);
          return;
        }
        lastTime = now;

        // Tăng thời gian timeout cho máy yếu
        const maxDuration = hardwareCapabilities.recommendedTimeout;
        
        if (elapsedTime > maxDuration) {
          console.log(`Timeout reached (${maxDuration}s), stopping recording. Frame count:`, frameCount);
          if (mediaRecorder.state === 'recording') {
            try {
              mediaRecorder.requestData();
              setTimeout(() => {
                if (mediaRecorder.state === 'recording') {
                  mediaRecorder.stop();
                }
              }, 100);
            } catch (stopError) {
              console.warn('Error stopping MediaRecorder on timeout:', stopError);
            }
          }
          return;
        }

        const anyPlaying = Array.from(cellVideoMap.values()).some(
          (video) => !video.ended && !video.paused && video.currentTime > 0
        );

        // Handle end of all videos more gracefully
        // Đảm bảo có đủ thời gian recording tối thiểu
        const minRecordingTime = hardwareCapabilities.tier === 'low' ? 2 : 3;
        
        if (!anyPlaying && elapsedTime > minRecordingTime) {
          console.log('All videos finished, stopping recording. Elapsed time:', elapsedTime.toFixed(2), 's');
          if (mediaRecorder.state === 'recording') {
            try {
              mediaRecorder.requestData();
              setTimeout(() => {
                if (mediaRecorder.state === 'recording') {
                  mediaRecorder.stop();
                }
              }, 100);
            } catch (stopError) {
              console.warn('Error stopping MediaRecorder when videos finished:', stopError);
            }
          }
          return;
        }

        // Log progress every 30 frames (once per second at 30fps)
        if (frameCount % Math.max(1, targetFPS) === 0) {
          console.log(`Recording progress: ${elapsedTime.toFixed(1)}s, anyPlaying: ${anyPlaying}, videos: ${Array.from(cellVideoMap.values()).map(v => !v.ended && !v.paused).join(',')}`);
        }

        // Always draw the background regardless of video state
        // Clear canvases efficiently with white background
        previewCtx.fillStyle = "#FFFFFF";
        previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
        outputCtx.fillStyle = "#FFFFFF";
        outputCtx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);

        // Reset context state before drawing
        previewCtx.filter = "none";
        previewCtx.globalCompositeOperation = "source-over";

        // Draw background image first if available - ALWAYS draw this
        if (backgroundImg && backgroundValid) {
          try {
            previewCtx.drawImage(backgroundImg, 0, 0, previewCanvas.width, previewCanvas.height);
          } catch (e) {
            console.error("Error drawing background image in video:", e);
          }
        }

        // Use stored cell positions for consistent rendering
        cellIndices.forEach((idx) => {
          if (!cellVideoMap.has(idx) || !cellPositions.has(idx)) return;

          const cellData = cellPositions.get(idx);
          const videoElement = cellVideoMap.get(idx)!;

          // Only render ready frames to avoid stuttering
          if (videoElement.readyState >= 2) {
            // Save context for clipping and filter
            previewCtx.save();
            
            // Apply filter optimally - Use same function as fast video and generateHighQualityImage
            if (selectedFilter?.className) {
              const filterString = convertFilterToCanvasString(selectedFilter.className);
              previewCtx.filter = filterString;
            } else {
              previewCtx.filter = "none";
            }

            // Create clipping path for the cell area - handle circle frame
            if (selectedFrame?.isCircle) {
              // For circle frame, create circular clipping path
              const centerX = cellData.left + cellData.width / 2;
              const centerY = cellData.top + cellData.height / 2;
              const radius = Math.min(cellData.width, cellData.height) / 2;

              previewCtx.beginPath();
              previewCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
              previewCtx.clip();
            } else {
              // Regular rectangular clipping
              previewCtx.beginPath();
              previewCtx.rect(cellData.left, cellData.top, cellData.width, cellData.height);
              previewCtx.clip();
            }

            // Calculate proper aspect ratio for video (like object-fit: cover)
            const videoAspectRatio = videoElement.videoWidth / videoElement.videoHeight;
            const cellAspectRatio = cellData.width / cellData.height;

            let drawWidth = cellData.width;
            let drawHeight = cellData.height;
            let offsetX = cellData.left;
            let offsetY = cellData.top;

            if (videoAspectRatio > cellAspectRatio) {
              // Video is wider than cell - fit height and crop width
              drawHeight = cellData.height;
              drawWidth = drawHeight * videoAspectRatio;
              offsetX = cellData.left - (drawWidth - cellData.width) / 2;
            } else {
              // Video is taller than cell - fit width and crop height
              drawWidth = cellData.width;
              drawHeight = drawWidth / videoAspectRatio;
              offsetY = cellData.top - (drawHeight - cellData.height) / 2;
            }

            previewCtx.drawImage(videoElement, offsetX, offsetY, drawWidth, drawHeight);
            previewCtx.restore(); // Restore context (removes clipping and filter)
            previewCtx.filter = "none";
          }
        });

        // Draw overlay if available - Reset context state first
        previewCtx.filter = "none";
        previewCtx.globalCompositeOperation = "source-over";
        if (overlayImg && overlayValid) {
          try {
            // Draw overlay at the top layer to ensure it's always visible
            previewCtx.drawImage(overlayImg, 0, 0, previewCanvas.width, previewCanvas.height);
          } catch (e) {
            console.error("Error drawing overlay image:", e);
          }
        }

        // Copy to output canvas (same logic as generateHighQualityImage)
        if (isCustomFrame) {
          // Custom frame: Render two identical images side by side for 6x4 layout (no aspect ratio adjustment)
          const singleImageWidth = desiredWidth / 2;
          const singleImageHeight = desiredHeight;

          // Draw first image (left) - full size like in generateHighQualityImage
          outputCtx.drawImage(previewCanvas, 0, 0, previewCanvas.width, previewCanvas.height, 0, 0, singleImageWidth, singleImageHeight);

          // Draw second image (right) - exact duplicate with no gap
          const rightX = Math.round(singleImageWidth);
          outputCtx.drawImage(previewCanvas, 0, 0, previewCanvas.width, previewCanvas.height, rightX, 0, singleImageWidth, singleImageHeight);
        } else {
          // Regular frame: Render a single image centered and scaled (same as generateHighQualityImage)
          const aspectRatio = previewCanvas.width / previewCanvas.height;
          const targetAspectRatio = desiredWidth / desiredHeight;

          console.log('Video normal - aspect ratio debug:', {
            previewSize: `${previewCanvas.width}x${previewCanvas.height}`,
            outputSize: `${desiredWidth}x${desiredHeight}`,
            aspectRatio: aspectRatio.toFixed(3),
            targetAspectRatio: targetAspectRatio.toFixed(3),
            isLandscape,
            difference: Math.abs(aspectRatio - targetAspectRatio).toFixed(3)
          });

          // Calculate dimensions to maintain proper aspect ratio
          let drawWidth = desiredWidth;
          let drawHeight = desiredHeight;
          let offsetX = 0;
          let offsetY = 0;

          if (aspectRatio > targetAspectRatio) {
            drawHeight = desiredWidth / aspectRatio;
            offsetY = (desiredHeight - drawHeight) / 2;
            console.log('Video normal - adding top/bottom margins:', offsetY);
          } else {
            drawWidth = desiredHeight * aspectRatio;
            offsetX = (desiredWidth - drawWidth) / 2;
            console.log('Video normal - adding left/right margins:', offsetX);
          }

          outputCtx.drawImage(previewCanvas, 0, 0, previewCanvas.width, previewCanvas.height, offsetX, offsetY, drawWidth, drawHeight);
        }

        frameCount++;
        requestAnimationFrame(renderFrame);
      };

      requestAnimationFrame(renderFrame);

      // Enhanced timeout handling với retry mechanism
      const videoDuration = Math.min(
        10, // Max 10 seconds to match TIMEOUT_DURATION
        Math.max(
          ...Array.from(cellVideoMap.values()).map(v => v.duration || 0)
        ) + 1 // Add one second to the longest video to ensure we capture everything
      );

      // Tính toán thời gian recording phù hợp với khả năng máy
      const baseTimeout = hardwareCapabilities.recommendedTimeout;
      const recordingTimeout = hardwareCapabilities.tier === 'low'
        ? Math.min(baseTimeout * 0.6, Math.max(4, videoDuration)) // Máy yếu: giảm thời gian
        : Math.min(baseTimeout, Math.max(6, videoDuration)); // Máy bình thường

      console.log(`Calculated recording timeout: ${recordingTimeout}s based on hardware: ${hardwareCapabilities.cores} cores`);

      // Force loop videos to ensure content plays throughout the recording time
      Array.from(cellVideoMap.values()).forEach((video, index) => {
        video.loop = true; // Set videos to loop so they don't end prematurely
        
        // Add error handling for video playback issues
        video.addEventListener('error', (e) => {
          console.error(`Video ${index} encountered an error:`, e);
        });
        
        video.addEventListener('stalled', () => {
          console.warn(`Video ${index} stalled, attempting to resume`);
          try {
            video.currentTime = video.currentTime; // Force refresh
          } catch (error) {
            console.warn('Could not refresh video currentTime:', error);
          }
        });

        // Thêm listener để kiểm tra video đã sẵn sàng chưa
        video.addEventListener('canplay', () => {
          console.log(`Video ${index} is ready to play`);
        });
      });

      const timeoutId = setTimeout(() => {
        console.log(`Stopping video recording after ${recordingTimeout} seconds`);
        try {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.requestData(); // Request final chunk before stopping
            setTimeout(() => {
              if (mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
              }
            }, 200); // Đợi 200ms để đảm bảo có data
          }
        } catch (error) {
          console.error('Error stopping MediaRecorder:', error);
        }
      }, recordingTimeout * 1000);

      let result;
      try {
        result = await processedVideoPromise;
        console.log('Video processing completed successfully');
      } catch (videoError) {
        console.error('Video processing failed:', videoError);
        
        // Thử lần cuối với dữ liệu hiện có
        if (recordedChunks.length > 0) {
          console.log('Attempting to recover with existing chunks:', recordedChunks.length);
          const recoveryBlob = new Blob(recordedChunks, {
            type: selectedMimeType || 'video/webm'
          });
          if (recoveryBlob.size > 1024) { // Ít nhất 1KB
            const recoveryUrl = URL.createObjectURL(recoveryBlob);
            console.log('Recovery successful, using partial video data');
            result = recoveryUrl;
          } else {
            throw videoError; // Re-throw nếu không thể khôi phục
          }
        } else {
          throw videoError;
        }
      }

      // Clear the timeout if recording finished early
      clearTimeout(timeoutId);

      // Cleanup video elements after processing
      Array.from(cellVideoMap.values()).forEach((video, index) => {
        try {
          video.pause();
          video.removeAttribute('src');
          video.load();
          activeVideoElementsRef.current.delete(video);
          console.log(`Cleaned up video ${index}`);
        } catch (error) {
          console.warn(`Error cleaning up video ${index} after smooth video generation:`, error);
        }
      });

      console.log('Video generation completed successfully');
      return result;

    } catch (error) {
      console.error("=== Error in generateSmoothVideo ===");
      console.error("Error details:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');

      // Cleanup any video elements that were created
      activeVideoElementsRef.current.forEach(video => {
        try {
          video.pause();
          video.removeAttribute('src');
          video.load();
        } catch (cleanupError) {
          console.warn("Error cleaning up video after smooth video error:", cleanupError);
        }
      });
      activeVideoElementsRef.current.clear();

      // More specific error messages - không bắt buộc phải có video
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('mediarecorder') || errorMessage.includes('không thể tạo mediarecorder')) {
          console.warn("Video MediaRecorder error - may be browser compatibility issue");
          // Không throw error, để tiếp tục với image generation
          return;
        } else if (errorMessage.includes('không hỗ trợ') || errorMessage.includes('not supported')) {
          console.warn("Video recording not supported in this browser");
          return;
        } else if (errorMessage.includes('no video data') || errorMessage.includes('no video chunks')) {
          console.warn("Video failed to record data - may be hardware limitation");
          return;
        } else if (errorMessage.includes('timeout')) {
          console.warn("Video generation timeout - may be slow hardware");
          return;
        } else {
          console.error(`Video generation failed: ${error.message}`);
          // Show user notification but don't stop the entire process
          setTimeout(() => {
            alert("⚠️ Không thể tạo video chất lượng cao do giới hạn phần cứng. Sẽ tiếp tục tạo ảnh.");
          }, 100);
          return;
        }
      } else {
        console.error("Unknown video generation error");
        return;
      }
    }
  };
const generateFastVideo = async (isLandscape: boolean): Promise<string | void> => {
  console.log('=== Starting generateFastVideo ===');
  try {
    // Check browser support first
    if (!checkVideoRecordingSupport()) {
      console.error('Browser does not support video recording');
      throw new Error("Trình duyệt không hỗ trợ tạo video. Vui lòng sử dụng Chrome, Firefox hoặc Edge.");
    }

    const previewContent = printPreviewRef.current;
    if (!previewContent) {
      console.error('No preview content found');
      alert('Không tìm thấy nội dung để xử lý video');
      return;
    }

    if (!videos || videos.length === 0) {
      console.error('No videos available');
      alert("Không có video để xử lý.");
      return;
    }

    console.log('Fast video count:', videos.length);

    const isCustomFrame = selectedFrame?.isCustom === true;
    const desiredWidth = isLandscape ? 3600 : 2400;  // Same as generateHighQualityImage
    const desiredHeight = isLandscape ? 2400 : 3600; // Same as generateHighQualityImage

    const rect = previewContent.getBoundingClientRect();
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = desiredWidth;
    outputCanvas.height = desiredHeight;
    const outputCtx = outputCanvas.getContext('2d', {
      alpha: true,
      desynchronized: false
    });

    if (!outputCtx) {
      throw new Error("Không thể tạo video canvas context");
    }

    outputCtx.imageSmoothingEnabled = true;
    outputCtx.imageSmoothingQuality = 'high';

    // Điều chỉnh FPS cho fast video dựa trên khả năng máy
    const fps = Math.max(15, Math.min(hardwareCapabilities.recommendedFPS, 25)); // Fast video có FPS thấp hơn
    const stream = outputCanvas.captureStream(fps);
    
    let mediaRecorder;
    let selectedMimeType = '';
    
    // Điều chỉnh bitrate cho fast video (thấp hơn smooth video)
    let videoBitsPerSecond = Math.min(hardwareCapabilities.recommendedBitrate * 0.5, 3000000);

    try {
      // Thử các codec cho fast video
      const codecOptions = [
        { mimeType: 'video/webm;codecs=vp8', bitrate: videoBitsPerSecond }, // VP8 thường nhanh hơn VP9
        { mimeType: 'video/webm;codecs=vp9', bitrate: videoBitsPerSecond },
        { mimeType: 'video/webm', bitrate: videoBitsPerSecond },
        { mimeType: 'video/mp4', bitrate: Math.min(videoBitsPerSecond, 2000000) }
      ];

      for (const option of codecOptions) {
        if (MediaRecorder.isTypeSupported(option.mimeType)) {
          selectedMimeType = option.mimeType;
          videoBitsPerSecond = option.bitrate;
          mediaRecorder = new MediaRecorder(stream, {
            mimeType: option.mimeType,
            videoBitsPerSecond: option.bitrate,
          });
          console.log(`Fast video using codec: ${option.mimeType} with bitrate: ${option.bitrate}`);
          break;
        }
      }

      if (!mediaRecorder) {
        mediaRecorder = new MediaRecorder(stream, {
          videoBitsPerSecond: Math.min(videoBitsPerSecond, 2000000),
        });
        selectedMimeType = 'video/webm';
        console.log('Fast video using default MediaRecorder');
      }
    } catch (error) {
      console.error("Error creating MediaRecorder:", error);
      throw new Error("Không thể tạo MediaRecorder. Trình duyệt không hỗ trợ.");
    }

    const recordedChunks: Blob[] = [];
    let dataIntervalId: NodeJS.Timeout | null = null;
    let hasRecordedData = false;

    mediaRecorder.ondataavailable = (e) => {
      console.log('Fast video data available:', e.data.size, 'bytes');
      if (e.data && e.data.size > 0) {
        recordedChunks.push(e.data);
        hasRecordedData = true;
      }
    };

    mediaRecorder.addEventListener('start', () => {
      console.log('Fast video MediaRecorder started successfully');
      hasRecordedData = false;
      
      // Thu thập chunks thường xuyên hơn cho fast video
      dataIntervalId = setInterval(() => {
        if (mediaRecorder.state === 'recording') {
          try {
            mediaRecorder.requestData();
          } catch (error) {
            console.warn('Error requesting fast video data:', error);
          }
        } else {
          if (dataIntervalId) {
            clearInterval(dataIntervalId);
            dataIntervalId = null;
          }
        }
      }, 300); // Thường xuyên hơn cho fast video
    });

    mediaRecorder.addEventListener('error', (e) => {
      console.error('Fast video MediaRecorder error:', e);
      if (dataIntervalId) {
        clearInterval(dataIntervalId);
        dataIntervalId = null;
      }
    });

    const processedVideoPromise = new Promise<string>((resolve, reject) => {
      const stopTimeout = setTimeout(() => {
        console.warn('Fast video processing timeout - forcing resolution with existing data');
        if (recordedChunks.length > 0) {
          const finalBlob = new Blob(recordedChunks, {
            type: selectedMimeType || 'video/webm'
          });
          if (finalBlob.size > 0) {
            const processedVideoUrl = URL.createObjectURL(finalBlob);
            resolve(processedVideoUrl);
            return;
          }
        }
        reject(new Error('Fast video processing timeout - no valid data'));
      }, 15000); // 15 giây cho fast video

      mediaRecorder.onstop = () => {
        clearTimeout(stopTimeout);
        if (dataIntervalId) {
          clearInterval(dataIntervalId);
          dataIntervalId = null;
        }
        
        console.log('Fast video MediaRecorder stopped, processing chunks:', recordedChunks.length);
        
        if (recordedChunks.length === 0) {
          console.error('No fast video chunks recorded!');
          
          if (hasRecordedData) {
            console.log('Attempting final data request for fast video...');
            setTimeout(() => {
              if (recordedChunks.length > 0) {
                const finalBlob = new Blob(recordedChunks, {
                  type: selectedMimeType || 'video/webm'
                });
                if (finalBlob.size > 0) {
                  const processedVideoUrl = URL.createObjectURL(finalBlob);
                  resolve(processedVideoUrl);
                  return;
                }
              }
              reject(new Error('Không thể ghi dữ liệu fast video. Vui lòng thử lại.'));
            }, 500);
            return;
          }
          
          reject(new Error('Không thể ghi dữ liệu fast video. Vui lòng thử lại.'));
          return;
        }

        const finalBlob = new Blob(recordedChunks, {
          type: selectedMimeType || 'video/webm'
        });
        console.log(`Fast video file size: ${(finalBlob.size / (1024 * 1024)).toFixed(2)} MB`);

        if (finalBlob.size === 0) {
          console.error('Fast video blob is empty!');
          reject(new Error('Dữ liệu fast video trống. Vui lòng thử lại.'));
          return;
        }

        const processedVideoUrl = URL.createObjectURL(finalBlob);
        console.log('Fast video URL created successfully');
        resolve(processedVideoUrl);
      };
    });

    const previewCanvas = document.createElement('canvas');
    previewCanvas.width = rect.width;
    previewCanvas.height = rect.height;
    const previewCtx = previewCanvas.getContext('2d', {
      alpha: true,
      desynchronized: false
    });

    if (!previewCtx) {
      throw new Error("Không thể tạo preview canvas context");
    }

    previewCtx.imageSmoothingEnabled = true;
    previewCtx.imageSmoothingQuality = 'high';

    const cellIndices = selectedFrame?.isCustom
      ? Array.from({ length: selectedFrame.rows }, (_, i) => i)
      : Array.from({ length: selectedFrame!.columns * selectedFrame!.rows }, (_, i) => i);

    const cellVideoMap = new Map<number, HTMLVideoElement>();
    const photoToVideoMap = new Map<number, string>();

    if (videos.length > 0) {
      const selectedPhotoIndices = selectedIndices.filter(idx => idx !== undefined) as number[];
      for (let i = 0; i < selectedPhotoIndices.length; i++) {
        const photoIndex = selectedPhotoIndices[i];
        if (photoIndex < videos.length) {
          photoToVideoMap.set(photoIndex, videos[photoIndex]);
        }
      }
    }

    for (const idx of cellIndices) {
      if (selectedIndices[idx] !== undefined) {
        const photoIndex = selectedIndices[idx]!;
        let videoUrl: string | undefined = undefined;
        if (photoToVideoMap.has(photoIndex)) {
          videoUrl = photoToVideoMap.get(photoIndex);
        } else if (photoIndex < videos.length) {
          videoUrl = videos[photoIndex];
        }
        if (videoUrl) {
          console.log(`Loading fast video ${idx}:`, videoUrl);
          const videoElement = document.createElement('video');
          videoElement.src = videoUrl;
          videoElement.muted = true;
          videoElement.playsInline = true;
          videoElement.preload = 'auto';
          videoElement.setAttribute('playsinline', '');
          videoElement.style.objectFit = 'cover';
          videoElement.style.width = '100%';
          videoElement.style.height = '100%';
          videoElement.crossOrigin = "anonymous";
          videoElement.playbackRate = 2.0; // 2x speed for fast video
          activeVideoElementsRef.current.add(videoElement);
          await new Promise<void>((resolve) => {
            let resolved = false;
            const resolveOnce = () => {
              if (!resolved) {
                resolved = true;
                resolve();
              }
            };
            videoElement.setAttribute('poster', '');
            videoElement.oncanplay = resolveOnce;
            videoElement.oncanplaythrough = resolveOnce;
            videoElement.onloadedmetadata = () => {
              if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
                console.log(`Fast video ${idx} loaded with dimensions: ${videoElement.videoWidth}x${videoElement.videoHeight}`);
                resolveOnce();
              }
            };
            videoElement.onerror = (error) => {
              console.error(`Error loading fast video ${idx}:`, error);
              resolveOnce();
            };
            setTimeout(resolveOnce, 8000);
          });
          cellVideoMap.set(idx, videoElement);
          console.log(`Fast video ${idx} loaded successfully`);
        }
      }
    }

    let backgroundImg: HTMLImageElement | null = null;
    let backgroundValid = false;
    if (selectedTemplate?.background) {
      backgroundImg = document.createElement('img');
      backgroundImg.crossOrigin = "anonymous";
      await new Promise<void>((resolve) => {
        backgroundImg!.onload = () => {
          backgroundValid = true;
          resolve();
        };
        backgroundImg!.onerror = (error) => {
          console.error("Error loading background image:", error);
          backgroundValid = false;
          resolve();
        };
        setTimeout(() => {
          if (!backgroundValid) {
            backgroundValid = false;
          }
          resolve();
        }, 10000);
        backgroundImg!.src = selectedTemplate.background;
        if (backgroundImg!.complete && backgroundImg!.naturalWidth > 0) {
          backgroundValid = true;
          resolve();
        }
      });
    }

    let overlayImg: HTMLImageElement | null = null;
    let overlayValid = false;
    if (selectedTemplate?.overlay) {
      overlayImg = document.createElement('img');
      overlayImg.crossOrigin = "anonymous";
      await new Promise<void>((resolve) => {
        overlayImg!.onload = () => {
          overlayValid = true;
          resolve();
        };
        overlayImg!.onerror = (error) => {
          console.error('Error loading overlay image:', error);
          overlayValid = false;
          resolve();
        };
        setTimeout(() => {
          if (!overlayValid) {
            overlayValid = false;
          }
          resolve();
        }, 10000);
        overlayImg!.src = selectedTemplate.overlay;
        if (overlayImg!.complete && overlayImg!.naturalWidth > 0) {
          overlayValid = true;
          resolve();
        }
      });
    }

    const videoStartPromises = Array.from(cellVideoMap.values()).map(async (video, index) => {
      try {
        console.log(`Starting fast video ${index}...`);
        video.loop = true;
        video.playbackRate = 2.0;
        await new Promise(resolve => setTimeout(resolve, index * 100));
        const playPromise = video.play();
        if (playPromise !== undefined) {
          await playPromise;
          console.log(`Fast video ${index} started successfully`);
        }
        return true;
      } catch (e) {
        console.error(`Error starting fast video ${index}:`, e);
        try {
          video.currentTime = 0;
          await video.play();
          console.log(`Fast video ${index} recovered and started`);
          return true;
        } catch (retryError) {
          console.error(`Retry failed for fast video ${index}:`, retryError);
          return false;
        }
      }
    });

    const startResults = await Promise.all(videoStartPromises);
    const successfulStarts = startResults.filter(Boolean).length;
    console.log(`Successfully started ${successfulStarts}/${cellVideoMap.size} fast videos`);

    if (successfulStarts === 0) {
      throw new Error("Không thể phát bất kỳ video nào cho video nhanh. Vui lòng thử lại.");
    }

    // Enhanced safety check cho fast video
    console.log('Fast video MediaRecorder state before start:', mediaRecorder.state);
    if (mediaRecorder.state !== 'inactive') {
      console.warn('Fast video MediaRecorder is not in inactive state, resetting...');
      try {
        mediaRecorder.stop();
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (resetError) {
        console.warn('Error resetting fast video MediaRecorder:', resetError);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 800)); // Đợi video ổn định
    console.log('Starting fast video MediaRecorder...');
    
    if (mediaRecorder.state === 'inactive') {
      try {
        mediaRecorder.start(200); // Timeslice ngắn hơn cho fast video
        console.log('Fast video MediaRecorder started with state:', mediaRecorder.state);
      } catch (startError) {
        console.error('Error starting fast video MediaRecorder:', startError);
        throw new Error("Không thể bắt đầu ghi fast video. Vui lòng thử lại.");
      }
    } else {
      throw new Error("Fast video MediaRecorder không thể bắt đầu - trạng thái không hợp lệ");
    }

    let frameCount = 0;
    const targetFPS = hardwareCapabilities.recommendedFPS; // Sử dụng hardware capabilities
    const frameInterval = 1000 / targetFPS;
    let lastTime = performance.now();
    const recordingStartTime = performance.now();

    const cellPositions = new Map();
    const gridContainer = selectedFrame?.isCustom
      ? previewContent.querySelector('.grid-cols-1')
      : previewContent.querySelector('.grid');

    console.log('Fast Video Generation - Frame type:', selectedFrame?.isCustom ? 'Custom' : 'Regular', 'Grid container found:', !!gridContainer);
    console.log('Fast Video Preview canvas size:', previewCanvas.width, 'x', previewCanvas.height);
    console.log('Fast Video Output canvas size:', outputCanvas.width, 'x', outputCanvas.height);

    if (gridContainer) {
      if (selectedFrame?.isCustom) {
        const cellElements = Array.from(gridContainer.children);
        cellElements.forEach((cell, idx) => {
          if (cellVideoMap.has(idx)) {
            const cellRect = cell.getBoundingClientRect();
            const relativeLeft = cellRect.left - rect.left;
            const relativeTop = cellRect.top - rect.top;
            cellPositions.set(idx, {
              left: relativeLeft,
              top: relativeTop,
              width: cellRect.width,
              height: cellRect.height
            });
          }
        });
      } else {
        const columnElements = Array.from(gridContainer.children);
        columnElements.forEach((column, colIdx) => {
          const cellsInColumn = Array.from(column.children);
          cellsInColumn.forEach((cellContainer, rowIdx) => {
            const cell = cellContainer.querySelector('div[class*="aspect-"]');
            if (cell) {
              const cellIdx = colIdx + (rowIdx * selectedFrame!.columns);
              if (cellVideoMap.has(cellIdx)) {
                const cellRect = cell.getBoundingClientRect();
                const relativeLeft = cellRect.left - rect.left;
                const relativeTop = cellRect.top - rect.top;
                cellPositions.set(cellIdx, {
                  left: relativeLeft,
                  top: relativeTop,
                  width: cellRect.width,
                  height: cellRect.height
                });
              }
            }
          });
        });
      }
    }

    const renderFrame = () => {
      const now = performance.now();
      const elapsedTime = (now - recordingStartTime) / 1000;

      if (mediaRecorder.state !== 'recording') {
        console.log('Fast video MediaRecorder stopped, ending frame rendering. Final state:', mediaRecorder.state);
        return;
      }
      
      if (now - lastTime < frameInterval) {
        requestAnimationFrame(renderFrame);
        return;
      }
      lastTime = now;

      // Fast video ngắn hơn: tối đa 3 giây, tối thiểu 1.5 giây
      const maxDuration = hardwareCapabilities.tier === 'low' ? 2.5 : Math.min(hardwareCapabilities.recommendedTimeout, 3);
      
      if (elapsedTime > maxDuration) {
        console.log(`Fast video timeout reached (${maxDuration}s), stopping recording. Frame count:`, frameCount);
        if (mediaRecorder.state === 'recording') {
          try {
            mediaRecorder.requestData();
            setTimeout(() => {
              if (mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
              }
            }, 100);
          } catch (stopError) {
            console.warn('Error stopping fast video MediaRecorder on timeout:', stopError);
          }
        }
        return;
      }

      const anyPlaying = Array.from(cellVideoMap.values()).some(
        (video) => !video.ended && !video.paused && video.currentTime > 0
      );

      const minRecordingTime = hardwareCapabilities.tier === 'low' ? 1.5 : 1.5;
      
      if (!anyPlaying && elapsedTime > minRecordingTime) {
        console.log('All fast videos finished, stopping recording. Elapsed time:', elapsedTime.toFixed(2), 's');
        if (mediaRecorder.state === 'recording') {
          try {
            mediaRecorder.requestData();
            setTimeout(() => {
              if (mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
              }
            }, 100);
          } catch (stopError) {
            console.warn('Error stopping fast video MediaRecorder when videos finished:', stopError);
          }
        }
        return;
      }

      if (frameCount % Math.max(1, targetFPS) === 0) {
        console.log(`Fast video recording progress: ${elapsedTime.toFixed(1)}s, anyPlaying: ${anyPlaying}, videos: ${Array.from(cellVideoMap.values()).map(v => !v.ended && !v.paused).join(',')}`);
      }

      previewCtx.fillStyle = "#FFFFFF";
      previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
      outputCtx.fillStyle = "#FFFFFF";
      outputCtx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);

      previewCtx.filter = "none";
      previewCtx.globalCompositeOperation = "source-over";

      if (backgroundImg && backgroundValid) {
        try {
          previewCtx.drawImage(backgroundImg, 0, 0, previewCanvas.width, previewCanvas.height);
        } catch (e) {
          console.error("Error drawing background image in fast video:", e);
        }
      }

      cellIndices.forEach((idx) => {
        if (!cellVideoMap.has(idx) || !cellPositions.has(idx)) return;
        const cellData = cellPositions.get(idx);
        const videoElement = cellVideoMap.get(idx)!;
        if (videoElement.readyState >= 2) {
          previewCtx.save();
          if (selectedFilter?.className) {
            const filterString = convertFilterToCanvasString(selectedFilter.className);
            previewCtx.filter = filterString;
          } else {
            previewCtx.filter = "none";
          }
          if (selectedFrame?.isCircle) {
            const centerX = cellData.left + cellData.width / 2;
            const centerY = cellData.top + cellData.height / 2;
            const radius = Math.min(cellData.width, cellData.height) / 2;
            previewCtx.beginPath();
            previewCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            previewCtx.clip();
          } else {
            previewCtx.beginPath();
            previewCtx.rect(cellData.left, cellData.top, cellData.width, cellData.height);
            previewCtx.clip();
          }
          const videoAspectRatio = videoElement.videoWidth / videoElement.videoHeight;
          const cellAspectRatio = cellData.width / cellData.height;
          let drawWidth = cellData.width;
          let drawHeight = cellData.height;
          let offsetX = cellData.left;
          let offsetY = cellData.top;
          if (videoAspectRatio > cellAspectRatio) {
            drawHeight = cellData.height;
            drawWidth = drawHeight * videoAspectRatio;
            offsetX = cellData.left - (drawWidth - cellData.width) / 2;
          } else {
            drawWidth = cellData.width;
            drawHeight = drawWidth / videoAspectRatio;
            offsetY = cellData.top - (drawHeight - cellData.height) / 2;
          }
          previewCtx.drawImage(videoElement, offsetX, offsetY, drawWidth, drawHeight);
          previewCtx.restore();
          previewCtx.filter = "none";
        }
      });

      previewCtx.filter = "none";
      previewCtx.globalCompositeOperation = "source-over";
      if (overlayImg && overlayValid) {
        try {
          previewCtx.drawImage(overlayImg, 0, 0, previewCanvas.width, previewCanvas.height);
        } catch (e) {
          console.error("Error drawing overlay image in fast video:", e);
        }
      }

      if (isCustomFrame) {
        const singleImageWidth = desiredWidth / 2;
        const singleImageHeight = desiredHeight;
        outputCtx.drawImage(previewCanvas, 0, 0, previewCanvas.width, previewCanvas.height, 0, 0, singleImageWidth, singleImageHeight);
        const rightX = Math.round(singleImageWidth);
        outputCtx.drawImage(previewCanvas, 0, 0, previewCanvas.width, previewCanvas.height, rightX, 0, singleImageWidth, singleImageHeight);
      } else {
        const aspectRatio = previewCanvas.width / previewCanvas.height;
        const targetAspectRatio = desiredWidth / desiredHeight;
        console.log('Video fast - aspect ratio debug:', {
          previewSize: `${previewCanvas.width}x${previewCanvas.height}`,
          outputSize: `${desiredWidth}x${desiredHeight}`,
          aspectRatio: aspectRatio.toFixed(3),
          targetAspectRatio: targetAspectRatio.toFixed(3),
          isLandscape,
          difference: Math.abs(aspectRatio - targetAspectRatio).toFixed(3)
        });
        let drawWidth = desiredWidth;
        let drawHeight = desiredHeight;
        let offsetX = 0;
        let offsetY = 0;
        if (aspectRatio > targetAspectRatio) {
          drawHeight = desiredWidth / aspectRatio;
          offsetY = (desiredHeight - drawHeight) / 2;
          console.log('Video fast - adding top/bottom margins:', offsetY);
        } else {
          drawWidth = desiredHeight * aspectRatio;
          offsetX = (desiredWidth - drawWidth) / 2;
          console.log('Video fast - adding left/right margins:', offsetX);
        }
        outputCtx.drawImage(previewCanvas, 0, 0, previewCanvas.width, previewCanvas.height, offsetX, offsetY, drawWidth, drawHeight);
      }

      frameCount++;
      requestAnimationFrame(renderFrame);
    };

    requestAnimationFrame(renderFrame);

    // Enhanced timeout handling cho fast video
    const videoDuration = Math.min(
      3, // Tăng từ 2.5 lên 3 giây
      Math.max(
        ...Array.from(cellVideoMap.values()).map(v => (v.duration || 0) / 2) // Account for 2x playback rate
      ) + 0.5
    );
    
    // Tính toán timeout phù hợp với khả năng máy cho fast video
    const baseTimeout = hardwareCapabilities.tier === 'low' ? 2.5 : Math.min(hardwareCapabilities.recommendedTimeout, 3);
    const recordingTimeout = Math.min(
      baseTimeout,
      Math.max(1.5, videoDuration) // Tối thiểu 1.5 giây
    );

    console.log(`Fast video calculated recording timeout: ${recordingTimeout}s for ${hardwareCapabilities.tier} tier hardware`);

    Array.from(cellVideoMap.values()).forEach((video, index) => {
      video.loop = true;
      video.addEventListener('error', (e) => {
        console.error(`Fast video ${index} encountered an error:`, e);
      });
      video.addEventListener('stalled', () => {
        console.warn(`Fast video ${index} stalled, attempting to resume`);
        try {
          video.currentTime = video.currentTime;
        } catch (error) {
          console.warn('Could not refresh fast video currentTime:', error);
        }
      });
      
      // Thêm listener để theo dõi trạng thái video
      video.addEventListener('canplay', () => {
        console.log(`Fast video ${index} is ready to play`);
      });
    });

    const timeoutId = setTimeout(() => {
      console.log(`Stopping fast video recording after ${recordingTimeout} seconds`);
      try {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.requestData();
          setTimeout(() => {
            if (mediaRecorder.state === 'recording') {
              mediaRecorder.stop();
            }
          }, 200);
        }
      } catch (error) {
        console.error('Error stopping fast video MediaRecorder:', error);
      }
    }, recordingTimeout * 1000);

    let result;
    try {
      result = await processedVideoPromise;
      console.log('Fast video processing completed successfully');
    } catch (videoError) {
      console.error('Fast video processing failed:', videoError);
      
      // Thử khôi phục với dữ liệu hiện có
      if (recordedChunks.length > 0) {
        console.log('Attempting to recover fast video with existing chunks:', recordedChunks.length);
        const recoveryBlob = new Blob(recordedChunks, {
          type: selectedMimeType || 'video/webm'
        });
        if (recoveryBlob.size > 512) { // Ít nhất 512 bytes cho fast video
          const recoveryUrl = URL.createObjectURL(recoveryBlob);
          console.log('Fast video recovery successful, using partial video data');
          result = recoveryUrl;
        } else {
          throw videoError;
        }
      } else {
        throw videoError;
      }
    }

    clearTimeout(timeoutId);

    Array.from(cellVideoMap.values()).forEach((video, index) => {
      try {
        video.pause();
        video.removeAttribute('src');
        video.load();
        activeVideoElementsRef.current.delete(video);
        console.log(`Cleaned up fast video ${index}`);
      } catch (error) {
        console.warn(`Error cleaning up fast video ${index} after generation:`, error);
      }
    });

    console.log('Fast video generation completed successfully');
    return result;
  } catch (error) {
    console.error("=== Error in generateFastVideo ===");
    console.error("Error details:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');

    // Cleanup tất cả video elements
    activeVideoElementsRef.current.forEach(video => {
      try {
        video.pause();
        video.removeAttribute('src');
        video.load();
      } catch (cleanupError) {
        console.warn("Error cleaning up video after fast video error:", cleanupError);
      }
    });
    activeVideoElementsRef.current.clear();

    // Thông báo lỗi chi tiết hơn cho người dùng
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      
      if (errorMessage.includes('mediarecorder') || errorMessage.includes('không thể tạo mediarecorder')) {
        console.warn("Fast video MediaRecorder error - may be browser compatibility issue");
        // Không throw error, để tiếp tục với image generation
        return;
      } else if (errorMessage.includes('không hỗ trợ') || errorMessage.includes('not supported')) {
        console.warn("Fast video not supported in this browser");
        return;
      } else if (errorMessage.includes('no video data') || errorMessage.includes('no video chunks')) {
        console.warn("Fast video failed to record data - may be hardware limitation");
        return;
      } else if (errorMessage.includes('timeout')) {
        console.warn("Fast video generation timeout - may be slow hardware");
        return;
      } else {
        console.error(`Fast video generation failed: ${error.message}`);
        return;
      }
    } else {
      console.error("Unknown fast video generation error");
      return;
    }
  }
};
  const generateHighQualityImage = async (isLandscape: boolean): Promise<string | void> => {
    const previewContent = printPreviewRef.current;
    if (!previewContent) return;

    try {
      let sessionUrl = mediaSessionUrl;
      if (!sessionUrl) {
        const sessionCode = localStorage.getItem("mediaSessionCode");
        if (sessionCode) {
          const baseUrl = typeof window !== 'undefined' ?
            `${window.location.protocol}//${window.location.host}` : '';
          sessionUrl = `${baseUrl}/session/${sessionCode}`;
        }
      }

      const isCustomFrame = selectedFrame?.isCustom === true;
      const isSquare = selectedFrame?.columns === selectedFrame?.rows;

      const desiredWidth = isLandscape ? 3600 : 2400;  // Increased for higher quality output
      const desiredHeight = isLandscape ? 2400 : 3600; // Increased for higher quality output

      const rect = previewContent.getBoundingClientRect();
      const scaleFactor = Math.max(
        desiredWidth / rect.width,
        desiredHeight / rect.height,
        4
      );

      const images = previewContent.querySelectorAll("img");
      await preloadImages(Array.from(images));


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
            container.style.backgroundColor = "#FFFFFF";
            container.style.transform = "translateZ(0)";
            container.style.backfaceVisibility = "hidden";
            container.style.position = "relative";
            container.style.overflow = "hidden";

            if (isCustomFrame) {
              container.style.paddingBottom = "10%";
              container.style.paddingTop = "10%";
              container.style.paddingLeft = "10%";
              container.style.paddingRight = "10%";
            } else if (selectedFrame?.isCircle) {
              container.style.paddingTop = "20%";
              container.style.paddingLeft = "5%";
              container.style.paddingRight = "5%";
            } else if (isSquare && (selectedFrame?.columns === 2 || selectedFrame?.columns === 1) && !selectedFrame?.isCircle) {
              container.style.paddingTop = "5%";
              container.style.paddingLeft = "5%";
              container.style.paddingRight = "5%";
            } else {
              container.style.paddingTop = "5%";
              container.style.paddingLeft = isLandscape ? "5%" : "10%";
              container.style.paddingRight = isLandscape ? "5%" : "10%";
            }
            if (selectedFrame?.columns === 2 && selectedFrame?.rows === 3) {
              container.style.paddingRight = "5%";
              container.style.paddingLeft = "5%";
            }
            if (selectedFrame?.columns === 3 && selectedFrame?.rows === 2) {
              container.style.paddingRight = "5%";
              container.style.paddingLeft = "5%";
            }
            if (selectedFrame?.columns === 1 && selectedFrame?.rows === 1 && !selectedFrame?.isCircle) {
              container.style.paddingRight = "5%";
              container.style.paddingLeft = "5%";
            }
            container.style.aspectRatio = isCustomFrame ? "1/3" : (isSquare && selectedFrame?.columns === 1) ? "2/3" : isLandscape ? "3/2" : "2/3";
          }

          const images = clonedDoc.querySelectorAll("img");
          images.forEach((img) => {
            img.style.imageRendering = "crisp-edges";
            img.style.imageRendering = "-webkit-optimize-contrast";
            const imgStyle = img.style as ExtendedCSSStyleDeclaration;
            imgStyle.colorAdjust = "exact";
            imgStyle.webkitPrintColorAdjust = "exact";
            imgStyle.printColorAdjust = "exact";

            if (img.classList.contains('photo-booth-image') && selectedFilter?.className) {
              const filterString = convertFilterToCanvasString(selectedFilter.className);
              img.style.filter = filterString;
              img.style.webkitFilter = filterString;
              img.className = `${img.className.split(' ').filter(cls =>
                !cls.includes('brightness-') &&
                !cls.includes('contrast-') &&
                !cls.includes('saturate-') &&
                !cls.includes('blur-') &&
                !cls.includes('sepia') &&
                !cls.includes('grayscale') &&
                !cls.includes('invert') &&
                !cls.includes('hue-rotate-')
              ).join(' ')} ${selectedFilter.className}`;
            }
          });

          const previewContainer = clonedDoc.querySelector('#photobooth-print-preview');
          if (previewContainer && selectedFilter?.className) {
            const filterString = convertFilterToCanvasString(selectedFilter.className);
            (previewContainer as HTMLElement).style.filter = filterString;
            (previewContainer as HTMLElement).style.webkitFilter = filterString;
            previewContainer.classList.add(...selectedFilter.className.split(' '));
          }

          const backgroundContainer = clonedDoc.querySelector(".pointer-events-none.absolute.inset-0.z-0");
          if (backgroundContainer) {
            const backgroundElement = backgroundContainer.querySelector("img");
            if (backgroundElement) {
              (backgroundElement as HTMLElement).style.objectFit = "contain";
              (backgroundElement as HTMLElement).style.width = "100%";
              (backgroundElement as HTMLElement).style.height = "100%";
            }
          }

          const overlayContainer = clonedDoc.querySelector(".pointer-events-none.absolute.inset-0.z-20");
          if (overlayContainer) {
            const overlayElement = overlayContainer.querySelector("img");
            if (overlayElement) {
              (overlayElement as HTMLElement).style.objectFit = "contain";
              (overlayElement as HTMLElement).style.width = "100%";
              (overlayElement as HTMLElement).style.height = "100%";
            }
          }

          if (isCustomFrame) {
            const gridElement = clonedDoc.querySelector(".grid");
            if (gridElement) {
              gridElement.className = "relative z-10 grid grid-cols-1 gap-[20px]";
            }
          } else {
            const gridElement = clonedDoc.querySelector(".grid");
            if (gridElement && selectedFrame) {
              gridElement.className = "relative z-10 grid gap-[20px]";
              (gridElement as HTMLElement).style.gridTemplateColumns = `repeat(${selectedFrame.columns}, 1fr)`;
            }
          }
        },
      });




      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = desiredWidth;
      finalCanvas.height = desiredHeight;

      const ctx = finalCanvas.getContext("2d", {
        alpha: true,
        willReadFrequently: false,
        desynchronized: false,
      });

      if (!ctx) throw new Error("Cannot create 2D context");

      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, desiredWidth, desiredHeight);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      if (selectedFilter?.className) {
        const filterString = convertFilterToCanvasString(selectedFilter.className);
        ctx.filter = filterString;
      }

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

        const rightX = Math.round(singleImageWidth);
        ctx.drawImage(
          canvas,
          0, 0, canvas.width, canvas.height,
          rightX, 0, singleImageWidth, singleImageHeight
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
      ctx.filter = "none";

      const highQualityImageUrl = finalCanvas.toDataURL("image/jpeg", 0.95); // Increased quality to 0.95
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
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw"
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
          selectedFrame?.isCustom && selectedFrame?.rows == 4 ? "aspect-[4/3]" : selectedFrame?.isCustom && selectedFrame?.rows == 2 ? " aspect-[3/4]" : isSquare && selectedFrame?.columns == 2 ? "aspect-[3/4]" : selectedFrame?.columns == 2 || selectedFrame?.isCircle ? "aspect-square" : isLandscape ? "aspect-[5/4]" : "aspect-[3/4]",
          selectedFrame?.columns === 2 && selectedFrame?.rows === 3 ? "aspect-[13/12]" : "",)}
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
      <div className={cn("relative w-full", commonClasses)} style={{ height: previewHeight, width: selectedFrame.isCustom ? "2.4in" : previewWidth }} >


        <div
          ref={printPreviewRef}
          data-preview
          id="photobooth-print-preview"
          className={cn(
            "flex flex-col gap-4 print-preview photo-booth-preview bg-white px-[5%] ",
            selectedFrame.isCustom ? "pb-[10%] pt-[10%] px-[10%]" :
              isSquare && (selectedFrame.columns == 2 || selectedFrame.columns == 1) && !selectedFrame?.isCircle ? "pt-[5%]" :
                selectedFrame.isCircle ? "pt-[20%]" :
                  isLandscape ? "px-[5%] pt-[5%]" : "px-[5%] pt-[5%]",
            selectedFrame?.isCircle && "px-[5%] pt-[20%]"
          )}
          style={{
            height: previewHeight,
            aspectRatio: selectedFrame.isCustom ? "1/3" : (isSquare && selectedFrame.columns == 1) ? "2/3" : aspectRatio,
          }}
        >
          {frameBackground}
          {selectedFrame.isCustom ? (
            <div className="relative z-10 grid grid-cols-1 gap-[10px]">
              {Array.from({ length: selectedFrame.rows }, (_, idx) => renderCell(idx))}
            </div>
          ) : (
            <div
              className={cn(
                "relative z-10 grid gap-[20px]"
              )}
              style={{
                gridTemplateColumns: `repeat(${selectedFrame.columns}, 1fr)`
              }}
            >
              {Array.from({ length: selectedFrame.columns }, (_, colIdx) => (
                <div key={colIdx} className="flex flex-col gap-[20px]">
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
    <StoreBackground currentStore={currentStore}>
      <StoreHeader
        currentStore={currentStore}
        title="CHỈNH SỬA FILTER"
      />

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
                          className={`relative rounded-2xl overflow-hidden ${selectedTemplate?.id === template.id
                            ? "border-2 border-indigo-400"
                            : "border border-indigo-400/50"
                            }`}
                        >
                          <div className={`relative overflow-hidden bg-gradient-to-br from-indigo-900/50 to-purple-900/50 aspect-square`}>

                            {
                              template.background && (
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
                            {
                              template.overlay && (
                                <Image
                                  src={template.overlay}
                                  alt={template.name}
                                  className="w-full h-full object-cover absolute inset-0"
                                  width={128}
                                  height={128}
                                />
                              )
                            }


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
      <div className="flex justify-end w-full px-16 pb-20 z-10 items-center">
        <div className="rounded-full p-6 bg-transparent border-2">
          {isProcessing ? (
            <div className="w-12 h-12 flex items-center justify-center text-4xl">
              <Loader2 className="animate-spin text-indigo-500" />
            </div>
          ) : (
            <Printer className="w-12 h-12 text-indigo-500" onClick={() => {
              console.time('Tạo ảnh');
              handlePrint();
              console.timeEnd('Tạo ảnh');
            }} />
          )}
        </div>
      </div>


    </StoreBackground>
  );
}