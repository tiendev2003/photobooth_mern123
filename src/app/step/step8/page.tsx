"use client";

import HomeButton from "@/app/components/HomeButton";
import LogoApp from "@/app/components/LogoApp";
import { filterOptions, useBooth } from "@/lib/context/BoothContext";
import { FrameTemplate } from "@/lib/models/FrameTemplate";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ImageIcon, Printer, Sparkles } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Enhanced filters for skin beautification
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
        });

        if (!imageResponse.ok) {
          throw new Error("Lỗi khi tải ảnh lên");
        }

        const imageData = await imageResponse.json();
        console.log("Ảnh đã được tải lên thành công:", imageData);
        setImageQrCode(imageData.data.url);

        // Generate and upload video if videos are available
        // if (videos && videos.length > 0) {
        //   // Generate high-quality video
        //   const videoUrl = await generateHighQualityVideo(isLandscape);
        //   if (videoUrl) {
        //     // Upload the processed video
        //     const videoResponse = await fetch(videoUrl);
        //     const videoBlob = await videoResponse.blob();

        //     const videoFormData = new FormData();
        //     videoFormData.append("file", new File([videoBlob], "photobooth.webm", { type: "video/webm" }));

        //     // Send to API
        //     const videoUploadResponse = await fetch("/api/videos", {
        //       method: "POST",
        //       body: videoFormData,
        //     });

        //     if (!videoUploadResponse.ok) {
        //       console.error("Lỗi khi tải video lên");
        //     } else {
        //       const videoData = await videoUploadResponse.json();
        //       console.log("Video đã được tải lên thành công:", videoData);
        //       setVideoQrCode(videoData.data.url);
        //     }

        //     // Generate high-quality GIF
        //     const gifUrl = await generateHighQualityGif(isLandscape);
        //     if (gifUrl) {
        //       // Upload the processed GIF
        //       const gifResponse = await fetch(gifUrl);
        //       const gifBlob = await gifResponse.blob();

        //       const gifFormData = new FormData();
        //       gifFormData.append("file", new File([gifBlob], "photobooth.gif", { type: "image/gif" }));

        //       // Send to API
        //       const gifUploadResponse = await fetch("/api/gifs", {
        //         method: "POST",
        //         body: gifFormData,
        //       });

        //       if (!gifUploadResponse.ok) {
        //         console.error("Lỗi khi tải GIF lên");
        //       } else {
        //         const gifData = await gifUploadResponse.json();
        //         console.log("GIF đã được tải lên thành công:", gifData);
        //         setGifQrCode(gifData.data.url);
        //       }
        //     }
        //   }
        // }

        // Send to printer
        fetch("/api/print", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            base64Image: imageDataUrl,
            isLandscape: isLandscape, // Pass orientation
            isCut: selectedFrame?.isCustom === true, // Use isCustom to determine cut option
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

        router.push("/step/step9");

      } catch (error) {
        console.error("Error processing media:", error);
        alert("Có lỗi xảy ra khi xử lý media: " + (error instanceof Error ? error.message : "Lỗi không xác định"));
      }

    } catch (error) {
      console.error("Error during printing:", error);
      alert("Có lỗi xảy ra khi in ảnh: " + (error instanceof Error ? error.message : "Lỗi không xác định"));
    } finally {
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
  // const generateHighQualityVideo = async (isLandscape: boolean): Promise<string | void> => {
  //   try {
  //     const previewContent = printPreviewRef.current;
  //     if (!previewContent) {
  //       alert('Không tìm thấy nội dung để xử lý video');
  //       return;
  //     }

  //     if (!videos || videos.length === 0) {
  //       alert("Không có video để xử lý.");
  //       return;
  //     }

  //     const isCustomFrame = selectedFrame?.isCustom === true;
  //     const desiredWidth = isLandscape ? 1800 : 1200;
  //     const desiredHeight = isLandscape ? 1200 : 1800;
  //     const rect = previewContent.getBoundingClientRect();

  //     // Create output canvas for video
  //     const outputCanvas = document.createElement('canvas');
  //     outputCanvas.width = desiredWidth;
  //     outputCanvas.height = desiredHeight;
  //     const outputCtx = outputCanvas.getContext('2d');

  //     if (!outputCtx) {
  //       throw new Error("Không thể tạo video canvas context");
  //     }

  //     // Setup MediaRecorder with the output canvas stream
  //     const stream = outputCanvas.captureStream(30); // 30fps
  //     const mediaRecorder = new MediaRecorder(stream, {
  //       mimeType: 'video/webm;codecs=vp9',
  //       videoBitsPerSecond: 8000000, // 8Mbps - high quality
  //     });

  //     const recordedChunks: Blob[] = [];
  //     mediaRecorder.ondataavailable = (e) => {
  //       if (e.data.size > 0) {
  //         recordedChunks.push(e.data);
  //       }
  //     };

  //     const processedVideoPromise = new Promise<string>((resolve) => {
  //       mediaRecorder.onstop = () => {
  //         const finalBlob = new Blob(recordedChunks, { type: 'video/webm' });
  //         const processedVideoUrl = URL.createObjectURL(finalBlob);
  //         resolve(processedVideoUrl);
  //       };
  //     });

  //     // Create a temporary rendering canvas for the preview
  //     const previewCanvas = document.createElement('canvas');
  //     previewCanvas.width = rect.width;
  //     previewCanvas.height = rect.height;
  //     const previewCtx = previewCanvas.getContext('2d');

  //     if (!previewCtx) {
  //       throw new Error("Không thể tạo preview canvas context");
  //     }

  //     // Load all video elements based on selectedIndices
  //     const videoElements: HTMLVideoElement[] = [];
  //     const cellIndices = selectedFrame?.isCustom
  //       ? Array.from({ length: 4 }, (_, i) => i)
  //       : Array.from({ length: selectedFrame!.columns * selectedFrame!.rows }, (_, i) => i);
  //     for (const idx of cellIndices) {
  //       const photoIndex = selectedIndices[idx] ?? 0;

  //       const videoUrl = videos[photoIndex];

  //       const videoElement = document.createElement('video');
  //       videoElement.src = videoUrl;
  //       videoElement.muted = true;
  //       videoElement.playsInline = true;

  //       // Wait for video to load metadata
  //       await new Promise<void>((resolve) => {
  //         videoElement.onloadedmetadata = () => resolve();
  //         videoElement.onerror = () => {
  //           console.error(`Lỗi khi tải video tại chỉ số ${photoIndex}`);
  //           resolve();
  //         };
  //       });

  //       videoElements.push(videoElement);
  //     }

  //     // Prepare overlay template if needed
  //     let overlayImg: HTMLImageElement | null = null;
  //     if (selectedTemplate?.path) {
  //       overlayImg = document.createElement('img');
  //       overlayImg.src = selectedTemplate.path;
  //       await new Promise<void>((resolve) => {
  //         if (overlayImg!.complete) {
  //           resolve();
  //         } else {
  //           overlayImg!.onload = () => resolve();
  //           overlayImg!.onerror = () => resolve();
  //         }
  //       });
  //     }

  //     // Start all videos and recording
  //     videoElements.forEach((video) => video.play());
  //     mediaRecorder.start();

  //     const cells = previewContent.querySelectorAll('div[class*="aspect-"] img, div[class*="aspect-"]');

  //     const renderVideoFrame = () => {
  //       const anyPlaying = videoElements.some((video) => !video.ended && !video.paused);
  //       if (!anyPlaying) {
  //         mediaRecorder.stop();
  //         return;
  //       }

  //       // Clear canvases
  //       previewCtx.fillStyle = "#FFFFFF";
  //       previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
  //       outputCtx.fillStyle = "#FFFFFF";
  //       outputCtx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);

  //       cells.forEach((cell, idx) => {
  //         if (!cell.classList.contains('empty')) {
  //           const cellRect = cell.getBoundingClientRect();
  //           const relativeLeft = cellRect.left - rect.left;
  //           const relativeTop = cellRect.top - rect.top;

  //           const videoElement = videoElements[idx] || videoElements[2];

  //           // Apply filter
  //           if (selectedFilter?.className) {
  //             const filterString = selectedFilter.className
  //               .split(" ")
  //               .filter((cls) => cls.includes("-"))
  //               .map((cls) => {
  //                 const [prop, val] = cls.split("-");
  //                 if (["brightness", "contrast", "saturate"].includes(prop)) {
  //                   return `${prop}(${val}%)`;
  //                 } else if (prop === "hue-rotate") {
  //                   return `${prop}(${val})`;
  //                 } else if (prop === "blur") {
  //                   return `${prop}(${val})`;
  //                 } else if (prop === "sepia") {
  //                   return `${prop}(1)`;
  //                 }
  //                 return "";
  //               })
  //               .filter(Boolean)
  //               .join(" ");

  //             previewCtx.filter = filterString;
  //           } else {
  //             previewCtx.filter = "none";
  //           }

  //           // Draw video frame into each cell position
  //           previewCtx.drawImage(
  //             videoElement,
  //             relativeLeft,
  //             relativeTop,
  //             cellRect.width,
  //             cellRect.height
  //           );
  //         }
  //       });

  //       // Draw the overlay if available
  //       if (overlayImg && overlayImg.complete) {
  //         previewCtx.globalCompositeOperation = 'source-over';
  //         previewCtx.filter = "none";
  //         previewCtx.drawImage(
  //           overlayImg,
  //           0,
  //           0,
  //           previewCanvas.width,
  //           previewCanvas.height
  //         );
  //       }

  //       if (isCustomFrame) {
  //         // Custom frame: Render two identical images side by side
  //         const singleImageWidth = desiredWidth / 2;
  //         const singleImageHeight = desiredHeight;

  //         const aspectRatio = previewCanvas.width / previewCanvas.height;
  //         const targetAspectRatio = singleImageWidth / singleImageHeight;

  //         let drawWidth = singleImageWidth;
  //         let drawHeight = singleImageHeight;
  //         let offsetX = 0;
  //         let offsetY = 0;

  //         if (aspectRatio > targetAspectRatio) {
  //           drawHeight = singleImageWidth / aspectRatio;
  //           offsetY = (singleImageHeight - drawHeight) / 2;
  //         } else {
  //           drawWidth = singleImageHeight * aspectRatio;
  //           offsetX = (singleImageWidth - drawWidth) / 2;
  //         }

  //         // Draw first copy (left)
  //         outputCtx.drawImage(
  //           previewCanvas,
  //           0,
  //           0,
  //           previewCanvas.width,
  //           previewCanvas.height,
  //           offsetX,
  //           offsetY,
  //           drawWidth,
  //           drawHeight
  //         );

  //         // Draw second copy (right)
  //         outputCtx.drawImage(
  //           previewCanvas,
  //           0,
  //           0,
  //           previewCanvas.width,
  //           previewCanvas.height,
  //           singleImageWidth + offsetX,
  //           offsetY,
  //           drawWidth,
  //           drawHeight
  //         );
  //       } else {
  //         // Regular frame: Single image
  //         const aspectRatio = previewCanvas.width / previewCanvas.height;
  //         const targetAspectRatio = desiredWidth / desiredHeight;

  //         let drawWidth = desiredWidth;
  //         let drawHeight = desiredHeight;
  //         let offsetX = 0;
  //         let offsetY = 0;

  //         if (aspectRatio > targetAspectRatio) {
  //           drawHeight = desiredWidth / aspectRatio;
  //           offsetY = (desiredHeight - drawHeight) / 2;
  //         } else {
  //           drawWidth = desiredHeight * aspectRatio;
  //           offsetX = (desiredWidth - drawWidth) / 2;
  //         }

  //         outputCtx.drawImage(
  //           previewCanvas,
  //           0,
  //           0,
  //           previewCanvas.width,
  //           previewCanvas.height,
  //           offsetX,
  //           offsetY,
  //           drawWidth,
  //           drawHeight
  //         );
  //       }

  //       // Request next frame
  //       requestAnimationFrame(renderVideoFrame);
  //     };

  //     // Start the rendering loop
  //     renderVideoFrame();

  //     // Wait for all videos to finish
  //     await Promise.all(
  //       videoElements.map(
  //         (video) =>
  //           new Promise<void>((resolve) => {
  //             video.onended = () => resolve();
  //           })
  //       )
  //     );

  //     // Add a small delay to ensure the last frame is captured
  //     await new Promise((resolve) => setTimeout(resolve, 300));
  //     mediaRecorder.stop();

  //     return processedVideoPromise;
  //   } catch (error) {
  //     console.error("Lỗi khi tạo video chất lượng cao:", error);
  //     alert("❌ Có lỗi xảy ra khi tạo video. Vui lòng thử lại.");
  //   }
  // };
  // const generateHighQualityGif = async (isLandscape: boolean): Promise<string | void> => {
  //   try {
  //     // Get the preview content just like in generateHighQualityImage
  //     const previewContent = printPreviewRef.current;
  //     if (!previewContent) {
  //       alert('Không tìm thấy nội dung để tạo GIF');
  //       return;
  //     }

  //     if (!videos || videos.length === 0) {
  //       alert("Không có video để tạo GIF.");
  //       return;
  //     }

  //     // Get configuration similar to generateHighQualityImage
  //     const isCustomFrame = selectedFrame?.isCustom === true;
  //     const desiredWidth = isLandscape ? 1200 : 800;  // Smaller for GIF to keep file size manageable
  //     const desiredHeight = isLandscape ? 800 : 1200;
  //     const rect = previewContent.getBoundingClientRect();

  //     // Dynamically import required libraries
  //     const { default: GIF } = await import('gif.js');

  //     // Create a new GIF with final dimensions
  //     const gif = new GIF({
  //       workers: 2,
  //       quality: 10, // Lower is better
  //       workerScript: '/gif.worker.js',
  //       width: desiredWidth,
  //       height: desiredHeight,
  //       background: '#ffffff'
  //     });

  //     // Create video element to process
  //     const videoElement = document.createElement('video');
  //     videoElement.src = videos[0];
  //     videoElement.muted = true;
  //     videoElement.playsInline = true;

  //     // Wait for video to load
  //     await new Promise<void>((resolve) => {
  //       videoElement.onloadedmetadata = () => resolve();
  //       videoElement.onerror = (e) => {
  //         console.error("Video error:", e);
  //         alert("Lỗi khi tải video.");
  //         resolve();
  //       };
  //     });

  //     // Calculate how many frames to sample (fewer for longer videos)
  //     const duration = videoElement.duration;
  //     const frameCount = Math.min(15, Math.max(8, Math.floor(duration * 3))); // Reduce frames for better performance
  //     const frameInterval = duration / frameCount;


  //     // Create a temporary canvas to hold the video frame
  //     const tempCanvas = document.createElement('canvas');
  //     tempCanvas.width = videoElement.videoWidth;
  //     tempCanvas.height = videoElement.videoHeight;
  //     const tempCtx = tempCanvas.getContext('2d');

  //     if (!tempCtx) {
  //       throw new Error("Không thể tạo temporary canvas context");
  //     }

  //     // Create output canvas for final GIF frames
  //     const outputCanvas = document.createElement('canvas');
  //     outputCanvas.width = desiredWidth;
  //     outputCanvas.height = desiredHeight;
  //     const outputCtx = outputCanvas.getContext('2d');

  //     if (!outputCtx) {
  //       throw new Error("Không thể tạo output canvas context");
  //     }

  //     // Create a preview canvas for rendering the layout
  //     const previewCanvas = document.createElement('canvas');
  //     previewCanvas.width = rect.width;
  //     previewCanvas.height = rect.height;
  //     const previewCtx = previewCanvas.getContext('2d');

  //     if (!previewCtx) {
  //       throw new Error("Không thể tạo preview canvas context");
  //     }

  //     // Prepare overlay template if needed
  //     let overlayImg: HTMLImageElement | null = null;
  //     if (selectedTemplate?.path) {
  //       overlayImg = document.createElement('img');
  //       overlayImg.src = selectedTemplate.path;
  //       await new Promise<void>((resolve) => {
  //         if (overlayImg!.complete) {
  //           resolve();
  //         } else {
  //           overlayImg!.onload = () => resolve();
  //           overlayImg!.onerror = () => resolve();
  //         }
  //       });
  //     }

  //     for (let i = 0; i < frameCount; i++) {

  //       // Set video to specific time
  //       videoElement.currentTime = i * frameInterval;

  //       // Wait for the video to seek to that position
  //       await new Promise<void>(resolve => {
  //         const seekHandler = () => {
  //           videoElement.removeEventListener('seeked', seekHandler);
  //           resolve();
  //         };
  //         videoElement.addEventListener('seeked', seekHandler);
  //       });

  //       // Clear the preview canvas
  //       previewCtx.fillStyle = "#FFFFFF";
  //       previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);

  //       // Draw the current video frame to the temp canvas
  //       tempCtx.drawImage(videoElement, 0, 0, tempCanvas.width, tempCanvas.height);

  //       // Render each cell with the current video frame
  //       cells.forEach((cell, idx) => {
  //         console.log("Rendering cell", idx, "with video frame");
  //         if (!cell.classList.contains('empty')) { // Skip empty cells
  //           const cellRect = cell.getBoundingClientRect();
  //           const relativeLeft = cellRect.left - rect.left;
  //           const relativeTop = cellRect.top - rect.top;
  //           const cellWidth = cellRect.width;
  //           const cellHeight = cellRect.height;

  //           // Apply filter
  //           if (selectedFilter?.className) {
  //             const filterString = selectedFilter.className
  //               .split(" ")
  //               .filter((cls) => cls.includes("-"))
  //               .map((cls) => {
  //                 const [prop, val] = cls.split("-");
  //                 if (["brightness", "contrast", "saturate"].includes(prop)) {
  //                   return `${prop}(${val}%)`;
  //                 } else if (prop === "hue-rotate") {
  //                   return `${prop}(${val})`;
  //                 } else if (prop === "blur") {
  //                   return `${prop}(${val})`;
  //                 } else if (prop === "sepia") {
  //                   return `${prop}(1)`;
  //                 }
  //                 return "";
  //               })
  //               .filter(Boolean)
  //               .join(" ");

  //             previewCtx.filter = filterString;
  //           } else {
  //             previewCtx.filter = "none";
  //           }

  //           // Draw video frame into each cell position
  //           previewCtx.drawImage(
  //             tempCanvas,
  //             relativeLeft, relativeTop,
  //             cellWidth, cellHeight
  //           );
  //         }
  //       });

  //       // Draw the overlay if available
  //       if (overlayImg && overlayImg.complete) {
  //         previewCtx.globalCompositeOperation = 'source-over';
  //         previewCtx.filter = "none";
  //         previewCtx.drawImage(
  //           overlayImg,
  //           0, 0,
  //           previewCanvas.width, previewCanvas.height
  //         );
  //       }

  //       // Clear the output canvas
  //       outputCtx.fillStyle = "#FFFFFF";
  //       outputCtx.fillRect(0, 0, desiredWidth, desiredHeight);

  //       // Now render the preview into the output canvas for GIF
  //       if (isCustomFrame) {
  //         // Custom frame: Render two identical images side by side
  //         const singleImageWidth = desiredWidth / 2;
  //         const singleImageHeight = desiredHeight;

  //         const aspectRatio = previewCanvas.width / previewCanvas.height;
  //         const targetAspectRatio = singleImageWidth / singleImageHeight;

  //         let drawWidth = singleImageWidth;
  //         let drawHeight = singleImageHeight;
  //         let offsetX = 0;
  //         let offsetY = 0;

  //         if (aspectRatio > targetAspectRatio) {
  //           drawHeight = singleImageWidth / aspectRatio;
  //           offsetY = (singleImageHeight - drawHeight) / 2;
  //         } else {
  //           drawWidth = singleImageHeight * aspectRatio;
  //           offsetX = (singleImageWidth - drawWidth) / 2;
  //         }

  //         // Draw first copy (left)
  //         outputCtx.drawImage(
  //           previewCanvas,
  //           0, 0, previewCanvas.width, previewCanvas.height,
  //           offsetX, offsetY, drawWidth, drawHeight
  //         );

  //         // Draw second copy (right)
  //         outputCtx.drawImage(
  //           previewCanvas,
  //           0, 0, previewCanvas.width, previewCanvas.height,
  //           singleImageWidth + offsetX, offsetY, drawWidth, drawHeight
  //         );
  //       } else {
  //         // Regular frame: Single image
  //         const aspectRatio = previewCanvas.width / previewCanvas.height;
  //         const targetAspectRatio = desiredWidth / desiredHeight;

  //         let drawWidth = desiredWidth;
  //         let drawHeight = desiredHeight;
  //         let offsetX = 0;
  //         let offsetY = 0;

  //         if (aspectRatio > targetAspectRatio) {
  //           drawHeight = desiredWidth / aspectRatio;
  //           offsetY = (desiredHeight - drawHeight) / 2;
  //         } else {
  //           drawWidth = desiredHeight * aspectRatio;
  //           offsetX = (desiredWidth - drawWidth) / 2;
  //         }

  //         outputCtx.drawImage(
  //           previewCanvas,
  //           0, 0, previewCanvas.width, previewCanvas.height,
  //           offsetX, offsetY, drawWidth, drawHeight
  //         );
  //       }

  //       // Add the frame to the GIF
  //       const frameDelay = Math.min(200, Math.max(100, 500 / frameCount));
  //       gif.addFrame(outputCanvas, { copy: true, delay: frameDelay });

  //     }

  //     // Render the GIF
  //     return new Promise<string>((resolve) => {
  //       gif.on('finished', (blob: Blob) => {
  //         console.log("GIF rendered successfully, size:", Math.round(blob.size / 1024), "KB");
  //         const gifUrl = URL.createObjectURL(blob);
  //         resolve(gifUrl);
  //       });

  //       gif.render();
  //     });
  //   } catch (error) {
  //     console.error("Lỗi khi tạo GIF chất lượng cao:", error);
  //     alert("❌ Có lỗi xảy ra khi tạo GIF. Vui lòng thử lại.");
  //   }
  // };

  const generateHighQualityImage = async (isLandscape: boolean): Promise<string | void> => {
    const previewContent = printPreviewRef.current;
    if (!previewContent) return;

    try {
      const isCustomFrame = selectedFrame?.isCustom === true;
      // Tăng độ phân giải xuất ảnh để có chất lượng in tốt hơn (300+ DPI)
      const desiredWidth = isLandscape ? 3600 : 2400;  // Tăng gấp đôi - hỗ trợ 300 DPI cho in 12" x 8" hoặc 8" x 12"
      const desiredHeight = isLandscape ? 2400 : 3600; // Tăng gấp đôi
      const rect = previewContent.getBoundingClientRect();
      const scaleFactor = Math.max(desiredWidth / (isCustomFrame ? rect.width * 2 : rect.width), 5); // Tăng scale factor

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

      // Chọn định dạng xuất phù hợp với nhu cầu chất lượng cao
      // Nếu bạn cần chất lượng cao nhất không nén, sử dụng PNG
      // const highQualityImageUrl = finalCanvas.toDataURL("image/png");

      // Hoặc sử dụng JPEG với chất lượng tối đa (1.0) nếu kích thước file là vấn đề
      const highQualityImageUrl = finalCanvas.toDataURL("image/jpeg", 1.0);

      console.log("Ảnh đã được tạo với độ phân giải:", desiredWidth, "x", desiredHeight);
      return highQualityImageUrl;
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
    const previewHeight = isLandscape ? "4in" : "7.2in";
    const previewWidth = isLandscape ? "7.2in" : "4in";
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
          width: selectedFrame.isCustom ? "2.4in" : previewWidth,
          border: selectedFrame.isCustom ? "1px dashed #ff69b4" : "none",
        }}
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

      <header className="flex justify-between items-start w-full p-6 z-10">
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
        <div className="flex gap-8">
          {/* Left column - Frame preview */}
          <div className="flex-1/3 rounded-lg flex flex-col items-center justify-center ">
            <div className="w-full flex justify-center">
              <div className={`w-full flex ${selectedFrame && selectedFrame.columns > selectedFrame.rows && !selectedFrame.isCustom ? 'max-w-xl' : 'max-w-md'} mx-auto`}>
                {renderPreview()}
              </div>

            </div>
          </div>

          {/* Right column - Filter options and Frame Templates */}
          <div className="   gap-8 mr-10">
            {/* Enhanced Skin Beautifying Filters */}
            <div className=" bg-zinc-200 rounded-2xl p-2 border border-indigo-500/30  ">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-black">
                      Bộ lọc làm đẹp da
                    </h3>
                    <p className="text-sm text-black opacity-80">Chọn hiệu ứng yêu thích</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => scrollCarousel(skinFilterRef, "left")}
                    className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl"
                  >
                    <ChevronLeft size={20} className="text-white" />
                  </button>
                  <button
                    onClick={() => scrollCarousel(skinFilterRef, "right")}
                    className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl"
                  >
                    <ChevronRight size={20} className="text-white" />
                  </button>
                </div>
              </div>

              <div
                ref={skinFilterRef}
                className="flex gap-4 overflow-x-auto hide-scrollbar pb-2 scroll-smooth"
                style={{ scrollBehavior: "smooth" }}
              >
                {skinFilters.map((filter) => (
                  <div
                    key={filter.id}
                    onClick={() => handleFilterSelect(filter)}
                    className="flex-shrink-0 w-40 cursor-pointer"
                  >
                    <div
                      className={`relative rounded-2xl overflow-hidden ${selectedFilter.id === filter.id
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
                        <div className="absolute top-2 right-2 w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <span className="text-lg">{filter.icon}</span>
                        </div>

                        {/* Selected indicator */}
                        {selectedFilter.id === filter.id && (
                          <div className="absolute bottom-2 left-2 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                            <div className="w-3 h-3 bg-white rounded-full"></div>
                          </div>
                        )}
                      </div>

                      <div
                        className={`p-3 text-center ${selectedFilter.id === filter.id
                          ? "bg-pink-600/80"
                          : "bg-purple-900/60"
                          }`}
                      >
                        <span className="text-sm font-medium text-white">
                          {filter.name}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Enhanced Frame Templates */}
            <div className=" bg-zinc-200 rounded-2xl p-2 border border-indigo-500/30 mt-2 ">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl">
                    <ImageIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-black">
                      Mẫu khung ảnh
                    </h3>
                    <p className="text-sm text-black opacity-80">Tùy chỉnh khung cho ảnh</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => scrollCarousel(frameTemplateRef, "left")}
                    className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl"
                  >
                    <ChevronLeft size={20} className="text-white" />
                  </button>
                  <button
                    onClick={() => scrollCarousel(frameTemplateRef, "right")}
                    className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl"
                  >
                    <ChevronRight size={20} className="text-white" />
                  </button>
                </div>
              </div>

              <div
                ref={frameTemplateRef}
                className="flex gap-4 overflow-x-auto hide-scrollbar pb-2 scroll-smooth"
                style={{ scrollBehavior: "smooth" }}
              >
                {loading ? (
                  <div className="flex-shrink-0 w-40 h-40 bg-gradient-to-br from-indigo-800/50 to-purple-800/50 rounded-2xl flex items-center justify-center border border-indigo-500/30">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-3 border-b-3 border-indigo-400"></div>
                      <div className="absolute inset-0 animate-ping rounded-full h-10 w-10 border border-indigo-400/30"></div>
                    </div>
                  </div>
                ) : frameTemplates.length > 0 ? (
                  frameTemplates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => setSelectedTemplate(template)}
                      className="flex-shrink-0 w-40 cursor-pointer"
                    >
                      <div
                        className={`relative rounded-2xl overflow-hidden ${selectedTemplate?.id === template.id
                          ? "border-2 border-indigo-400"
                          : "border border-indigo-400/50"
                          }`}
                      >
                        <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-indigo-900/50 to-purple-900/50">
                          <img
                            src={template.preview || template.path}
                            alt={template.name}
                            className="w-full h-full object-cover"
                          />

                          {/* Selected indicator */}
                          {selectedTemplate?.id === template.id && (
                            <div className="absolute bottom-2 left-2 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                              <div className="w-3 h-3 bg-white rounded-full"></div>
                            </div>
                          )}
                        </div>

                        <div
                          className={`p-3 text-center ${selectedTemplate?.id === template.id
                            ? "bg-indigo-600/80"
                            : "bg-indigo-900/60"
                            }`}
                        >
                          <span className="text-sm font-medium text-white">
                            {template.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex-shrink-0 w-full flex items-center justify-center h-40 bg-gradient-to-br from-indigo-800/30 to-purple-800/30 rounded-2xl border border-indigo-500/30">
                    <div className="text-center">
                      <ImageIcon className="w-12 h-12 text-indigo-300 mx-auto mb-2 opacity-50" />
                      <p className="text-indigo-200">Không có mẫu khung ảnh cho kiểu khung này</p>
                    </div>
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


