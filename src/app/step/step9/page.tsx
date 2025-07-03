"use client";

import HomeButton from "@/app/components/HomeButton";
import LogoApp from "@/app/components/LogoApp";
import { useBooth } from "@/lib/context/BoothContext";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from "react";

export default function Step9() {
  const router = useRouter();
  const { imageQrCode, videoQrCode, gifQrCode, clearAllBoothData } = useBooth();

  // State to track loaded media from localStorage
  const [mediaUrls, setMediaUrls] = useState({
    image: "",
    video: "",
    gif: ""
  });
  
  // Add loading state for media generation
  const [isLoading, setIsLoading] = useState({
    video: true,
    gif: true
  });

  const handleBack = () => {
    router.push("/step/step8");
  };

  // Load QR code URLs from localStorage on mount and create media page URLs
  useEffect(() => {
    const baseUrl = typeof window !== 'undefined' ? 
      `${window.location.protocol}//${window.location.host}` : '';
    
    // Extract media IDs from URLs to create media page links
    const extractMediaId = (url: string | null): string => {
      if (!url) return '';
      // Parse the URL to extract file name which contains the ID
      const matches = url.match(/\/([^/]+)\_photobooth\.(jpg|gif|webm|mp4)$/);
      if (matches && matches[1]) {
        return `${baseUrl}/media/${matches[1]}`;
      }
      return url;
    };
    
    const imageUrl = localStorage.getItem("imageQrCode") || imageQrCode;
    const videoUrl = localStorage.getItem("videoQrCode") || videoQrCode;
    const gifUrl = localStorage.getItem("gifQrCode") || gifQrCode;
    
    setMediaUrls({
      image: extractMediaId(imageUrl),
      video: extractMediaId(videoUrl),
      gif: extractMediaId(gifUrl)
    });
    
    // Update loading states based on availability
    setIsLoading({
      video: !videoUrl,
      gif: !gifUrl
    });
    
    // Check for media updates every 2 seconds
    const checkMediaInterval = setInterval(() => {
      const updatedVideoUrl = localStorage.getItem("videoQrCode");
      const updatedGifUrl = localStorage.getItem("gifQrCode");
      
      if (updatedVideoUrl && !videoUrl) {
        setMediaUrls(prev => ({
          ...prev,
          video: extractMediaId(updatedVideoUrl)
        }));
        setIsLoading(prev => ({ ...prev, video: false }));
      }
      
      if (updatedGifUrl && !gifUrl) {
        setMediaUrls(prev => ({
          ...prev,
          gif: extractMediaId(updatedGifUrl)
        }));
        setIsLoading(prev => ({ ...prev, gif: false }));
      }
      
      // If both are loaded or 15 seconds passed, clear interval
      if ((updatedVideoUrl && updatedGifUrl) || 
          (Date.now() - performance.now() > 15000)) {
        clearInterval(checkMediaInterval);
      }
    }, 2000);
    
    return () => clearInterval(checkMediaInterval);
  }, [imageQrCode, videoQrCode, gifQrCode]);
  
  // Set a timeout to stop showing loading after a certain amount of time
  useEffect(() => {
    const loadingTimeout = setTimeout(() => {
      setIsLoading({
        video: false,
        gif: false
      });
    }, 15000); // Stop showing loading after 15 seconds maximum
    
    return () => clearTimeout(loadingTimeout);
  }, []);
  
  // Automatically redirect to home after 60 seconds and clear data
  useEffect(() => {
    const timer = setTimeout(() => {
      clearAllBoothData();
      router.push("/");
    }, 60000);
    
    return () => clearTimeout(timer);
  }, [router, clearAllBoothData]);

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

      <header className="flex justify-between items-start w-full p-6 z-10">
        <div className="flex items-center">
          <LogoApp />

        </div>
        <h1 className="text-white text-3xl md:text-5xl lg:text-6xl font-bold text-center tracking-wide">
          ẢNH CỦA BẠN ĐÃ SẴN SÀNG!
        </h1>
        <HomeButton />
      </header>

      {/* Main content */}
      <main className="flex flex-col items-center justify-center flex-grow z-10 w-full max-w-6xl px-8">
        <h2 className="text-4xl font-bold mb-8 text-center">Quý khách có thể lấy ảnh tại khe bên dưới / phía ngoài cửa chụp</h2>

        <div className="flex flex-wrap items-center gap-6 justify-center w-full mb-8">
          {/* Image QR Code */}
          <div className="flex flex-col items-center bg-white bg-opacity-20 p-6 rounded-lg shadow-lg">
            <QRCodeSVG value={mediaUrls.image || ""} size={200} marginSize={2} />
            <p className="text-center text-2xl font-bold text-white mt-4">Ảnh của bạn</p>
            <div className="flex items-center mt-2 bg-pink-600/40 px-4 py-2 rounded-full">
              <span className="text-white">Scan để xem</span>
            </div>
          </div>

          {/* Video QR Code with loading state */}
          <div className="flex flex-col items-center bg-white bg-opacity-20 p-6 rounded-lg shadow-lg">
            {isLoading.video ? (
              <div className="w-[200px] h-[200px] flex items-center justify-center bg-black/20 rounded-lg">
                <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
              </div>
            ) : (
              mediaUrls.video ? (
                <QRCodeSVG value={mediaUrls.video} size={200} marginSize={2} />
              ) : (
                <div className="w-[200px] h-[200px] flex items-center justify-center bg-black/20 rounded-lg">
                  <p className="text-white text-sm text-center px-4">Video không khả dụng</p>
                </div>
              )
            )}
            <p className="text-center text-2xl font-bold text-white mt-4">Video hiệu ứng</p>
            <div className="flex items-center mt-2 bg-blue-600/40 px-4 py-2 rounded-full">
              <span className="text-white">
                {isLoading.video ? "Đang tạo..." : (mediaUrls.video ? "Scan để xem" : "Không khả dụng")}
              </span>
            </div>
          </div>

          {/* GIF QR Code with loading state */}
          <div className="flex flex-col items-center bg-white bg-opacity-20 p-6 rounded-lg shadow-lg">
            {isLoading.gif ? (
              <div className="w-[200px] h-[200px] flex items-center justify-center bg-black/20 rounded-lg">
                <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
              </div>
            ) : (
              mediaUrls.gif ? (
                <QRCodeSVG value={mediaUrls.gif} size={200} marginSize={2} />
              ) : (
                <div className="w-[200px] h-[200px] flex items-center justify-center bg-black/20 rounded-lg">
                  <p className="text-white text-sm text-center px-4">GIF không khả dụng</p>
                </div>
              )
            )}
            <p className="text-center text-2xl font-bold text-white mt-4">GIF hoạt hình</p>
            <div className="flex items-center mt-2 bg-purple-600/40 px-4 py-2 rounded-full">
              <span className="text-white">
                {isLoading.gif ? "Đang tạo..." : (mediaUrls.gif ? "Scan để xem" : "Không khả dụng")}
              </span>
            </div>
          </div>
        </div>

        {/* Media generation status message */}
        <div className="text-center text-white bg-black/30 p-4 rounded-lg max-w-2xl">
          <p className="text-lg">Video và GIF có thể mất vài giây để tạo ra. Vui lòng đợi hoặc làm mới trang nếu chưa thấy xuất hiện.</p>
        </div>
      </main>

      {/* Navigation buttons */}
      <div className="flex justify-between w-full px-12 py-16 z-10">
        <button
          onClick={handleBack}
          className="rounded-full p-6 bg-transparent border-2 border-pink-500 hover:bg-purple-900 hover:bg-opacity-30 transition glow-button"
        >
          <div className="w-12 h-12 flex items-center justify-center text-pink-500 text-4xl">
            &#8592;
          </div>
        </button>
        <h1 className="text-white text-2xl md:text-3xl lg:text-4xl font-bold text-center tracking-wide">
          Cảm ơn quý khách đã ghé thăm S Photobooth
        </h1>
        <button
          onClick={() => {
            clearAllBoothData();
            router.push("/");
          }}
          className="rounded-full p-6 bg-transparent border-2 border-green-500 hover:bg-purple-900 hover:bg-opacity-30 transition glow-button"
        >
          <div className="w-12 h-12 flex items-center justify-center text-green-500 text-xl">
            Trang chủ
          </div>
        </button>
      </div>
    </div>
  );
}
