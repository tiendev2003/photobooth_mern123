"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Step1() {
  const router = useRouter();

  const handleNext = () => {
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
      
      {/* Header */}
      <header className="flex justify-between items-center w-full p-6 z-10">
        <div className="flex items-center">
          <div className="text-pink-500 text-3xl font-bold">|S</div>
          <div className="ml-2">
            <div className="text-white text-sm">Music box</div>
            <div className="text-white text-sm">Photobooth</div>
          </div>
        </div>
        <div className="text-3xl font-bold">TRANG CHỦ</div>
      </header>
      
      {/* Main content */}
      <main className="flex flex-col items-center justify-center flex-grow z-10 px-4">
        <h1 className="text-5xl font-bold mb-6 text-center">Chào mừng quý khách</h1>
        <div className="text-9xl font-bold text-white glow-text">SBOOTH</div>
      </main>
      
      {/* Navigation buttons */}
      <div className="flex justify-between w-full px-12 py-16 z-10">
        <button className="rounded-full p-6 bg-purple-800 bg-opacity-70 border-2 border-pink-500 hover:bg-purple-700 transition">
          <div className="w-12 h-12 flex items-center justify-center text-pink-500 text-4xl">
            &#8592;
          </div>
        </button>
        
        <button 
          onClick={handleNext}
          className="rounded-full p-6 bg-purple-800 bg-opacity-70 border-2 border-pink-500 hover:bg-purple-700 transition"
        >
          <div className="w-12 h-12 flex items-center justify-center text-pink-500 text-4xl">
            &#8594;
          </div>
        </button>
      </div>

      <style jsx global>{`
        .glow-text {
          text-shadow: 0 0 15px rgba(255, 0, 255, 0.7), 0 0 30px rgba(255, 0, 255, 0.5);
          letter-spacing: 2px;
        }
      `}</style>
    </div>
  );
}
