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
  const { imageQrCode, videoQrCode, gifQrCode, clearAllBoothData, currentStore } = useBooth();

  // State for media session
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [sessionUrl, setSessionUrl] = useState<string>("");
  const [isCreatingSession, setIsCreatingSession] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    const createMediaSession = async () => {
      try {
        setIsCreatingSession(true);

        const imageUrl = localStorage.getItem("imageQrCode") || imageQrCode;
        const videoUrl = localStorage.getItem("videoQrCode") || videoQrCode;
        const gifUrl = localStorage.getItem("gifQrCode") || gifQrCode;

        console.log('Media URLs:', { imageUrl, videoUrl, gifUrl });

        // Filter out empty URLs
        const mediaUrls = [imageUrl, videoUrl, gifUrl].filter(url => url && url.trim() !== '');

        if (mediaUrls.length === 0) {
          setError("Không tìm thấy media nào để tạo session");
          return;
        }


        // Create media session via API
        const response = await fetch('/api/media-session-temp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mediaUrls: mediaUrls
          })
        });

        console.log('API Response Status:', response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.error('API Error:', errorData);
          throw new Error('Failed to create media session');
        }

        const session = await response.json();
        console.log('Created session:', session);
        setSessionCode(session.sessionCode);

        // Create session URL
        const baseUrl = typeof window !== 'undefined' ?
          `${window.location.protocol}//${window.location.host}` : '';
        setSessionUrl(`${baseUrl}/session-temp/${session.sessionCode}`);

      } catch (err) {
        console.error('Error creating media session:', err);
        setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
      } finally {
        setIsCreatingSession(false);
      }
    };

    // Wait a bit for media to be processed, then create session
    const timer = setTimeout(createMediaSession, 2000);

    return () => clearTimeout(timer);
  }, [imageQrCode, videoQrCode, gifQrCode]);

  // Automatically redirect to home after 60 seconds and clear data
  useEffect(() => {
    const timer = setTimeout(() => {
      clearAllBoothData();
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
             {isCreatingSession ? (
              <div className="w-[250px] h-[250px] flex items-center justify-center bg-black/20 rounded-lg">
                <div className="flex flex-col items-center">
                  <Loader2 className="w-16 h-16 text-pink-400 animate-spin mb-4" />
                  <p className="text-white text-center">Đang tạo session...</p>
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
