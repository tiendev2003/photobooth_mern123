"use client";

import HomeButton from "@/app/components/HomeButton";
import LogoApp from "@/app/components/LogoApp";
import { useBooth } from "@/lib/context/BoothContext";
import { FrameTemplate } from "@/lib/models/FrameTemplate";
import { cn, TIMEOUT_DURATION } from "@/lib/utils";
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
    setVideoQrCode,
    gifQrCode,
    setGifQrCode,
    videos,

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

  // Upload video to server
  const uploadVideo = async (videoUrl: string): Promise<string> => {
    try {
      // Fetch the video blob from the URL
      const response = await fetch(videoUrl);
      const blob = await response.blob();

      // Create a file from the blob
      const file = new File([blob], "photobooth.webm", { type: "video/webm" });

      // Create form data for upload
      const formData = new FormData();
      formData.append("file", file);

      // Upload to server
      const uploadResponse = await fetch("/api/images/video", {
        method: "POST",
        body: formData,
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`,
        }
      });

      if (!uploadResponse.ok) {
        throw new Error(`Video upload failed: ${uploadResponse.statusText}`);
      }

      const data = await uploadResponse.json();
      console.log("Video uploaded successfully:", data);

      // Check response structure and get the URL
      let url = '';
      if (data && data.path) {
        // Direct image object response
        url = data.path;
      } else if (data && data.data && data.data.url) {
        // Nested data structure
        url = data.data.url;
      } else if (data && data.url) {
        // Direct url property
        url = data.url;
      } else {
        console.error("Unexpected response format from video upload:", data);
        throw new Error("Invalid response format from server");
      }

      return url;
    } catch (error) {
      console.error("Error uploading video:", error);
      throw error;
    }
  };

  // Upload GIF to server
  const uploadGif = async (gifUrl: string): Promise<string> => {
    try {
      // Fetch the GIF blob from the URL
      const response = await fetch(gifUrl);
      const blob = await response.blob();

      // Create a file from the blob
      const file = new File([blob], "photobooth.gif", { type: "image/gif" });

      // Create form data for upload
      const formData = new FormData();
      formData.append("file", file);

      // Upload to server
      const uploadResponse = await fetch("/api/images/gif", {
        method: "POST",
        body: formData,
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`,
        }
      });

      if (!uploadResponse.ok) {
        throw new Error(`GIF upload failed: ${uploadResponse.statusText}`);
      }

      const data = await uploadResponse.json();
      console.log("GIF uploaded successfully:", data);

      // Check response structure and get the URL
      let url = '';
      if (data && data.path) {
        // Direct image object response
        url = data.path;
      } else if (data && data.data && data.data.url) {
        // Nested data structure
        url = data.data.url;
      } else if (data && data.url) {
        // Direct url property
        url = data.url;
      } else {
        console.error("Unexpected response format from GIF upload:", data);
        throw new Error("Invalid response format from server");
      }

      return url;
    } catch (error) {
      console.error("Error uploading GIF:", error);
      throw error;
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
        // Process all media types in parallel
        const processTasks = [];

        // Generate and upload image
        const imageTask = (async () => {
          try {
            const imageDataUrl = await generateHighQualityImage(isLandscape);
            if (!imageDataUrl) {
              throw new Error("Không thể tạo ảnh");
            }

            // Convert and upload image
            const imageFile = dataURLtoFile(imageDataUrl, "photobooth.jpg");
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
          } catch (error) {
            console.error("Error processing image:", error);
          }
        })();
        processTasks.push(imageTask);

        // Generate and upload video if videos are available
        if (videos && videos.length > 0) {
          const videoTask = (async () => {
            try {
              console.log("Starting video generation...");
              console.log("Current selected indices:", selectedIndices);
              console.log("Available videos:", videos ? videos.length : 0);

              // Log which videos will be used for which cells
              selectedIndices.forEach((photoIndex, idx) => {
                if (photoIndex !== undefined && photoIndex < videos.length) {
                  console.log(`Cell ${idx} will use photo ${photoIndex} which should map to a video`);
                }
              });

              const videoUrl = await generateSmoothVideo(isLandscape);
              if (videoUrl) {
                console.log("Video generated successfully, uploading to server...");
                const serverUrl = await uploadVideo(videoUrl);
                setVideoQrCode(serverUrl);
                localStorage.setItem("videoQrCode", serverUrl);
                console.log("Video processed and uploaded successfully");
              } else {
                console.error("Failed to generate video - no URL returned");
              }
            } catch (error) {
              console.error("Error processing video:", error);
            }
          })();
          processTasks.push(videoTask);

          // Generate and upload GIF from video
          const gifTask = (async () => {
            try {
              console.log("Starting GIF generation from video...");
              const gifUrl = await generateGifFromVideo(isLandscape);
              if (gifUrl) {
                console.log("GIF generated successfully, uploading to server...");
                const serverUrl = await uploadGif(gifUrl);
                setGifQrCode(serverUrl);
                localStorage.setItem("gifQrCode", serverUrl);
                console.log("GIF processed and uploaded successfully");
              } else {
                console.error("Failed to generate GIF - no URL returned");
              }
            } catch (error) {
              console.error("Error processing GIF:", error);
            }
          })();
          processTasks.push(gifTask);
        }

        // Wait for all tasks to complete
        await Promise.all(processTasks);

        // Navigate to step 9 after processing is complete
        router.push("/step/step9");
      } catch (error) {
        console.error("Lỗi khi xử lý và tải lên:", error);
        alert(`Có lỗi xảy ra: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        setIsPrinting(false);
      }
    } catch (error) {
      console.error("Lỗi khi xử lý:", error);
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

  // Optimized video generation with smooth playback
  const generateSmoothVideo = async (isLandscape: boolean): Promise<string | void> => {
    try {
      const previewContent = printPreviewRef.current;
      if (!previewContent) {
        alert('Không tìm thấy nội dung để xử lý video');
        return;
      }

      if (!videos || videos.length === 0) {
        alert("Không có video để xử lý.");
        return;
      }

      const isCustomFrame = selectedFrame?.isCustom === true;
      const desiredWidth = isLandscape ? 2400 : 1600;  
      const desiredHeight = isLandscape ? 1600 : 2400;

      
      const rect = previewContent.getBoundingClientRect();

      // Create output canvas for video with optimized settings
      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = desiredWidth;
      outputCanvas.height = desiredHeight;
      const outputCtx = outputCanvas.getContext('2d', {
        alpha: false, // Better performance for opaque content
        desynchronized: true // Allow canvas to render frames out of sync
      });

      if (!outputCtx) {
        throw new Error("Không thể tạo video canvas context");
      }

      // Optimized MediaRecorder settings for smooth recording
      const stream = outputCanvas.captureStream(24); // 24fps for cinematic feel and better performance
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8', // VP8 for better compatibility and performance
        videoBitsPerSecond: 4000000, // 4Mbps - balanced quality/performance
      });

      const recordedChunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunks.push(e.data);
        }
      };

      const processedVideoPromise = new Promise<string>((resolve) => {
        mediaRecorder.onstop = () => {
          const finalBlob = new Blob(recordedChunks, { type: 'video/webm' });
          const processedVideoUrl = URL.createObjectURL(finalBlob);
          resolve(processedVideoUrl);
        };
      });

      // Create preview canvas with proper scaling
      const previewCanvas = document.createElement('canvas');
      previewCanvas.width = rect.width;
      previewCanvas.height = rect.height;
      const previewCtx = previewCanvas.getContext('2d', {
        alpha: false,
        desynchronized: true
      });

      if (!previewCtx) {
        throw new Error("Không thể tạo preview canvas context");
      }

      // Load and prepare all videos
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

      // Load all video elements with proper settings for smooth playback
      for (const idx of cellIndices) {
        if (selectedIndices[idx] !== undefined) {
          const photoIndex = selectedIndices[idx]!
          let videoUrl: string | undefined = undefined;

          if (photoToVideoMap.has(photoIndex)) {
            videoUrl = photoToVideoMap.get(photoIndex);
          } else if (photoIndex < videos.length) {
            videoUrl = videos[photoIndex];
          }

          if (videoUrl) {
            const videoElement = document.createElement('video');
            videoElement.src = videoUrl;
            videoElement.muted = true;
            videoElement.playsInline = true;
            videoElement.preload = 'auto'; // Preload for smoother playback

            await new Promise<void>((resolve) => {
              videoElement.onloadedmetadata = () => {
                console.log(`Video ${photoIndex} loaded for smooth playback, duration: ${videoElement.duration}`);
                resolve();
              };
              videoElement.onerror = () => {
                console.error(`Error loading video ${photoIndex}`);
                resolve();
              };
              setTimeout(() => resolve(), 5000); // Timeout fallback
            });

            cellVideoMap.set(idx, videoElement);
          }
        }
      }

      // Prepare background image if needed
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
          backgroundImg!.onerror = () => {
            backgroundValid = false;
            resolve();
          };
          setTimeout(() => {
            backgroundValid = false;
            resolve();
          }, 5000);

          backgroundImg!.src = `${selectedTemplate.background}?v=${Date.now()}`;
          if (backgroundImg!.complete) {
            backgroundValid = backgroundImg!.naturalWidth > 0 && backgroundImg!.naturalHeight > 0;
            resolve();
          }
        });
      }

      // Prepare overlay if needed
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
          overlayImg!.onerror = () => {
            overlayValid = false;
            resolve();
          };
          setTimeout(() => {
            overlayValid = false;
            resolve();
          }, 5000);

          overlayImg!.src = `${selectedTemplate.overlay}?v=${Date.now()}`;
          if (overlayImg!.complete) {
            overlayValid = overlayImg!.naturalWidth > 0 && overlayImg!.naturalHeight > 0;
            resolve();
          }
        });
      }

      // Start all videos and wait for them to be ready
      console.log("Starting videos for smooth recording...");
      const videoStartPromises = Array.from(cellVideoMap.values()).map(async (video) => {
        try {
          await video.play();
          return true;
        } catch (e) {
          console.error("Error starting video:", e);
          return false;
        }
      });

      await Promise.all(videoStartPromises);
      await new Promise(resolve => setTimeout(resolve, 300)); // Buffer time

      // Start recording
      console.log("Starting optimized video recording...");
      mediaRecorder.start();

      // Optimized rendering with consistent timing
      let frameCount = 0;
      const targetFPS = 24;
      const frameInterval = 1000 / targetFPS;
      let lastTime = performance.now();

      const renderFrame = () => {
        const now = performance.now();

        // Throttle frame rate for consistency
        if (now - lastTime < frameInterval) {
          requestAnimationFrame(renderFrame);
          return;
        }
        lastTime = now;

        const anyPlaying = Array.from(cellVideoMap.values()).some(
          (video) => !video.ended && !video.paused
        );

        if (!anyPlaying) {
          mediaRecorder.stop();
          return;
        }

        // Clear canvases efficiently
        previewCtx.fillStyle = "#FFFFFF";
        previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
        outputCtx.fillStyle = "#FFFFFF";
        outputCtx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
        
        // Draw background image first if available
        if (backgroundImg && backgroundValid && backgroundImg.complete) {
          try {
            if (backgroundImg.naturalWidth > 0 && backgroundImg.naturalHeight > 0) {
              previewCtx.drawImage(backgroundImg, 0, 0, previewCanvas.width, previewCanvas.height);
            }
          } catch (e) {
            console.error("Error drawing background image in video:", e);
          }
        }

        const cells = Array.from(previewContent.querySelectorAll('div[class*="aspect-"]'));

        cells.forEach((cell, idx) => {
          if (!cellVideoMap.has(idx)) return;

          const cellRect = cell.getBoundingClientRect();
          const relativeLeft = cellRect.left - rect.left;
          const relativeTop = cellRect.top - rect.top;
          const videoElement = cellVideoMap.get(idx)!;

          // Only render ready frames to avoid stuttering
          if (videoElement.readyState >= 2) {
            // Apply filter optimally
            if (selectedFilter?.className) {
              const filterString = selectedFilter.className
                .split(" ")
                .filter((cls) => cls.includes("-"))
                .map((cls) => {
                  const [prop, val] = cls.split("-");
                  if (["brightness", "contrast", "saturate"].includes(prop)) {
                    return `${prop}(${val}%)`;
                  }
                  return "";
                })
                .filter(Boolean)
                .join(" ");

              previewCtx.filter = filterString;
            } else {
              previewCtx.filter = "none";
            }

            // Calculate proper aspect ratio for video (like object-fit: cover)
            const videoAspectRatio = videoElement.videoWidth / videoElement.videoHeight;
            const cellAspectRatio = cellRect.width / cellRect.height;

            let drawWidth = cellRect.width;
            let drawHeight = cellRect.height;
            let offsetX = relativeLeft;
            let offsetY = relativeTop;

            if (videoAspectRatio > cellAspectRatio) {
              // Video is wider than cell - fit height and crop width
              drawHeight = cellRect.height;
              drawWidth = drawHeight * videoAspectRatio;
              offsetX = relativeLeft - (drawWidth - cellRect.width) / 2;
            } else {
              // Video is taller than cell - fit width and crop height
              drawWidth = cellRect.width;
              drawHeight = drawWidth / videoAspectRatio;
              offsetY = relativeTop - (drawHeight - cellRect.height) / 2;
            }

            // Save context for clipping
            previewCtx.save();

            // Create clipping path for the cell area - handle circle frame
            if (selectedFrame?.isCircle) {
              // For circle frame, create circular clipping path
              const centerX = relativeLeft + cellRect.width / 2;
              const centerY = relativeTop + cellRect.height / 2;
              const radius = Math.min(cellRect.width, cellRect.height) / 2;

              previewCtx.beginPath();
              previewCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
              previewCtx.clip();
            } else {
              // Regular rectangular clipping
              previewCtx.beginPath();
              previewCtx.rect(relativeLeft, relativeTop, cellRect.width, cellRect.height);
              previewCtx.clip();
            }

            previewCtx.drawImage(
              videoElement,
              offsetX,
              offsetY,
              drawWidth,
              drawHeight
            );

            previewCtx.restore(); // Restore context (removes clipping and filter)
          }
        });

        // Draw overlay if available
        if (overlayImg && overlayValid && overlayImg.complete) {
          try {
            if (overlayImg.naturalWidth > 0 && overlayImg.naturalHeight > 0) {
              previewCtx.drawImage(overlayImg, 0, 0, previewCanvas.width, previewCanvas.height);
            }
          } catch (e) {
           console.error("Error drawing overlay image:", e);
          }
        }

        // Copy to output canvas
        if (isCustomFrame) {
          const singleImageWidth = desiredWidth / 2;
          const singleImageHeight = desiredHeight;
          const aspectRatio = previewCanvas.width / previewCanvas.height;
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

          outputCtx.drawImage(previewCanvas, 0, 0, previewCanvas.width, previewCanvas.height, offsetX, offsetY, drawWidth, drawHeight);
          outputCtx.drawImage(previewCanvas, 0, 0, previewCanvas.width, previewCanvas.height, singleImageWidth + offsetX, offsetY, drawWidth, drawHeight);
        } else {
          const aspectRatio = previewCanvas.width / previewCanvas.height;
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

          outputCtx.drawImage(previewCanvas, 0, 0, previewCanvas.width, previewCanvas.height, offsetX, offsetY, drawWidth, drawHeight);
        }

        frameCount++;
        requestAnimationFrame(renderFrame);
      };
      console.log("Starting video rendering...",frameCount);

      // Start rendering
      requestAnimationFrame(renderFrame);

      // Stop recording after fixed duration
      setTimeout(() => {
        mediaRecorder.stop();
      }, TIMEOUT_DURATION * 1000);

      return processedVideoPromise;

    } catch (error) {
      console.error("Lỗi khi tạo video chất lượng cao:", error);
      alert("❌ Có lỗi xảy ra khi tạo video. Vui lòng thử lại.");
    }
  };

  // Generate GIF from video with optimized settings
  const generateGifFromVideo = async (isLandscape: boolean): Promise<string | void> => {
    try {
      const previewContent = printPreviewRef.current;
      if (!previewContent) {
        alert('Không tìm thấy nội dung để xử lý GIF');
        return;
      }

      if (!videos || videos.length === 0) {
        alert("Không có video để tạo GIF.");
        return;
      }

      // Import gif.js library dynamically
      const GIF = (await import('gif.js')).default;

      const isCustomFrame = selectedFrame?.isCustom === true;
      const desiredWidth = isLandscape ? 2400 : 1600;  
      const desiredHeight = isLandscape ? 1600 : 2400;
      const rect = previewContent.getBoundingClientRect();

      // Create output canvas for GIF
      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = desiredWidth;
      outputCanvas.height = desiredHeight;
      const outputCtx = outputCanvas.getContext('2d');

      if (!outputCtx) {
        throw new Error("Không thể tạo GIF canvas context");
      }

      // Create preview canvas
      const previewCanvas = document.createElement('canvas');
      previewCanvas.width = rect.width;
      previewCanvas.height = rect.height;
      const previewCtx = previewCanvas.getContext('2d');

      if (!previewCtx) {
        throw new Error("Không thể tạo preview canvas context");
      }

      // Initialize GIF encoder with optimized settings
      const gif = new GIF({
        workers: 2,
        quality: 10, // Lower quality for smaller file size
        width: desiredWidth,
        height: desiredHeight,
        workerScript: '/gif.worker.js' // Make sure this file exists in public folder
      });

      // Load and prepare all videos
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

      // Load all video elements
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
            const videoElement = document.createElement('video');
            videoElement.src = videoUrl;
            videoElement.muted = true;
            videoElement.playsInline = true;
            videoElement.preload = 'auto';

            await new Promise<void>((resolve) => {
              videoElement.onloadedmetadata = () => {
                console.log(`Video ${photoIndex} loaded for GIF creation, duration: ${videoElement.duration}`);
                resolve();
              };
              videoElement.onerror = () => {
                console.error(`Error loading video ${photoIndex} for GIF`);
                resolve();
              };
              setTimeout(() => resolve(), 5000);
            });

            cellVideoMap.set(idx, videoElement);
          }
        }
      }

      // Prepare background image if needed
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
          backgroundImg!.onerror = () => {
            backgroundValid = false;
            resolve();
          };
          setTimeout(() => {
            backgroundValid = false;
            resolve();
          }, 5000);

          backgroundImg!.src = `${selectedTemplate.background}?v=${Date.now()}`;
          if (backgroundImg!.complete) {
            backgroundValid = backgroundImg!.naturalWidth > 0 && backgroundImg!.naturalHeight > 0;
            resolve();
          }
        });
      }

      // Prepare overlay if needed
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
          overlayImg!.onerror = () => {
            overlayValid = false;
            resolve();
          };
          setTimeout(() => {
            overlayValid = false;
            resolve();
          }, 5000);

          overlayImg!.src = `${selectedTemplate.overlay}?v=${Date.now()}`;
          if (overlayImg!.complete) {
            overlayValid = overlayImg!.naturalWidth > 0 && overlayImg!.naturalHeight > 0;
            resolve();
          }
        });
      }

      // Start all videos
      console.log("Starting videos for GIF creation...");
      const videoStartPromises = Array.from(cellVideoMap.values()).map(async (video) => {
        try {
          await video.play();
          return true;
        } catch (e) {
          console.error("Error starting video for GIF:", e);
          return false;
        }
      });

      await Promise.all(videoStartPromises);
      await new Promise(resolve => setTimeout(resolve, 300));

      console.log("Starting GIF frame capture...");

      // Capture frames for GIF (shorter duration for smaller file)
      // Reduce duration for custom frames to avoid the glitch at the end
      const gifDuration = isCustomFrame ? 2 : 3; // 2 seconds for custom frames, 3 seconds for regular frames
      const frameRate = 8; // 8 FPS for reasonable file size
      const totalFrames = gifDuration * frameRate;
      const frameInterval = 1000 / frameRate;
      
      // Store first frame data for custom frames (to ensure we can restore it if needed)
      let firstFrameData = null;

      for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
        // Clear canvases
        previewCtx.fillStyle = "#FFFFFF";
        previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
        outputCtx.fillStyle = "#FFFFFF";
        outputCtx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
        
        // Draw background image first if available
        if (backgroundImg && backgroundValid && backgroundImg.complete) {
          try {
            if (backgroundImg.naturalWidth > 0 && backgroundImg.naturalHeight > 0) {
              previewCtx.drawImage(backgroundImg, 0, 0, previewCanvas.width, previewCanvas.height);
            }
          } catch (e) {
            console.error("Error drawing background image in GIF:", e);
          }
        }

        const cells = Array.from(previewContent.querySelectorAll('div[class*="aspect-"]'));

        // Render each cell
        cells.forEach((cell, idx) => {
          if (!cellVideoMap.has(idx)) return;

          const cellRect = cell.getBoundingClientRect();
          const relativeLeft = cellRect.left - rect.left;
          const relativeTop = cellRect.top - rect.top;
          const videoElement = cellVideoMap.get(idx)!;

          if (videoElement.readyState >= 2) {
            // Apply filter
            if (selectedFilter?.className) {
              const filterString = selectedFilter.className
                .split(" ")
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

              previewCtx.filter = filterString;
            } else {
              previewCtx.filter = "none";
            }

            // Draw video frame
            previewCtx.save();
            previewCtx.beginPath();
            if (selectedFrame?.isCircle) {
              const centerX = relativeLeft + cellRect.width / 2;
              const centerY = relativeTop + cellRect.height / 2;
              const radius = Math.min(cellRect.width, cellRect.height) / 2;
              previewCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            } else {
              previewCtx.rect(relativeLeft, relativeTop, cellRect.width, cellRect.height);
            }
            previewCtx.clip();

            // Calculate aspect ratio for video
            const videoAspectRatio = videoElement.videoWidth / videoElement.videoHeight;
            const cellAspectRatio = cellRect.width / cellRect.height;

            let drawWidth = cellRect.width;
            let drawHeight = cellRect.height;
            let offsetX = relativeLeft;
            let offsetY = relativeTop;

            if (videoAspectRatio > cellAspectRatio) {
              // Video is wider than cell - fit height and crop width
              drawHeight = cellRect.height;
              drawWidth = drawHeight * videoAspectRatio;
              offsetX = relativeLeft - (drawWidth - cellRect.width) / 2;
            } else {
              // Video is taller than cell - fit width and crop height
              drawWidth = cellRect.width;
              drawHeight = drawWidth / videoAspectRatio;
              offsetY = relativeTop - (drawHeight - cellRect.height) / 2;
            }

            previewCtx.drawImage(videoElement, offsetX, offsetY, drawWidth, drawHeight);
            previewCtx.restore();
          }
        });

        // Draw overlay if available
        if (overlayImg && overlayValid && overlayImg.complete) {
          try {
            previewCtx.globalCompositeOperation = "source-over";
            previewCtx.drawImage(overlayImg, 0, 0, previewCanvas.width, previewCanvas.height);
          } catch (e) {
            console.error("Error drawing overlay on GIF frame:", e);
          }
        }

        // Copy to output canvas with adjusted positioning
        if (isCustomFrame) {
          const singleImageWidth = desiredWidth / 2;
          const singleImageHeight = desiredHeight;
          const aspectRatio = previewCanvas.width / previewCanvas.height;
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

          // Draw the same content twice side by side (left and right)
          outputCtx.drawImage(previewCanvas, 0, 0, previewCanvas.width, previewCanvas.height, offsetX, offsetY, drawWidth, drawHeight);
          outputCtx.drawImage(previewCanvas, 0, 0, previewCanvas.width, previewCanvas.height, singleImageWidth + offsetX, offsetY, drawWidth, drawHeight);
          
          // Save first frame for custom frames to use later if needed
          if (frameIndex === 0) {
            firstFrameData = outputCtx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
          }
        } else {
          const aspectRatio = previewCanvas.width / previewCanvas.height;
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

          outputCtx.drawImage(previewCanvas, 0, 0, previewCanvas.width, previewCanvas.height, offsetX, offsetY, drawWidth, drawHeight);
        }

        // Add frame to GIF with proper delay
        gif.addFrame(outputCanvas, { 
          delay: frameInterval, 
          copy: true,
          // For custom frames, use shorter delay at the end to reduce glitching
          dispose: isCustomFrame && frameIndex > totalFrames * 0.8 ? 1 : 2 
        });

        // Ensure we're showing progress throughout the GIF
        if (frameIndex % Math.floor(totalFrames / 4) === 0) {
          console.log(`GIF progress: ${Math.round((frameIndex / totalFrames) * 100)}%`);
        }

        // Wait between frames - IMPORTANT: Need to wait for any async operations
        await new Promise(resolve => setTimeout(resolve, frameInterval));
      }

      // For custom frames, add one final static frame that's a duplicate of an early frame
      // This ensures a clean loop without the glitch at the end
      if (isCustomFrame && firstFrameData) {
        // Ensure our final frame is clear
        outputCtx.fillStyle = "#FFFFFF";
        outputCtx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
        
        // Apply the first frame data to ensure a perfect duplicate
        outputCtx.putImageData(firstFrameData, 0, 0);
        
        // Add this frame with a slightly longer duration to pause on this good frame
        gif.addFrame(outputCanvas, { 
          delay: frameInterval * 2,
          copy: true
        });
        
        console.log("Added clean final frame for custom frame GIF");
      }

      console.log("Rendering GIF...");

      // Render GIF and return as blob URL
      return new Promise<string>((resolve, reject) => {
        gif.on('finished', (blob: Blob) => {
          const gifUrl = URL.createObjectURL(blob);
          console.log("GIF creation completed successfully");
          resolve(gifUrl);
        });

        gif.on('error', (...args: unknown[]) => {
          console.error("Error creating GIF:", args);
          reject(new Error("Failed to create GIF"));
        });

        gif.render();
      });

    } catch (error) {
      console.error("Lỗi khi tạo GIF:", error);
      alert("❌ Có lỗi xảy ra khi tạo GIF. Vui lòng thử lại.");
    }
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
        qrCodeElement.style.bottom = '5%';
        qrCodeElement.style.left = isCustomFrame ? '10%' : '5%';
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
            width: 45,
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

            // Apply identical padding as in renderPreview function
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
    console.log(`Rendering cell ${idx} with photo index:`, selectedIndices);

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
        <div className="z-100 text-5xl">{cellContent}</div>
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
          unoptimized
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
          unoptimized
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
            "flex flex-col gap-4 print-preview photo-booth-preview bg-white px-[5%] ",
            selectedFrame.isCustom ? "pb-[10%] pt-[10%] px-[10%]" :
              isSquare && (selectedFrame.columns == 2 || selectedFrame.columns == 1) && !selectedFrame.isCircle ? "pt-[5%]" :
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
            <div className="relative z-10 grid grid-cols-1 gap-[20px]">
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
                          <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-indigo-900/50 to-purple-900/50">
                            {/* Show background if available, otherwise show overlay */}
                            <Image
                              src={template.background || template.overlay || "/placeholder.svg"}
                              alt={template.name}
                              className="w-full h-full object-cover"
                              width={128}
                              height={128}
                              unoptimized
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

      <div className="flex justify-end w-full px-16 pb-20 z-10 gap-6">
        {/* Print button */}
        <button
          onClick={handlePrint}
          className={`rounded-full p-6 bg-transparent border-2 border-white glow-button ${isPrinting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          disabled={isPrinting}
        >
          <div className="w-12 h-12 flex items-center justify-center text-pink-500 text-4xl">
            {isPrinting ? (
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500"></div>
            ) : (
              <Printer size={36} />
            )}
          </div>
          <span className="block text-xs mt-1 text-white">In ảnh</span>
        </button>


      </div>
    </div>
  );
}