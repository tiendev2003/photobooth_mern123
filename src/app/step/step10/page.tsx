"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Step10() {
  const router = useRouter();
  
  const handleStartOver = () => {
    router.push("/");
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
        <div className="text-3xl font-bold">HOÀN THÀNH</div>
      </header>
      
      {/* Main content */}
      <main className="flex flex-col items-center justify-center flex-grow z-10 w-full max-w-4xl px-8">
        <div className="bg-black bg-opacity-50 rounded-lg p-8 w-full max-w-2xl flex flex-col items-center justify-center text-center">
          <div className="mb-8">
            <div className="relative w-64 h-64">
              <Image
                src="/anh/10.png" 
                alt="Success"
                layout="fill"
                objectFit="contain"
              />
            </div>
          </div>
          
          <h2 className="text-5xl font-bold mb-6 text-center">Cảm ơn bạn!</h2>
          <p className="text-2xl mb-8">
            Chúng tôi đã gửi video của bạn qua email. Hãy kiểm tra hộp thư của bạn trong vài phút tới.
          </p>
          
          <button
            onClick={handleStartOver}
            className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-4 px-8 rounded-full text-xl glow-button"
          >
            Bắt đầu lại
          </button>
        </div>
      </main>
      
      {/* Footer area */}
      <div className="w-full px-12 py-16 z-10 flex justify-center">
        <div className="text-center opacity-70">
          <p className="text-xl mb-2">Music Box Photobooth</p>
          <p>© {new Date().getFullYear()} All rights reserved</p>
        </div>
      </div>
    </div>
  );
}
