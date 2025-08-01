"use client";

import StoreBackground from "@/app/components/StoreBackground";
import StoreHeader from "@/app/components/StoreHeader";
import StoreNavigationButtons from "@/app/components/StoreNavigationButtons";
import { useBooth } from "@/lib/context/BoothContext";
import { TIMEOUT_DURATION } from "@/lib/utils";
import { getStoreTheme } from "@/lib/utils/storeTheme";
import { Camera, CameraOff, Monitor } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export default function Step6() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { photos, setPhotos, setVideos, videos, selectedFrame, currentStore, storeError } = useBooth();
  const storeTheme = getStoreTheme(currentStore);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [shotCount, setShotCount] = useState<number>(0);
  const [isCameraLoading, setIsCameraLoading] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null); // Thêm state để theo dõi trạng thái quyền

  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [showCameraSelector, setShowCameraSelector] = useState<boolean>(false);

  const maxShots: number =
    (selectedFrame?.columns ?? 1) * (selectedFrame?.rows ?? 1) >= 4
      ? 9
      : (selectedFrame?.columns ?? 1) * (selectedFrame?.rows ?? 1) + 3;

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsCameraLoading(false);
    }, 4000);

    return () => clearTimeout(timeout);
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) {
      console.log("No stream available for recording");
      return;
    }

    recordedChunksRef.current = [];
    console.log("Starting video recording...");

    try {
      const options = { mimeType: "video/webm;codecs=vp9" };
      const mediaRecorder = new MediaRecorder(streamRef.current, options);

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
          console.log("Recording data chunk:", event.data.size, "bytes");
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        const videoUrl = URL.createObjectURL(blob);
        setVideos((prev) => {
          const newVideos = [...prev, videoUrl];
          console.log("Video recorded and added to videos array:", videoUrl);
          console.log("Total videos after recording:", newVideos.length);
          return newVideos;
        });
      };

      mediaRecorder.start();
      console.log("MediaRecorder started");
    } catch (e) {
      console.error("Error starting recording:", e);
    }
  }, [setVideos]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      console.log("Stopping video recording...");
      mediaRecorderRef.current.stop();
    } else {
      console.log("MediaRecorder not active, cannot stop");
    }
  }, []);

  const enumerateCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device) => device.kind === "videoinput");
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
      setIsCameraLoading(true);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const constraintConfigs: MediaStreamConstraints[] = [
        ...(deviceId
          ? [{
            video: {
              deviceId: { exact: deviceId },
              width: { ideal: 3840, min: 3840 }, // 4K resolution if available
              height: { ideal: 2160, min: 2160 },
              facingMode: "user",
              aspectRatio: { ideal: 16/9 },
            },
            audio: false
          }]
          : []),
        {
          video: {
            width: { ideal: 3840, min: 3840 },
            height: { ideal: 2160, min: 2160 },
            facingMode: "user",
            aspectRatio: { ideal: 16/9 },
          },
          audio: false
        },
        {
          video: {
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 },
            facingMode: "user",
          },
          audio: false
        },
        {
          video: {
            facingMode: "user",
          },
          audio: false
        },
        {
          video: true,
          audio: false
        },
      ];

      let stream: MediaStream | null = null;
      let lastError: Error | null = null;

      for (const constraints of constraintConfigs) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          break;
        } catch (error) {
          lastError = error as Error;
          console.warn("Failed to get stream with constraints:", constraints, error);

          // If it's an OverconstrainedError and we're trying a specific device,
          // skip to more general constraints
          if (error instanceof Error && error.name === 'OverconstrainedError') {
            continue;
          }
        }
      }

      if (!stream) {
        throw lastError || new Error("Unable to access camera with any configuration");
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraLoading(false);
      }

    } catch (error) {
      console.error("Error initializing camera:", error);
      setIsCameraLoading(false);

      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setPermissionStatus("denied");
          setCameraError("Quyền truy cập máy ảnh bị từ chối. Vui lòng cấp quyền để tiếp tục.");
        } else if (error.name === 'NotFoundError') {
          setCameraError("Không tìm thấy camera. Vui lòng kiểm tra kết nối camera.");
        } else if (error.name === 'OverconstrainedError') {
          setCameraError("Camera không hỗ trợ cấu hình yêu cầu. Đang thử cấu hình khác...");
          // Try again with basic constraints
          setTimeout(() => {
            initializeCamera();
          }, 1000);
        } else {
          setCameraError(`Lỗi camera: ${error.message}`);
        }
      } else {
        setCameraError("Lỗi không xác định khi khởi tạo camera.");
      }
    }
  }, []);


  useEffect(() => {
    if (selectedCameraId && permissionStatus === "granted") {
      initializeCamera(selectedCameraId);
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [selectedCameraId, initializeCamera, permissionStatus]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;

    // Create a high-resolution canvas for better image quality
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d", {
      alpha: false,
      desynchronized: false,
      colorSpace: "display-p3",
      willReadFrequently: false,
    });

    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      // Use higher quality JPEG instead of PNG for better quality/size ratio
      const imageData = canvas.toDataURL("image/jpeg", 1.0); // Use maximum quality
      const timestamp = new Date().toLocaleString();
      setPhotos([{ image: imageData, timestamp }, ...photos]);
    }
  }, [setPhotos, photos]);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;

    if (isCapturing && countdown !== null && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (isCapturing && countdown === 0 && shotCount < maxShots) {
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
        console.log("All shots completed, redirecting to step7 with videos:", videos.length);
        setTimeout(() => router.push("/step/step7"), 1500);
      }
    }

    return () => clearTimeout(timer);
  }, [countdown, isCapturing, shotCount, maxShots, router, capturePhoto, stopRecording, startRecording, videos]);

  const startCapture = (): void => {
    if (!isCapturing && !isCameraLoading && !cameraError && !isCompleted && permissionStatus === "granted") {
      console.log("Starting capture session - clearing previous data");
      setPhotos([]);
      setVideos([]);
      setShotCount(0);
      setShowCameraSelector(false);
      setIsCapturing(true);
      setCountdown(TIMEOUT_DURATION);

      startRecording();
    }
  };

  const handleCameraChange = useCallback(
    (deviceId: string) => {
      if (!isCapturing) {
        setSelectedCameraId(deviceId);
        setShowCameraSelector(false);
      }
    },
    [isCapturing]
  );



  const handleNext = () => {
    if (photos.length >= maxShots && !isCapturing && !isCameraLoading) {
      router.push("/step/step7");
    }
  };

  // Hàm yêu cầu quyền truy cập máy ảnh
  const requestCameraPermission = async () => {
    try {
      setIsCameraLoading(true);
      await navigator.mediaDevices.getUserMedia({ video: true });
      setPermissionStatus("granted");
      await enumerateCameras();
      setIsCameraLoading(false);
    } catch (error) {
      console.error("Error requesting camera permission:", error);
      setIsCameraLoading(false);
      setPermissionStatus("denied");
      setCameraError("Quyền truy cập máy ảnh bị từ chối. Vui lòng cấp quyền để tiếp tục.");
    }
  };

  useEffect(() => {
    // Kiểm tra quyền truy cập máy ảnh khi component mount
    const checkCameraPermission = async () => {
      try {
        setIsCameraLoading(true);
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // Stop the test stream immediately
        stream.getTracks().forEach(track => track.stop());

        setPermissionStatus("granted");
        await enumerateCameras();
        setIsCameraLoading(false);
      } catch (error) {
        console.error("Error checking camera permission:", error);
        setIsCameraLoading(false);
        setPermissionStatus("denied");
      }
    };

    checkCameraPermission();
  }, [enumerateCameras]);

  return (
    <StoreBackground currentStore={currentStore}>


      {storeError && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500 bg-opacity-90 text-white px-4 py-2 rounded-lg z-50">
          {storeError}
        </div>
      )}

      <StoreHeader
        currentStore={currentStore}
        title="Chế độ chụp hình"
      />

      {/* Main content */}
      <main className="flex flex-row items-center justify-center flex-grow z-10 gap-8 px-4 min-h-0 overflow-hidden">
        <div className="flex-1 max-w-4xl h-full flex items-center justify-center">
          <div className="w-full max-h-full aspect-[4/3] bg-black bg-opacity-70 rounded-2xl border shadow-lg overflow-hidden relative"

          >
            {/* Camera selector button */}
            {availableCameras.length > 1 && permissionStatus === "granted" && (
              <div className="absolute top-4 right-4 z-20">
                <button
                  onClick={() => setShowCameraSelector(!showCameraSelector)}
                  disabled={isCapturing}
                  className={`p-3 rounded-full bg-black bg-opacity-70 border text-white hover:bg-opacity-90 transition-all ${isCapturing ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  style={{ borderColor: storeTheme.borderColor }}
                  title="Chọn camera"
                >
                  <Monitor size={20} />
                </button>

                {showCameraSelector && (
                  <div
                    className="absolute top-full right-0 mt-2 bg-black bg-opacity-90 rounded-lg border shadow-lg min-w-48"
                    style={{ borderColor: storeTheme.borderColor }}
                  >
                    {availableCameras.map((camera, index) => (
                      <button
                        key={camera.deviceId}
                        onClick={() => handleCameraChange(camera.deviceId)}
                        className={`block w-full px-4 py-3 text-left hover:bg-opacity-50 transition-colors ${index === 0 ? "rounded-t-lg" : ""} ${index === availableCameras.length - 1 ? "rounded-b-lg" : ""
                          }`}
                        style={{
                          backgroundColor: selectedCameraId === camera.deviceId
                            ? `${storeTheme.primaryColor}70`
                            : 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedCameraId !== camera.deviceId) {
                            e.currentTarget.style.backgroundColor = `${storeTheme.primaryColor}50`;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedCameraId !== camera.deviceId) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Camera size={16} />
                          <span className="text-sm">{camera.label || `Camera ${index + 1}`}</span>
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
                  {permissionStatus === "prompt" && (
                    <button
                      onClick={requestCameraPermission}
                      className="mt-4 px-4 py-2 rounded-lg hover:opacity-90 transition-colors text-white"
                      style={{ backgroundColor: storeTheme.primaryColor }}
                    >
                      Yêu cầu quyền truy cập
                    </button>
                  )}
                  {permissionStatus === "denied" && (
                    <p className="mt-2 text-sm text-gray-300">
                      Vui lòng cấp quyền trong cài đặt trình duyệt và thử lại.
                    </p>
                  )}
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
                  style={{ transform: "scaleX(-1)" }}
                />
              </>
            )}
          </div>
        </div>

        <div className="w-80 h-full flex flex-col gap-4 min-h-0">
          <div
            className="bg-black bg-opacity-70 rounded-xl border store-branded-border shadow-md p-4 flex flex-col items-center gap-3"
            style={storeTheme.glowStyle}
          >
            <h2
              className="text-2xl font-semibold text-white"

            >
              Bảng điều khiển
            </h2>
            <div className="text-center">
              <p className="text-gray-300 text-xl">
                Đã chụp: <span className="font-bold text-white">{shotCount}/{maxShots}</span>
              </p>
            </div>

            <button
              onClick={startCapture}
              disabled={isCapturing || isCameraLoading || cameraError !== null || isCompleted || permissionStatus !== "granted"}
              className={`px-6 py-3 rounded-full font-semibold text-white flex items-center gap-2 transition-all store-branded-button ${isCapturing || isCameraLoading || cameraError || isCompleted || permissionStatus !== "granted"
                ? "bg-gray-600 cursor-not-allowed"
                : "shadow-lg hover:shadow-xl"
                }`}
              style={
                !(isCapturing || isCameraLoading || cameraError || isCompleted || permissionStatus !== "granted")
                  ? storeTheme.buttonStyle
                  : undefined
              }
            >
              <Camera size={20} />
              {isCapturing
                ? `Đang chụp (${countdown}s)`
                : isCompleted
                  ? "Đã hoàn thành"
                  : "Bắt đầu chụp"}
            </button>

            {isCapturing && (
              <h1
                className="text-6xl font-bold text-center"
                style={{ color: storeTheme.primaryColor }}
              >
                {countdown}s
              </h1>
            )}
          </div>

          {/* Photo gallery */}
          <div
            className="flex-1 bg-black bg-opacity-70 rounded-xl border store-branded-border shadow-md p-4 overflow-hidden flex flex-col min-h-0"
            style={storeTheme.glowStyle}
          >
            <h2
              className="text-lg font-semibold mb-3"

            >
              Ảnh đã chụp ({photos.length})
            </h2>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
              {photos.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-400">
                  <Camera size={40} className="mb-2 opacity-50" />
                  <p>Chưa có ảnh nào được chụp</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo, index) => (
                    <div
                      key={index}
                      className="relative border rounded-lg overflow-hidden group transition-all duration-300"
                      style={{ borderColor: `${storeTheme.primaryColor}70` }}
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

      <StoreNavigationButtons
        onNext={handleNext}
        nextDisabled={photos.length < maxShots || isCapturing || isCameraLoading}
        currentStore={currentStore}
      />
    </StoreBackground>
  );
}