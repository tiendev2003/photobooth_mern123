"use client";

import HomeButton from "@/app/components/HomeButton";
import LogoApp from "@/app/components/LogoApp";
import { useBooth } from "@/lib/context/BoothContext";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from 'qrcode.react';

export default function Step9() {
  const router = useRouter();
  const { imageQrCode, } = useBooth();
  const handleBack = () => {
    router.push("/step/step8");
  };
  console.log("Image QR Code:", imageQrCode);
  //  setTimeout(() => {
  //   router.push("/");
  // }, 30000);

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
      <main className="flex flex-col items-center justify-center flex-grow z-10 w-full max-w-4xl px-8">
        <h2 className="text-4xl font-bold mb-8 text-center">Quý khách có thể lấy ảnh tại khe bên dưới / phía ngoài cửa chụp</h2>

        <div className="flex items-center gap-3 justify-center w-full max-w-2xl mb-8">
          <div className="flex flex-col items-center bg-white bg-opacity-20 p-6 rounded-lg shadow-lg">
            <QRCodeSVG value={imageQrCode} size={256} marginSize={2} />
            <p className="text-center text-4xl text-black mt-4">Ảnh của bạn</p>
          </div>

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
        <div></div>
      </div>
    </div>
  );
}
