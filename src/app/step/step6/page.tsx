"use client";

import HomeButton from "@/app/components/HomeButton";
import LogoApp from "@/app/components/LogoApp";
import { useBooth } from "@/lib/context/BoothContext";
import { TIMEOUT_DURATION } from "@/lib/utils";
import { Camera, CameraOff, Monitor } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";


export default function Step6() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { photos, setPhotos, setVideos, selectedFrame } = useBooth();
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [shotCount, setShotCount] = useState<number>(0);
  const [isCameraLoading, setIsCameraLoading] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [showCameraSelector, setShowCameraSelector] = useState<boolean>(false);

  const maxShots: number = (selectedFrame?.columns ?? 1) * (selectedFrame?.rows ?? 1) >= 4 ? (selectedFrame?.columns ?? 1) * (selectedFrame?.rows ?? 1) + 4 : (selectedFrame?.columns ?? 1) * (selectedFrame?.rows ?? 1) + 3;

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsCameraLoading(false);
    }, 4000);

    return () => clearTimeout(timeout);
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;

    recordedChunksRef.current = [];

    try {
      const options = { mimeType: "video/webm;codecs=vp9" };
      const mediaRecorder = new MediaRecorder(streamRef.current, options);

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        const videoUrl = URL.createObjectURL(blob);
        setVideos(prev => [videoUrl, ...prev]);
        console.log("Video recorded and added to the beginning of videos array");
      };

      mediaRecorder.start();
    } catch (e) {
      console.error("Error starting recording:", e);
    }
  }, [setVideos]);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const enumerateCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(videoDevices);

      if (!selectedCameraId && videoDevices.length > 0) {
        setSelectedCameraId(videoDevices[0].deviceId);
      }
    } catch (error) {
      console.error("Error enumerating cameras:", error);
    }
  }, [selectedCameraId]);

  const initializeCamera = useCallback(async (deviceId?: string) => {
    try {
      setCameraError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          width: { ideal: 3840, min: 1280 },
          height: { ideal: 2160, min: 720 },
          deviceId: deviceId ? { exact: deviceId } : undefined,
          facingMode: "user"
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }

    } catch (error) {
      console.error("Error accessing camera:", error);
      setCameraError("Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.");
    }
  }, []);

  useEffect(() => {
    enumerateCameras();
  }, [enumerateCameras]);

  useEffect(() => {
    if (selectedCameraId) {
      initializeCamera(selectedCameraId);
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [selectedCameraId, initializeCamera]);

  const capturePhoto = useCallback((): void => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d", {
      alpha: false,
      desynchronized: false,
      colorSpace: "display-p3",
      willReadFrequently: false
    });

    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      const imageData = canvas.toDataURL("image/jpeg", 1.0);
      const timestamp = new Date().toLocaleString();
      setPhotos([{ image: imageData, timestamp }, ...photos]);

    }
  }, [setPhotos, photos]);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;

    if (isCapturing && countdown !== null && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    else if (isCapturing && countdown === 0 && shotCount < maxShots) {
      stopRecording();

      capturePhoto();

      const newShotCount = shotCount + 1;
      setShotCount(newShotCount);

      if (newShotCount < maxShots) {
        setCountdown(TIMEOUT_DURATION);

        startRecording();
      } else {
        setIsCapturing(false);
        setCountdown(null);
        setIsCompleted(true);
        setTimeout(() => router.push("/step/step7"), 1500);
      }
    }

    return () => clearTimeout(timer);
  }, [countdown, isCapturing, shotCount, maxShots, router, capturePhoto, stopRecording, startRecording]);

  const startCapture = (): void => {
    if (!isCapturing && !isCameraLoading && !cameraError && !isCompleted) {
      setPhotos([]);
      setVideos([]);
      setShotCount(0);

      setIsCapturing(true);
      setCountdown(TIMEOUT_DURATION);

      startRecording();
    }
  };

  const handleCameraChange = useCallback((deviceId: string) => {
    if (!isCapturing) {
      setSelectedCameraId(deviceId);
      setShowCameraSelector(false);
    }
  }, [isCapturing]);

  const handleBack = () => {
    if (!isCapturing && !isCameraLoading) {
      router.push("/step/step5");
    }
  };

  const handleNext = () => {
    if (photos.length >= maxShots && !isCapturing && !isCameraLoading) {
      router.push("/step/step7");
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-between min-h-screen bg-purple-900 text-white overflow-hidden">
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
          Chế độ chụp hình
        </h1>
        <HomeButton />
      </header>

      {/* Main content */}
      <main className="flex flex-col md:flex-row items-center justify-center flex-grow z-10 w-full  px-4 gap-6">
        <div className="aspect-[4/3] bg-black bg-opacity-70 rounded-2xl border border-purple-500 shadow-lg shadow-purple-500/30 overflow-hidden relative">
          {/* Camera selector button */}
          {availableCameras.length > 1 && (
            <div className="absolute top-4 right-4 z-20">
              <button
                onClick={() => setShowCameraSelector(!showCameraSelector)}
                disabled={isCapturing}
                className={`p-3 rounded-full bg-black bg-opacity-70 border border-purple-500 text-white hover:bg-opacity-90 transition-all ${isCapturing ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                title="Chọn camera"
              >
                <Monitor size={20} />
              </button>

              {showCameraSelector && (
                <div className="absolute top-full right-0 mt-2 bg-black bg-opacity-90 rounded-lg border border-purple-500 shadow-lg min-w-48">
                  {availableCameras.map((camera, index) => (
                    <button
                      key={camera.deviceId}
                      onClick={() => handleCameraChange(camera.deviceId)}
                      className={`block w-full px-4 py-3 text-left hover:bg-purple-600 hover:bg-opacity-50 transition-colors ${selectedCameraId === camera.deviceId ? 'bg-purple-600 bg-opacity-70' : ''
                        } ${index === 0 ? 'rounded-t-lg' : ''} ${index === availableCameras.length - 1 ? 'rounded-b-lg' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <Camera size={16} />
                        <span className="text-sm">
                          {camera.label || `Camera ${index + 1}`}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {cameraError ? (
            <div className="w-full h-full flex items-center justify-center bg-black bg-opacity-70">
              <div className="flex flex-col items-center text-red-500">
                <CameraOff size={40} className="mb-2" />
                <p className="text-xl font-semibold text-center">{cameraError}</p>
                <button
                  onClick={() => initializeCamera(selectedCameraId)}
                  className="mt-4 px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Thử lại
                </button>
              </div>
            </div>
          ) : (
            <>
              {isCameraLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-10">
                  <div className="flex flex-col items-center text-white">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
                    <p className="text-lg">Đang khởi tạo camera...</p>
                  </div>
                </div>
              )}
              <video
                ref={videoRef}
                autoPlay
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
            </>
          )}
        </div>

        <div className="w-full md:w-1/5 h-full flex flex-col gap-4">
          <div className="bg-black bg-opacity-70 rounded-xl border border-purple-500 shadow-md p-6 flex flex-col items-center gap-4">
            <h2 className="text-3xl font-semibold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-600">
              Bảng điều khiển
            </h2>
            <div className="text-center">
              <p className="text-gray-300 text-2xl">
                Đã chụp: <span className="font-bold text-white">{shotCount}/{maxShots}</span>
              </p>
            </div>

            <button
              onClick={startCapture}
              disabled={isCapturing || isCameraLoading || cameraError !== null || isCompleted}
              className={`mt-2 px-8 py-3 rounded-full font-semibold text-white flex items-center gap-2 transition-all
                ${isCapturing || isCameraLoading || cameraError || isCompleted
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-pink-600 to-purple-600 shadow-lg hover:shadow-xl"
                }`}
            >
              <Camera size={20} />
              {isCapturing
                ? `Đang chụp (${countdown}s)`
                : isCompleted
                  ? "Đã hoàn thành"
                  : "Bắt đầu chụp"}
            </button>
          </div>

          <h1 className="text-9xl font-bold text-center text-white">
            {isCapturing && `${countdown}s`}
          </h1>

          {/* Photo gallery */}
          <div className="flex-1 bg-black bg-opacity-70 rounded-xl border border-purple-500 shadow-md p-4 overflow-hidden flex flex-col">
            <h2 className="text-xl font-semibold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-600">
              Ảnh đã chụp ({photos.length})
            </h2>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {photos.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-400">
                  <Camera size={40} className="mb-2 opacity-50" />
                  <p>Chưa có ảnh nào được chụp</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {photos.map((photo, index) => (
                    <div
                      key={index}
                      className="relative border border-purple-700 rounded-lg overflow-hidden group transition-all duration-300"
                    >
                      <Image
                        src={photo.image}
                        alt={`Photo ${index + 1}`}
                        width={320}
                        height={320}
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

      <div className="flex justify-between w-full px-16 pb-20 z-10">
        <button
          onClick={handleBack}
          className="rounded-full p-6 bg-transparent border-2 border-white   glow-button"
        >
          <div className="w-12 h-12 flex items-center justify-center text-pink-500 text-4xl">
            &#8592;
          </div>
        </button>

        <button
          onClick={handleNext}
          className="rounded-full p-6 bg-transparent border-2 border-white   glow-button"
        >
          <div className="w-12 h-12 flex items-center justify-center text-pink-500 text-4xl">
            &#8594;
          </div>
        </button>
      </div>
    </div>
  );
}