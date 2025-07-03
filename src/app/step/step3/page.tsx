"use client";

import HomeButton from "@/app/components/HomeButton";
import LogoApp from "@/app/components/LogoApp";
import { useBooth } from "@/lib/context/BoothContext";
import { FrameType } from "@/lib/models";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Step3() {
  const router = useRouter();
  const { selectedFrame, setSelectedFrame } = useBooth();
  const [frameTypes] = useState<FrameType[]>([
    {
      id: "2",
      name: "Khung hình 1",
      image: "/uploads/type/2x1.png",
      isHot: false,
      columns: 2,
      rows: 1,
      isCustom: false,
      totalImages: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "5",
      name: "Khung hình 2",
      image: "/uploads/type/1x4.png",
      isHot: true,
      columns: 1,
      rows: 4,
      isCustom: true,
      totalImages: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "3",
      name: "Khung hình 3",
      image: "/uploads/type/2x2.png",
      isHot: false,
      columns: 2,
      rows: 2,
      isCustom: false,
      totalImages: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "6",
      name: "Khung hình 4",
      columns: 2, // Nằm ngang - 2 ô ngang, 3 ô dọc
      rows: 3,
      image: "/uploads/type/3x2.png",
      isHot: false,
      isCustom: false,
      totalImages: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "4",
      name: "Khung hình 5",
      image: "/uploads/type/2x3.png",
      columns: 3, // Đứng dọc - 3 ô ngang, 2 ô dọc
      rows: 2,
      isHot: false,
      isCustom: false,
      totalImages: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "1",
      name: "Khung hình 6",
      image: "/uploads/type/1x1.png",
      columns: 1,
      rows: 1,
      isHot: false,
      isCustom: false,
      totalImages: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "7",
      name: "Khung hình tròn",
      image: "/uploads/type/1x1_circle.png", // Cần tạo ảnh hình tròn
      columns: 1,
      rows: 1,
      isHot: false,
      isCustom: false,
      totalImages: 1,
      isActive: true,
      isCircle: true, // Thuộc tính mới để đánh dấu đây là khung hình tròn
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "8",
      name: "Khung hình 1x2",
      image: "/uploads/type/1x2.png",
      columns: 1,
      rows: 2,
      isHot: false,
      isCustom: true, // Đánh dấu là khung tùy chỉnh
      totalImages: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  const handleNext = () => {
    // Navigate to the next step if a frame is selected
    if (selectedFrame) {
      router.push("/step/step4");
    } else {
      // Show an alert or message that a frame needs to be selected
      alert("Vui lòng chọn khung hình trước khi tiếp tục");
    }
  };

  const handleBack = () => {
    router.push("/step/step2");
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

      <header className="flex justify-between items-start w-full p-6 z-10">
        <div className="flex items-center">
          <LogoApp />

        </div>
        <h1 className="text-white text-3xl md:text-5xl lg:text-6xl font-bold text-center     tracking-wide">
          Chọn khung hình muốn chụp
        </h1>
        <HomeButton />
      </header>

      {/* Main content */}
      <main className="flex flex-col items-center justify-center z-10 w-full max-w-7xl px-3 sm:px-6 py-4">
        {(
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full max-w-5xl mx-auto">
            {frameTypes.length > 0 ? (
              frameTypes.map((frame) => (
                <div
                  key={frame.id}
                  className={`relative cursor-pointer transition-transform transform  aspect-[4/3] ${selectedFrame && selectedFrame.id === frame.id ? "ring-4 ring-pink-500  scale-105" : ""
                    }`}
                  onClick={() => setSelectedFrame(frame)}
                >
                  <div className="w-full h-full relative">
                    <Image
                      src={frame.image || `/anh/3.png`}
                      alt={frame.name}
                      fill
                      sizes="(max-width: 640px) 45vw, (max-width: 768px) 30vw, 180px"
                      className={`object-contain ${frame.isCircle ? 'rounded-full' : 'rounded-lg'}`}
                      priority
                    />
                    {/* label hot */}
                    {frame.isHot && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        Hot
                      </div>
                    )}
                    {/* label circle */}
                    {frame.isCircle && (
                      <div className="absolute bottom-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                        Tròn
                      </div>
                    )}
                  </div>


                </div>
              ))
            ) : (
              <div className="col-span-full text-center p-8">
                <p>Không có khung hình nào khả dụng</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Navigation buttons */}
      <div className="flex justify-between w-full px-16 py-12 z-10">
        <button
          onClick={handleBack}
          className="rounded-full p-6 bg-transparent border-2 border-white   transition glow-button"
        >
          <div className="w-12 h-12 flex items-center justify-center text-pink-500 text-4xl">
            &#8592;
          </div>
        </button>
        <button className="w-80 md:w-96 h-16 md:h-20 border-4 border-white rounded-full flex items-center justify-center text-pink-400 text-xl md:text-2xl font-semibold hover:bg-pink-500/20 transition-all duration-300 neon-glow-pink bg-black/20 backdrop-blur-sm">
          70 xu
        </button>
        <button
          onClick={handleNext}
          className={`rounded-full p-6 bg-transparent border-2 border-white  transition glow-button ${!selectedFrame ? "opacity-50 cursor-not-allowed" : ""
            }`}
          disabled={!selectedFrame}
        >
          <div className="w-12 h-12 flex items-center justify-center text-pink-500 text-4xl glow-text-small">
            &#8594;
          </div>
        </button>
      </div>

      <style jsx global>{`
        .glow-text {
          text-shadow: 0 0 15px rgba(255, 0, 255, 0.7),
            0 0 30px rgba(255, 0, 255, 0.5);
          letter-spacing: 2px;
        }
      `}</style>
    </div>
  );
}
