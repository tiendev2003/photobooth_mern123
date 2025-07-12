"use client";

import StoreBackground from "@/app/components/StoreBackground";
import StoreHeader from "@/app/components/StoreHeader";
import { useBooth } from "@/lib/context/BoothContext";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from "react";

export default function Step9() {
  const router = useRouter();
  const { clearAllBoothData, currentStore, imageQrCode, videoQrCode, gifQrCode } = useBooth();

  // State for media session and processing status
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [sessionUrl, setSessionUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State to track the background processing of video and GIF
  const [videoProcessing, setVideoProcessing] = useState<boolean>(true);
  const [gifProcessing, setGifProcessing] = useState<boolean>(true);
  const [mediaStatus, setMediaStatus] = useState<{
    image: boolean,
    video: boolean,
    gif: boolean
  }>({
    image: false,
    video: false,
    gif: false
  });
  console.log("Step9 component rendered", videoProcessing, gifProcessing, imageQrCode, videoQrCode, mediaStatus);
  useEffect(() => {
    const storedImageUrl = localStorage.getItem("imageQrCode");
    if (imageQrCode || storedImageUrl) {
      setMediaStatus(prev => ({ ...prev, image: true }));
    }

     const checkInterval = setInterval(() => {
       const storedVideoUrl = localStorage.getItem("videoQrCode");
      if (videoQrCode || storedVideoUrl) {
        setMediaStatus(prev => ({ ...prev, video: true }));
        setVideoProcessing(false);
      }

      // Check for GIF QR code
      const storedGifUrl = localStorage.getItem("gifQrCode");
      if (gifQrCode || storedGifUrl) {
        setMediaStatus(prev => ({ ...prev, gif: true }));
        setGifProcessing(false);
      }

      // If both video and GIF are done, clear the interval
      if ((videoQrCode || storedVideoUrl) && (gifQrCode || storedGifUrl)) {
        clearInterval(checkInterval);
      }
    }, 1000);

    // Cleanup on component unmount
    return () => clearInterval(checkInterval);
  }, [imageQrCode, videoQrCode, gifQrCode]);

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

          // Also check for media URLs in localStorage
          const storedImageUrl = localStorage.getItem("imageQrCode");
          const storedVideoUrl = localStorage.getItem("videoQrCode");
          const storedGifUrl = localStorage.getItem("gifQrCode");

          setMediaStatus({
            image: !!storedImageUrl,
            video: !!storedVideoUrl,
            gif: !!storedGifUrl
          });

          if (storedVideoUrl) setVideoProcessing(false);
          if (storedGifUrl) setGifProcessing(false);
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
    const timer = setTimeout(getMediaSessionCode, 500); // Reduced from 1000 to 500ms for faster load
    return () => clearTimeout(timer);
  }, []);

  // Automatically redirect to home after 60 seconds and clear data
  useEffect(() => {
    const timer = setTimeout(() => {
      clearAllBoothData();
      localStorage.removeItem("mediaSessionCode");
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
                <p className="text-white text-center">QR code không khả dụng</p>
              </div>
            )}

          </div>
        </div>

        <div className="text-center p-4 bg-white/10 rounded-lg">
          <p className="text-white">Chúng tôi đang hoàn tất video và GIF của bạn. <br />Tất cả đều sẽ có sẵn khi bạn quét mã QR!</p>
        </div>
      </main>
    </StoreBackground>
  );
}
