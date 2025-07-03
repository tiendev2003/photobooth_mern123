"use client";

import { useAuth } from "@/lib/context/AuthContext";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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

      {/* Main content */}
      <main className="flex flex-col items-center justify-center flex-grow z-10 px-4">
        <Image
          src="/lg.png"
          alt="Music Box Photobooth"
          width={1200}
          priority
          height={1000}
          className="glow-image"
        />
       

      </main>

      {/* Navigation buttons */}
      <div className="flex justify-end w-full px-16 py-12 z-10">


        <button
          onClick={handleNext}
          className={`rounded-full p-6 bg-transparent border-2 border-white  transition glow-button  }`}
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
