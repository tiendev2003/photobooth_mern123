"use client";

import StoreBackground from "@/app/components/StoreBackground";
import StoreHeader from "@/app/components/StoreHeader";
import StoreNavigationButtons from "@/app/components/StoreNavigationButtons";
import { useBooth } from "@/lib/context/BoothContext";
import { FrameTemplate } from "@/lib/models/FrameTemplate";
import { cn, TIMEOUT_DURATION } from "@/lib/utils";
import { uploadGif, uploadImage, uploadVideo } from "@/lib/utils/universalUpload";
import { ChevronLeft, ChevronRight, ImageIcon, Sparkles } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import QRCode from 'qrcode';
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
    currentStore,
    selectedQuantity
  } = useBooth();
  console.log("Step 8 - Current selected frame:", videoQrCode, gifQrCode, imageQrCode, selectedTemplate);

  const activeSkinFilter = useMemo(() => {
    return skinFilters.find(filter => filter.id === selectedFilter.id) || skinFilters[0];
  }, [selectedFilter]);

  const [frameTemplates, setFrameTemplates] = useState<FrameTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [mediaSessionCode, setMediaSessionCode] = useState<string>("");
  const [mediaSessionUrl, setMediaSessionUrl] = useState<string>("");
  const [sessionReady, setSessionReady] = useState(false);

  // Tối ưu thời gian xử lý bằng cách xử lý song song và cache
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  console.log("Step 8 - Session state:", { mediaSessionCode, mediaSessionUrl, sessionReady });


  const printPreviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      if (selectedFrame?.id) {
        try {
          console.log("Fetching templates for frame:", selectedFrame.id);
          const response = await fetch(`/api/frame-templates?frameTypeId=${selectedFrame.id}`);
          if (response.ok) {
            const data = await response.json();
            console.log("Templates response:", data);

            if (data.data && Array.isArray(data.data)) {
              setFrameTemplates(data.data);
              console.log("Set frame templates from data.data:", data.data);

              // Select first template by default if available
              if (data.data.length > 0) {
                setSelectedTemplate(data.data[0]);
                console.log("Selected default template:", data.data[0]);
              }
            } else if (data.templates && Array.isArray(data.templates)) {
              setFrameTemplates(data.templates);
              console.log("Set frame templates from data.templates:", data.templates);

              // Select first template by default if available
              if (data.templates.length > 0) {
                setSelectedTemplate(data.templates[0]);
                console.log("Selected default template:", data.templates[0]);
              }
            } else if (data && Array.isArray(data)) {
              setFrameTemplates(data);
              console.log("Set frame templates from data:", data);

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

  // Log selected template changes
  useEffect(() => {
    if (selectedTemplate) {
      console.log("Selected template changed:", {
        id: selectedTemplate.id,
        name: selectedTemplate.name,
        background: selectedTemplate.background,
        overlay: selectedTemplate.overlay
      });
    }
  }, [selectedTemplate]);

  // Create media session on component mount
  useEffect(() => {
    const initializeMediaSession = async () => {
      if (photos && photos.length > 0) {
        try {
          // Check if we already have a session code
          const existingSessionCode = localStorage.getItem("mediaSessionCode");
          if (existingSessionCode) {
            console.log("Using existing media session code:", existingSessionCode);
            setMediaSessionCode(existingSessionCode);

            // Create URL for existing session
            const baseUrl = typeof window !== 'undefined' ?
              `${window.location.protocol}//${window.location.host}` : '';
            const sessionUrl = `${baseUrl}/session/${existingSessionCode}`;
            setMediaSessionUrl(sessionUrl);
            setSessionReady(true);
            return;
          }

          // Tạo session mới trong database
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
            setSessionReady(true);

            console.log("Media session created:", session.sessionCode, sessionUrl);
          } else {
            console.error("Failed to create media session:", response.status, await response.text());
            setSessionReady(false);
          }
        } catch (error) {
          console.error("Error creating media session:", error);
          setSessionReady(false);
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

  // Function to update session with media URLs
  const updateMediaSession = async (imageUrl?: string, videoUrl?: string, gifUrl?: string) => {
    // Try to get session code from localStorage as backup
    const currentSessionCode = mediaSessionCode || localStorage.getItem("mediaSessionCode");

    if (!currentSessionCode) {
      console.error("No media session code available");
      return;
    }

    try {
      const response = await fetch('/api/media-session', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionCode: currentSessionCode,
          imageUrl,
          videoUrl,
          gifUrl
        })
      });

      if (response.ok) {
        const updatedSession = await response.json();
        console.log("Media session updated:", updatedSession);
      } else {
        console.error("Failed to update media session");
      }
    } catch (error) {
      console.error("Error updating media session:", error);
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


  const handlePrint = async () => {
    setIsPrinting(true);
    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      const previewContent = printPreviewRef.current;
      if (!previewContent) {
        alert('Không tìm thấy nội dung để in');
        setIsPrinting(false);
        setIsProcessing(false);
        return;
      }

      // Ensure we have a media session before proceeding
      const currentSessionCode = mediaSessionCode || localStorage.getItem("mediaSessionCode");
      if (!currentSessionCode) {
        console.error("No media session available, creating one...");
        // Try to create a session immediately
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
            setSessionReady(true);

            console.log("Emergency media session created:", session.sessionCode);
          } else {
            console.error("Failed to create emergency media session");
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
        setProcessingProgress(10);
        setProcessingProgress(20);
        // Process all media types in parallel với progress tracking
        const processTasks = [];

        // Generate and upload image - Task 1
        const imageTask = (async () => {
          try {
            setProcessingProgress(30);
            const imageDataUrl = await generateHighQualityImage(isLandscape);
            if (!imageDataUrl) {
              throw new Error("Không thể tạo ảnh");
            }

            setProcessingProgress(50);
            // Convert and upload image to external API
            const imageFile = dataURLtoFile(imageDataUrl, "photobooth.jpg");
            const imageUrl = await uploadImage(imageFile);

            console.log("Ảnh đã được tải lên thành công:", imageUrl);
            setImageQrCode(imageUrl);
            localStorage.setItem("imageQrCode", imageUrl);

            // Update media session with image URL (non-blocking)
            updateMediaSession(imageUrl).catch(err =>
              console.error("Failed to update session with image:", err)
            );

            setProcessingProgress(60);

            // Send to printer (non-blocking for better UX)
            fetch("http://localhost:4000/api/print", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                "imageUrl": imageUrl,
                "fileName": "photobooth.jpg",
                "printerName": selectedFrame?.isCustom ? "DS-RX1-Cut" : "DS-RX1",
                "quantity": selectedQuantity || 1,
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

        // Generate and upload video if videos are available - Task 2 (parallel)
        if (videos && videos.length > 0) {
          const videoTask = (async () => {
            try {
              console.log("Starting video generation...");
              setProcessingProgress(70);

              const videoUrl = await generateSmoothVideo(isLandscape);
              if (videoUrl) {
                console.log("Video generated successfully, uploading to server...");
                const serverUrl = await uploadVideo(videoUrl);
                setVideoQrCode(serverUrl);
                localStorage.setItem("videoQrCode", serverUrl);

                // Update media session with video URL (non-blocking)
                updateMediaSession(undefined, serverUrl).catch(err =>
                  console.error("Failed to update session with video:", err)
                );

                setProcessingProgress(80);
                console.log("Video processed and uploaded successfully");
              } else {
                console.error("Failed to generate video - no URL returned");
              }
            } catch (error) {
              console.error("Error processing video:", error);
            }
          })();
          processTasks.push(videoTask);

          // Generate and upload GIF from video - Task 3 (parallel với video)
          const gifTask = (async () => {
            try {
              console.log("Starting GIF generation from video...");
              setProcessingProgress(85);

              const gifUrl = await generateGifFromVideo(isLandscape);
              if (gifUrl) {
                console.log("GIF generated successfully, uploading to server...");
                const serverUrl = await uploadGif(gifUrl);
                setGifQrCode(serverUrl);
                localStorage.setItem("gifQrCode", serverUrl);

                // Update media session with GIF URL (non-blocking)
                updateMediaSession(undefined, undefined, serverUrl).catch(err =>
                  console.error("Failed to update session with GIF:", err)
                );

                setProcessingProgress(95);
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
        setProcessingProgress(100);

        // Ngắn delay trước khi chuyển trang để user thấy progress hoàn thành
        setTimeout(() => {
          router.push("/step/step9");
        }, 500);

      } catch (error) {
        console.error("Lỗi khi xử lý và tải lên:", error);
        alert(`Có lỗi xảy ra: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        setIsPrinting(false);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Lỗi khi xử lý:", error);
      alert(`Có lỗi xảy ra: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
      setIsPrinting(false);
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
            videoElement.preload = 'auto'; // Preload for smoother playback
            videoElement.setAttribute('playsinline', ''); // iOS support

            // Add crossorigin for better handling of video sources
            videoElement.crossOrigin = "anonymous";

            // Preload content for smoother playback
            await new Promise<void>((resolve) => {
              videoElement.onloadedmetadata = () => {
                // Once metadata is loaded, try to preload more of the video
                videoElement.oncanplaythrough = () => {
                  console.log(`Video ${photoIndex} fully loaded and ready for smooth playback`);
                  resolve();
                };

                // Set a timeout in case canplaythrough never fires
                setTimeout(() => {
                  console.log(`Video ${photoIndex} loaded metadata, duration: ${videoElement.duration}`);
                  resolve();
                }, 2000);
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
        console.log("Loading background image:", selectedTemplate.background);
        backgroundImg = document.createElement('img');
        backgroundImg.crossOrigin = "anonymous";

        await new Promise<void>((resolve) => {
          backgroundImg!.onload = () => {
            backgroundValid = true;
            console.log("Background image loaded successfully");
            resolve();
          };
          backgroundImg!.onerror = (error) => {
            backgroundValid = false;
            console.error("Failed to load background image:", error);
            resolve();
          };
          setTimeout(() => {
            if (!backgroundValid) {
              backgroundValid = false;
              console.error("Background image load timeout");
            }
            resolve();
          }, 10000); // Increase timeout to 10 seconds

          // Try with and without cache busting
          backgroundImg!.src = selectedTemplate.background;
          if (backgroundImg!.complete && backgroundImg!.naturalWidth > 0) {
            backgroundValid = true;
            console.log("Background image already cached");
            resolve();
          }
        });
      }

      // Prepare overlay if needed
      let overlayImg: HTMLImageElement | null = null;
      let overlayValid = false;
      if (selectedTemplate?.overlay) {
        console.log("Loading overlay image:", selectedTemplate.overlay);
        overlayImg = document.createElement('img');
        overlayImg.crossOrigin = "anonymous";

        await new Promise<void>((resolve) => {
          overlayImg!.onload = () => {
            overlayValid = true;
            console.log("Overlay image loaded successfully");
            resolve();
          };
          overlayImg!.onerror = (error) => {
            overlayValid = false;
            console.error("Failed to load overlay image:", error);
            resolve();
          };
          setTimeout(() => {
            if (!overlayValid) {
              overlayValid = false;
              console.error("Overlay image load timeout");
            }
            resolve();
          }, 10000); // Increase timeout to 10 seconds

          // Try with and without cache busting
          overlayImg!.src = selectedTemplate.overlay;
          if (overlayImg!.complete && overlayImg!.naturalWidth > 0) {
            overlayValid = true;
            console.log("Overlay image already cached");
            resolve();
          }
        });
      }

      // Start all videos and wait for them to be ready
      console.log("Starting videos for smooth recording...");
      const videoStartPromises = Array.from(cellVideoMap.values()).map(async (video) => {
        try {
          // Make videos loop to ensure continuous playback throughout recording
          video.loop = true;
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

      // Store initial positions and dimensions for consistency
      const cellPositions = new Map();

      // Calculate and store all cell positions once to ensure consistency
      const cells = Array.from(previewContent.querySelectorAll('div[class*="aspect-"]'));
      cells.forEach((cell, idx) => {
        if (cellVideoMap.has(idx)) {
          const cellRect = cell.getBoundingClientRect();
          const relativeLeft = cellRect.left - rect.left;
          const relativeTop = cellRect.top - rect.top;

          // Store position and dimension data
          cellPositions.set(idx, {
            left: relativeLeft,
            top: relativeTop,
            width: cellRect.width,
            height: cellRect.height
          });
        }
      });

      const renderFrame = () => {
        const now = performance.now();

        // Throttle frame rate for consistency
        if (now - lastTime < frameInterval) {
          requestAnimationFrame(renderFrame);
          return;
        }
        lastTime = now;

        // Check if we've been recording too long to prevent memory issues
        if (frameCount > targetFPS * TIMEOUT_DURATION) {
          console.log("Reached maximum frame count, stopping recording");
          mediaRecorder.stop();
          return;
        }

        const anyPlaying = Array.from(cellVideoMap.values()).some(
          (video) => !video.ended && !video.paused
        );

        // Handle end of all videos more gracefully
        // Only stop after minimum duration and if all videos are done
        if (!anyPlaying && frameCount > targetFPS * 3) { // Ensure at least 3 seconds of recording
          console.log("All videos completed, stopping recording");
          mediaRecorder.stop();
          return;
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
            console.log(`Drawing background for frame ${frameCount}`);
            previewCtx.drawImage(backgroundImg, 0, 0, previewCanvas.width, previewCanvas.height);
          } catch (e) {
            console.error("Error drawing background image in video:", e);
          }
        }

        // Use stored cell positions for consistent rendering
        cells.forEach((cell, idx) => {
          if (!cellVideoMap.has(idx) || !cellPositions.has(idx)) return;

          const cellData = cellPositions.get(idx);
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

            // Save context for clipping
            previewCtx.save();

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

            previewCtx.drawImage(
              videoElement,
              offsetX,
              offsetY,
              drawWidth,
              drawHeight
            );

            previewCtx.restore(); // Restore context (removes clipping and filter)

            // Reset filter after each cell to prevent interference
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
            // For debugging
            if (frameCount % 24 === 0) {
              console.log(`Overlay drawn for frame ${frameCount}`);
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
      console.log("Starting video rendering...", frameCount);

      // Start rendering
      requestAnimationFrame(renderFrame);

      // Make sure we stop recording after the defined timeout
      // Use this as a fallback in case videos don't trigger the stop condition
      const videoDuration = Math.min(
        10, // Max 10 seconds to match TIMEOUT_DURATION
        Math.max(
          ...Array.from(cellVideoMap.values()).map(v => v.duration || 0)
        ) + 1 // Add one second to the longest video to ensure we capture everything
      );

      // Use the defined timeout or the calculated video duration
      const recordingTimeout = Math.min(
        TIMEOUT_DURATION || 10, // Use full TIMEOUT_DURATION (10 seconds)
        videoDuration
      );

      console.log(`Setting video recording timeout to ${recordingTimeout} seconds`);

      // Force loop videos to ensure content plays throughout the recording time
      Array.from(cellVideoMap.values()).forEach(video => {
        video.loop = true; // Set videos to loop so they don't end prematurely
      });

      setTimeout(() => {
        console.log("Video recording timeout reached, stopping...");
        mediaRecorder.stop();
      }, recordingTimeout * 1000);

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
        console.log("Loading background image for GIF:", selectedTemplate.background);
        backgroundImg = document.createElement('img');
        backgroundImg.crossOrigin = "anonymous";

        await new Promise<void>((resolve) => {
          backgroundImg!.onload = () => {
            backgroundValid = true;
            console.log("Background image loaded successfully for GIF");
            resolve();
          };
          backgroundImg!.onerror = (error) => {
            backgroundValid = false;
            console.error("Failed to load background image for GIF:", error);
            resolve();
          };
          setTimeout(() => {
            if (!backgroundValid) {
              backgroundValid = false;
              console.error("Background image timeout for GIF");
            }
            resolve();
          }, 10000); // Increase timeout to 10 seconds

          // Try with and without cache busting
          backgroundImg!.src = selectedTemplate.background;
          if (backgroundImg!.complete && backgroundImg!.naturalWidth > 0) {
            backgroundValid = true;
            console.log("Background image already cached for GIF");
            resolve();
          }
        });
      }

      // Prepare overlay if needed
      let overlayImg: HTMLImageElement | null = null;
      let overlayValid = false;
      if (selectedTemplate?.overlay) {
        console.log("Loading overlay image for GIF:", selectedTemplate.overlay);
        overlayImg = document.createElement('img');
        overlayImg.crossOrigin = "anonymous";

        await new Promise<void>((resolve) => {
          overlayImg!.onload = () => {
            overlayValid = true;
            console.log("Overlay image loaded successfully for GIF");
            resolve();
          };
          overlayImg!.onerror = () => {
            overlayValid = false;
            console.error("Failed to load overlay image for GIF");
            resolve();
          };
          setTimeout(() => {
            overlayValid = false;
            console.error("Overlay image timeout for GIF");
            resolve();
          }, 5000);

          overlayImg!.src = `${selectedTemplate.overlay}?v=${Date.now()}`;
          if (overlayImg!.complete) {
            overlayValid = overlayImg!.naturalWidth > 0 && overlayImg!.naturalHeight > 0;
            console.log("Overlay image already cached for GIF:", overlayValid);
            resolve();
          }
        });
      }

      // Start all videos
      console.log("Starting videos for GIF creation...");
      const videoStartPromises = Array.from(cellVideoMap.values()).map(async (video) => {
        try {
          // Set videos to loop to prevent them from ending during GIF creation
          video.loop = true;
          await video.play();
          return true;
        } catch (e) {
          console.error("Error starting video for GIF:", e);
          return false;
        }
      });

      await Promise.all(videoStartPromises);
      await new Promise(resolve => setTimeout(resolve, 300));

      console.log("Starting GIF frame capture with background:", backgroundValid, "overlay:", overlayValid);

      // Calculate actual GIF duration based on video durations
      const maxVideoDuration = Math.max(
        ...Array.from(cellVideoMap.values()).map(v => v.duration || 0)
      );

      // Use shorter duration for custom frames to prevent glitches
      const frameRate = 8; // 8 FPS for reasonable file size
      const frameInterval = 1000 / frameRate;

      const adjustedGifDuration = Math.min(
        isCustomFrame ? 2 : 3, // Default durations
        maxVideoDuration + 0.5 // Actual max video duration plus half a second buffer
      );

      console.log(`Using adjusted GIF duration of ${adjustedGifDuration} seconds`);

      // Recalculate frames based on adjusted duration
      const totalFrames = Math.ceil(adjustedGifDuration * frameRate);

      // Store cell positions once for consistency
      const cellPositions = new Map();
      const cells = Array.from(previewContent.querySelectorAll('div[class*="aspect-"]'));
      cells.forEach((cell, idx) => {
        if (cellVideoMap.has(idx)) {
          const cellRect = cell.getBoundingClientRect();
          const relativeLeft = cellRect.left - rect.left;
          const relativeTop = cellRect.top - rect.top;

          // Store position and dimension data
          cellPositions.set(idx, {
            left: relativeLeft,
            top: relativeTop,
            width: cellRect.width,
            height: cellRect.height
          });
        }
      });

      // Store first frame data for custom frames (to ensure we can restore it if needed)
      let firstFrameData = null;

      for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
        // Clear canvases with white background
        previewCtx.fillStyle = "#FFFFFF";
        previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
        outputCtx.fillStyle = "#FFFFFF";
        outputCtx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);

        // Reset context state before drawing
        previewCtx.filter = "none";
        previewCtx.globalCompositeOperation = "source-over";

        // Draw background image first if available
        if (backgroundImg && backgroundValid) {
          try {
            previewCtx.drawImage(backgroundImg, 0, 0, previewCanvas.width, previewCanvas.height);
            if (frameIndex % 8 === 0) {
              console.log(`Background drawn for GIF frame ${frameIndex}`);
            }
          } catch (e) {
            console.error("Error drawing background image in GIF:", e);
          }
        }

        const cells = Array.from(previewContent.querySelectorAll('div[class*="aspect-"]'));

        // Render each cell
        cells.forEach((cell, idx) => {
          if (!cellVideoMap.has(idx)) return;


          const videoElement = cellVideoMap.get(idx)!;
          const cellData = cellPositions.get(idx);

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
                    return `${prop}(${val}px)`;
                  } else if (prop === "sepia") {
                    return `${prop}(1)`;
                  } else if (prop === "grayscale") {
                    return `${prop}(1)`;
                  } else if (prop === "invert") {
                    return `${prop}(1)`;
                  } else if (prop === "hue-rotate") {
                    return `hue-rotate(${val}deg)`;
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
              const centerX = cellData.left + cellData.width / 2;
              const centerY = cellData.top + cellData.height / 2;
              const radius = Math.min(cellData.width, cellData.height) / 2;
              previewCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            } else {
              previewCtx.rect(cellData.left, cellData.top, cellData.width, cellData.height);
            }
            previewCtx.clip();

            // Calculate aspect ratio for video
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
            previewCtx.restore();

            // Reset filter after each cell to prevent interference
            previewCtx.filter = "none";
          }
        });

        // Draw overlay if available - Reset context state first
        previewCtx.filter = "none";
        previewCtx.globalCompositeOperation = "source-over";
        if (overlayImg && overlayValid) {
          try {
            previewCtx.drawImage(overlayImg, 0, 0, previewCanvas.width, previewCanvas.height);
            if (frameIndex % 8 === 0) {
              console.log(`Overlay drawn for GIF frame ${frameIndex}`);
            }
          } catch (e) {
            console.error("Error drawing overlay on GIF frame:", e);
          }
        }

        // Copy to output canvas with adjusted positioning
        // Reset output context state
        outputCtx.globalCompositeOperation = "source-over";

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

        // Add one more duplicate frame to ensure smooth looping
        gif.addFrame(outputCanvas, {
          delay: frameInterval * 2,
          copy: true
        });

        console.log("Added clean final frames for custom frame GIF");
      } else if (!isCustomFrame) {
        // For regular frames, add a few extra frames with the last good state
        // to ensure smooth looping
        for (let i = 0; i < 3; i++) {
          gif.addFrame(outputCanvas, {
            delay: frameInterval * 1.5,
            copy: true
          });
        }

        console.log("Added extra frames for regular GIF to ensure smooth looping");
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
      // Use existing media session URL or fallback to localStorage
      let sessionUrl = mediaSessionUrl;
      if (!sessionUrl) {
        const sessionCode = localStorage.getItem("mediaSessionCode");
        if (sessionCode) {
          const baseUrl = typeof window !== 'undefined' ?
            `${window.location.protocol}//${window.location.host}` : '';
          sessionUrl = `${baseUrl}/session/${sessionCode}`;
        }
      }

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
          console.log("HTML2Canvas clone started with template:", selectedTemplate);
          if (selectedTemplate) {
            console.log("Template details - Background:", selectedTemplate.background ? "Yes" : "No",
              "Overlay:", selectedTemplate.overlay ? "Yes" : "No");
          }

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
                    return `${prop}(${val}px)`;
                  } else if (prop === "sepia") {
                    return `${prop}(1)`;
                  } else if (prop === "grayscale") {
                    return `${prop}(1)`;
                  } else if (prop === "invert") {
                    return `${prop}(1)`;
                  } else if (prop === "hue-rotate") {
                    return `hue-rotate(${val}deg)`;
                  }
                  return "";
                })
                .filter(Boolean)
                .join(" ");

              if (filterValues) {
                img.style.filter = filterValues;
                img.style.webkitFilter = filterValues; // Webkit compatibility
                // Force filter application
                img.setAttribute('data-filter-applied', 'true');
              }
            }

            // Ensure filter is applied to photo-booth-image class specifically
            if (img.classList.contains('photo-booth-image')) {
              // Apply the selected filter class directly to maintain consistency
              if (selectedFilter?.className) {
                const existingClasses = img.className;
                // Remove any existing filter classes
                const cleanClasses = existingClasses.split(' ').filter(cls =>
                  !cls.includes('brightness-') &&
                  !cls.includes('contrast-') &&
                  !cls.includes('saturate-') &&
                  !cls.includes('blur-') &&
                  !cls.includes('sepia') &&
                  !cls.includes('grayscale') &&
                  !cls.includes('invert') &&
                  !cls.includes('hue-rotate-')
                ).join(' ');

                img.className = `${cleanClasses} ${selectedFilter.className}`;
              }
            }
          });

          // Also apply filter to the main preview container if needed
          const previewContainer = clonedDoc.querySelector('#photobooth-print-preview');
          if (previewContainer && selectedFilter?.className) {
            // Apply filter class to the container level as well
            previewContainer.classList.add(...selectedFilter.className.split(' '));
          }

          // Optimize frame background rendering
          const backgroundContainer = clonedDoc.querySelector(".pointer-events-none.absolute.inset-0.z-0");
          if (backgroundContainer) {
            const backgroundElement = backgroundContainer.querySelector("img");
            if (backgroundElement) {
              (backgroundElement as HTMLElement).style.objectFit = "contain";
              (backgroundElement as HTMLElement).style.width = "100%";
              (backgroundElement as HTMLElement).style.height = "100%";
            }
          }

          // Optimize frame overlay rendering
          const overlayContainer = clonedDoc.querySelector(".pointer-events-none.absolute.inset-0.z-20");
          if (overlayContainer) {
            const overlayElement = overlayContainer.querySelector("img");
            if (overlayElement) {
              (overlayElement as HTMLElement).style.objectFit = "contain";
              (overlayElement as HTMLElement).style.width = "100%";
              (overlayElement as HTMLElement).style.height = "100%";
            }
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

      <StoreNavigationButtons
        currentStore={currentStore}
        nextLabel={!sessionReady ? "Đang tạo phiên..." : "In ảnh"}
        onNext={handlePrint}
        nextDisabled={isPrinting || !sessionReady}
      >
        {isPrinting && (
          <div className="flex flex-col items-center justify-center text-white">
            <div className="flex items-center mb-2">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500 mr-2"></div>
              {isProcessing ? 'Đang xử lý media...' : 'Đang in...'}
            </div>
            {isProcessing && (
              <div className="w-48 bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-pink-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${processingProgress}%` }}
                ></div>
              </div>
            )}
            {isProcessing && (
              <p className="text-sm opacity-75">{processingProgress}% hoàn thành</p>
            )}
          </div>
        )}
        {!sessionReady && !isPrinting && (
          <div className="flex items-center justify-center text-white text-sm">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
            Đang khởi tạo phiên làm việc...
          </div>
        )}
      </StoreNavigationButtons>
    </StoreBackground>
  );
}