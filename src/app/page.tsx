"use client";

import { useAuth } from "@/lib/context/AuthContext";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import HomeButton from "./components/HomeButton";

export default function Home() {
  const { user, isAdmin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
    }
  }, [user, isAdmin, isLoading, router]);

  if (isLoading || !user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

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

      <header className="flex justify-between items-start w-full p-6 z-10">
        <div className="flex items-center">
          <Image
            src="/logo.svg"
            alt="Music Box Photobooth"
            width={150}
            height={50}
            className="glow-image"
          />
        </div>
        <HomeButton />
      </header>

      {/* Main content */}
      <main className="flex flex-col items-center justify-center flex-grow z-10 px-4">
        <h1 className="text-5xl font-bold mb-6 text-center">Chào mừng quý khách</h1>
        <div className="text-9xl font-bold text-white glow-text">SBOOTH</div>

      </main>

      {/* Navigation buttons */}
      <div className="flex justify-between w-full px-16 py-12 z-10">
        <button className="rounded-full p-6 bg-transparent border-2 border-pink-500   transition opacity-50 cursor-not-allowed glow-button">
          <div className="w-12 h-12 flex items-center justify-center text-pink-500 text-4xl">
            &#8592;
          </div>
        </button>

        <button
          onClick={handleNext}

          className="rounded-full p-6 bg-transparent border-2 border-white  transition glow-button"
        >
          <div className="w-12 h-12 flex items-center justify-center text-pink-500 text-4xl glow-text-small">
            &#8594;
          </div>
        </button>
      </div>

      <style jsx global>{`
        .glow-text {
          text-shadow: 0 0 15px rgba(255, 0, 255, 0.7), 0 0 30px rgba(255, 0, 255, 0.5);
          letter-spacing: 2px;
        }
        
        .glow-text-small {
          text-shadow: 0 0 10px rgba(255, 0, 255, 0.8), 0 0 20px rgba(255, 0, 255, 0.6);
        }
        
        .glow-image {
          filter: drop-shadow(0 0 8px rgba(236, 72, 153, 0.8));
        }
        
        .glow-button {
          box-shadow: 0 0 15px rgba(236, 72, 153, 0.7), 0 0 30px rgba(236, 72, 153, 0.3);
          backdrop-filter: blur(3px);
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 15px rgba(236, 72, 153, 0.7), 0 0 30px rgba(236, 72, 153, 0.3);
            border-color: rgba(236, 72, 153, 0.8);
          }
          50% {
            box-shadow: 0 0 20px rgba(236, 72, 153, 0.9), 0 0 40px rgba(236, 72, 153, 0.5);
            border-color: rgba(236, 72, 153, 1);
          }
          100% {
            box-shadow: 0 0 15px rgba(236, 72, 153, 0.7), 0 0 30px rgba(236, 72, 153, 0.3);
            border-color: rgba(236, 72, 153, 0.8);
          }
        }
      `}</style>
    </div>
  );
}
