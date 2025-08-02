"use client";

import StoreBackground from "@/app/components/StoreBackground";
import StoreHeader from "@/app/components/StoreHeader";
import { useBooth } from "@/lib/context/BoothContext";
import { getStorePrimaryColor } from "@/lib/storeUtils";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from "react";

export default function Step9() {
  const router = useRouter();
  const { clearAllBoothData, currentStore, videos, setVideoQrCode, setGifQrCode } = useBooth();

  // State for media session
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [sessionUrl, setSessionUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
 
  useEffect(() => {
    const getMediaSessionCode = () => {
      try {
        // Lấy session code từ localStorage hoặc từ step8
        const storedSessionCode = localStorage.getItem("mediaSessionCode");

        if (storedSessionCode) {
          setSessionCode(storedSessionCode);

          // Tạo session URL
          const baseUrl = typeof window !== 'undefined' ?
            `${window.location.protocol}//${window.location.host}` : '';
          setSessionUrl(`${baseUrl}/session/${storedSessionCode}`);

          console.log('Using stored session code:', storedSessionCode);
        } else {
          setError("Không tìm thấy session code");
        }
      } catch (err) {
        console.error('Error getting session code:', err);
        setError('Có lỗi xảy ra khi lấy session code');
      } finally {
        setIsLoading(false);
      }
    };
    // Đợi một chút để step8 hoàn thành việc tạo session
    const timer = setTimeout(getMediaSessionCode, 1000);
    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Process video when component mounts
  useEffect(() => {
    const processVideos = async () => {
      try {
        // Kiểm tra xem có dữ liệu video processing không
        const videoProcessingDataStr = localStorage.getItem("videoProcessingData");
        const videosForProcessingStr = localStorage.getItem("videosForProcessing");
        
        if (!videoProcessingDataStr) {
          console.log("No video processing data found");
          return;
        }

        const videoProcessingData = JSON.parse(videoProcessingDataStr);
        if (!videoProcessingData.hasVideos) {
          console.log("No videos to process");
          return;
        }

        // Lấy videos từ localStorage hoặc BoothContext
        let allVideos = videos;
        if ((!allVideos || allVideos.length === 0) && videosForProcessingStr) {
          allVideos = JSON.parse(videosForProcessingStr);
        }

        if (!allVideos || allVideos.length === 0) {
          console.log("No videos found to process");
          return;
        }
        
        // Lấy selectedIndices từ localStorage (được lưu từ step8)
        const selectedIndicesStr = localStorage.getItem("selectedIndices");
        let selectedIndices: number[] = [];
        
        if (selectedIndicesStr) {
          try {
            selectedIndices = JSON.parse(selectedIndicesStr);
            console.log("Using selected indices:", selectedIndices);
          } catch (error) {
            console.error("Error parsing selectedIndices:", error);
          }
        }
        
        // Chỉ lấy những video thuộc các ảnh đã chọn
        const videosToProcess = selectedIndices.length > 0 
          ? selectedIndices
              .filter((idx: number | undefined) => idx !== undefined)
              .map((idx: number) => allVideos[idx])
              .filter((video: string) => video)
          : allVideos;  
          
        console.log("Selected videos for processing:", videosToProcess.length);

 
        const pythonServerUrl = process.env.NEXT_PUBLIC_API_BACKEND || 'http://localhost:4000';
        const videoFormData = new FormData();
        
        videoFormData.append("frame_type", videoProcessingData.frameType);
        videoFormData.append("duration", videoProcessingData.duration);
        videoFormData.append("mediaSessionCode", videoProcessingData.mediaSessionCode);

 
        // Convert video blob URLs to files
        for (let i = 0; i < videosToProcess.length; i++) {
          try {
            const response = await fetch(videosToProcess[i]);
            const blob = await response.blob();
            const file = new File([blob], `video_${i}.webm`, { type: 'video/webm' });
            videoFormData.append("files", file);
          } catch (error) {
            console.error(`Error converting video ${i}:`, error);
          }
        }

        // Add background and overlay if available
        if (videoProcessingData.selectedTemplate?.background) {
          try {
            const response = await fetch(videoProcessingData.selectedTemplate.background);
            const blob = await response.blob();
            const file = new File([blob], 'background.jpg', { type: 'image/jpeg' });
            videoFormData.append("background", file);
          } catch (error) {
            console.error("Error converting background:", error);
          }
        }

        if (videoProcessingData.selectedTemplate?.overlay) {
          try {
            const response = await fetch(videoProcessingData.selectedTemplate.overlay);
            const blob = await response.blob();
            const file = new File([blob], 'overlay.png', { type: 'image/png' });
            videoFormData.append("overlay", file);
          } catch (error) {
            console.error("Error converting overlay:", error);
          }
        }

 
        // Call video processing API
        const videoResponse = await fetch(`${pythonServerUrl}/api/process-video`, {
          method: 'POST',
          body: videoFormData,
        });

        if (videoResponse.ok) {
          const videoResult = await videoResponse.json();
          console.log("Video API Response:", videoResult);

          // Update video results
          if (videoResult.video) {
            setVideoQrCode(videoResult.video);
            localStorage.setItem("videoQrCode", videoResult.video);
            console.log("Video URL saved:", videoResult.video);
          }

          if (videoResult.fast_video) {
            setGifQrCode(videoResult.fast_video);
            localStorage.setItem("gifQrCode", videoResult.fast_video);
            console.log("Fast video URL saved:", videoResult.fast_video);
          }

         } else {
          console.error("Video processing failed:", await videoResponse.text());
         }

      } catch (error) {
        console.error("Error in video processing:", error);
       } finally {
         // Xóa dữ liệu video processing sau khi hoàn thành
        localStorage.removeItem("videoProcessingData");
        localStorage.removeItem("videosForProcessing");
        localStorage.removeItem("selectedIndices");
      }
    };

    // Đợi một chút để component render xong
    const timer = setTimeout(processVideos, 2000);
    return () => clearTimeout(timer);
  }, [videos, setVideoQrCode, setGifQrCode]);

  // Automatically redirect to home after 60 seconds and clear data
  useEffect(() => {
    const timer = setTimeout(() => {
      clearAllBoothData();
      localStorage.removeItem("mediaSessionCode");
      localStorage.removeItem("videoProcessingData");
      localStorage.removeItem("videosForProcessing");
      localStorage.removeItem("selectedIndices");
      localStorage.removeItem("imageQrCode");
      localStorage.removeItem("videoQrCode");
      localStorage.removeItem("gifQrCode");
      router.push("/");
    }, 60000);

    return () => clearTimeout(timer);
  }, [router, clearAllBoothData]);

  return (
    <StoreBackground currentStore={currentStore}>
      <StoreHeader
        currentStore={currentStore}
        title="ẢNH CỦA BẠN ĐÃ SẴN SÀNG!"
      />

      {/* Main content */}
      <main className="flex flex-col items-center justify-center flex-grow z-10 w-full max-w-6xl px-8">
        <h2 className="text-4xl font-bold mb-8 text-center">
          Quét mã QR để xem tất cả ảnh/video/GIF của bạn
        </h2>

        <div className="flex flex-wrap justify-center gap-8 w-full mb-8">
          {/* QR Code for All Media Session */}
          <div className="flex flex-col items-center bg-white bg-opacity-20 p-6 rounded-lg shadow-lg">
            {isLoading ? (
              <div className="w-[250px] h-[250px] flex items-center justify-center bg-black/20 rounded-lg">
                <div className="flex flex-col items-center">
                  <Loader2 className="w-16 h-16 text-pink-400 animate-spin mb-4" />
                  <p className="text-white text-center">Đang tải session...</p>
                </div>
              </div>
            ) : error ? (
              <div className="w-[250px] h-[250px] flex items-center justify-center bg-black/20 rounded-lg">
                <div className="text-center p-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              </div>
            ) : sessionCode && sessionUrl ? (
              <QRCodeSVG
                value={sessionUrl}
                size={250}
                marginSize={2}
                bgColor="#ffffff"
                fgColor="#000000"
              />
            ) : (
              <div className="w-[250px] h-[250px] flex items-center justify-center bg-black/20 rounded-lg">
                <p className="text-white text-sm text-center px-4">Đang chuẩn bị...</p>
              </div>
            )}
          </div>
        </div>
 


      </main>

      <div className="flex justify-center w-full px-16 pb-20 z-10">
        <h1
          className="text-white text-2xl md:text-3xl lg:text-4xl font-bold text-center tracking-wide"
          style={{ color: getStorePrimaryColor(currentStore) }}
        >
          {currentStore?.name ?
            `Cảm ơn quý khách đã ghé thăm ${currentStore.name}` :
            "Cảm ơn quý khách đã ghé thăm S Photobooth"
          }
        </h1>
      </div>
    </StoreBackground>
  );
}
