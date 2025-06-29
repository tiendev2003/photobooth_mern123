"use client";

import { useBooth } from "@/lib/context/BoothContext";
import { ArrowLeft, ArrowRight, Camera } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
const timeoutDuration = 2; // 10 seconds
export default function Step6() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const { photos, setPhotos } = useBooth();
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [shotCount, setShotCount] = useState<number>(0);
  const maxShots: number = 8;

  useEffect(() => {
    let videoElement = videoRef.current;
    
    async function startCamera() {
      try {
        const stream: MediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoElement = videoRef.current; // Store the current video element
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
      }
    }
    startCamera();

    // Cleanup khi component unmount
    return () => {
      if (videoElement && videoElement.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  // Chụp ảnh
  const capturePhoto = (): void => {
    if (!videoRef.current) return;

    const canvas: HTMLCanvasElement = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');
    if (ctx) {
      // Flip the image horizontally when capturing to correct the mirror effect
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      // Reset transformation matrix to the identity matrix
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      
      const imageData: string = canvas.toDataURL('image/jpeg');
      const timestamp: string = new Date().toLocaleString();
      setPhotos([{ image: imageData, timestamp }, ...photos]);
    }
  };

  // Xử lý đếm ngược và chụp ảnh tự động
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (isCapturing && countdown !== null && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (isCapturing && countdown === 0 && shotCount < maxShots) {
      capturePhoto();
      setShotCount((prev) => prev + 1);
      setCountdown(timeoutDuration);
    } else if (shotCount >= maxShots) {
      setIsCapturing(false);
      setCountdown(null);
      // Add a short delay before navigating to step7
      setTimeout(() => {
        router.push("/step/step7");
      }, 1500); // 1.5 seconds delay to show all photos before navigating
    }
    return () => {
      clearTimeout(timer);
    };
  }, [countdown, isCapturing, shotCount, router, capturePhoto]);

  // Bắt đầu quá trình chụp
  const startCapture = (): void => {
    if (!isCapturing && shotCount < maxShots) {
      setIsCapturing(true);
      setCountdown(timeoutDuration);
      setShotCount(0);
      setPhotos([]);  // Reset photos in context when starting a new capture session
    }
  };


  const handleBack = () => {
    router.push("/step/step5");
  };

  const handleNext = () => {
    // Only allow navigation if all photos have been captured
    if (photos.length >= maxShots && !isCapturing) {
      router.push("/step/step7");
    }
  };

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

      {/* Header */}
      <header className="flex justify-between items-center w-full p-6 z-10">
        <div className="flex items-center">
          <Image
            src="/logo.svg"
            alt="Music Box Photobooth"
            width={150}
            height={50}
            className="glow-image"
          />
        </div>

        <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-600">
          Chế độ chụp hình
        </div>
      </header>

      {/* Main content */}
      <main className="flex flex-col md:flex-row items-center justify-center flex-grow z-10 w-full max-w-7xl px-4 gap-6">
        <div className="w-full md:w-2/3 aspect-[4/3] bg-black bg-opacity-70 rounded-2xl border border-purple-500 shadow-lg shadow-purple-500/30 overflow-hidden relative">
          <video
            ref={videoRef}
            autoPlay
            className="w-full h-full object-cover transform scale-x-[-1]"
          />
        </div>
        

        <div className="w-full md:w-1/3 h-full flex flex-col gap-4">
          {/* Controls */}
          <div className="bg-black bg-opacity-70 rounded-xl border border-purple-500 shadow-md p-6 flex flex-col items-center gap-4">
            <h2 className="text-xl font-semibold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-600">
              Bảng điều khiển
            </h2>

            <div className="text-center">
              <p className="text-gray-300">Đã chụp: <span className="font-bold text-white">{shotCount}/{maxShots}</span></p>
            </div>

            <button
              onClick={startCapture}
              disabled={isCapturing}
              className={`mt-2 px-8 py-3 rounded-full font-semibold text-white flex items-center gap-2 transition-all
                ${isCapturing
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 shadow-lg hover:shadow-pink-500/30'
                }`}
            >
              <Camera size={20} />
              {isCapturing ? `Đang chụp (${countdown}s)` : 'Bắt đầu chụp'}
            </button>
          </div>

          {/* Photo gallery */}
          <div className="flex-1 bg-black bg-opacity-70 rounded-xl border border-purple-500 shadow-md p-4 overflow-hidden flex flex-col">
            <h2 className="text-xl font-semibold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-600">
              Ảnh đã chụp ({photos.length})
            </h2>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {photos.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-400">
                  <Camera size={40} className="mb-2 opacity-50" />
                 
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {photos.map((photo, index) => (
                    <div
                      key={index}
                      className="relative border border-purple-700 rounded-lg overflow-hidden group hover:border-pink-500 transition-all duration-300"
                    >
                      <img
                        src={photo.image}
                        alt={`Photo ${index + 1}`}
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        {photo.timestamp}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Navigation buttons */}
      <div className="flex flex-col items-center w-full pb-6 z-10">
       
        <div className="flex justify-between w-full px-12 pb-10">
          <button
            onClick={handleBack}
            className="rounded-full p-4 bg-transparent border-2 border-pink-500 hover:bg-purple-900 hover:bg-opacity-30 transition-all glow-button transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isCapturing}
          >
            <div className="w-12 h-12 flex items-center justify-center text-pink-500">
              <ArrowLeft className="w-8 h-8" />
            </div>
          </button>

        <button
          onClick={handleNext}
          disabled={photos.length < maxShots || isCapturing}
          className={`rounded-full p-4 border-2 border-green-500 transition-all transform
            ${photos.length < maxShots || isCapturing 
              ? 'opacity-50 cursor-not-allowed border-gray-500' 
              : 'hover:bg-green-900 hover:bg-opacity-30 glow-button-green hover:scale-105'
            }`}
        >
          <div className={`w-12 h-12 flex items-center justify-center ${photos.length < maxShots || isCapturing ? 'text-gray-500' : 'text-green-500'}`}>
            <ArrowRight className="w-8 h-8" />
          </div>
        </button>
        </div>
      </div>
    </div>
  );
}

