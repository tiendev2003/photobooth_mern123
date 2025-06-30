"use client";

import HomeButton from "@/app/components/HomeButton";
import { formatCurrency } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Step4() {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1)

  const handleBack = () => {
    router.push("/step/step3");
  };

  const handleNext = () => {
    router.push("/step/step5");
  };


  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  const increaseQuantity = () => {
    if (quantity < 10) {
      setQuantity(quantity + 1)
    }
  }

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
        <h1 className="text-white text-3xl md:text-5xl lg:text-6xl font-bold text-center tracking-wide">
          LỰA CHỌN SỐ LẦN IN
        </h1>
        <HomeButton />

      </header>
      {/* Main content */}
      <main className="flex flex-col items-center justify-center flex-grow z-10 w-full max-w-4xl px-8">

        <div className="flex-1 flex flex-col items-center justify-center px-6 md:px-8 -mt-8">
          {/* Quantity Selection Area */}
          <div className="flex items-center justify-center gap-8 md:gap-12 mb-12 md:mb-16">
            {/* Decrease Button */}
            <button
              onClick={decreaseQuantity}
              disabled={quantity <= 1}
              className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-pink-400 flex items-center justify-center text-pink-400  transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed neon-glow-pink"
            >
              <Minus className="w-8 h-8 md:w-10 md:h-10   transition-transform" />
            </button>

            {/* Display Area */}
            <div className="w-80 h-48 md:w-96 md:h-56 border-4 border-cyan-400 rounded-2xl flex items-center justify-center neon-glow-blue bg-black/20 backdrop-blur-sm">
              <span className="text-white text-6xl md:text-8xl font-bold">{quantity}</span>
            </div>

            {/* Increase Button */}
            <button
              onClick={increaseQuantity}
              disabled={quantity >= 3}
              className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-pink-400 flex items-center justify-center text-pink-400  transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed neon-glow-pink"
            >
              <Plus className="w-8 h-8 md:w-10 md:h-10  transition-transform" />
            </button>
          </div>

          {/* Confirm Button */}
          <button className="w-80 md:w-96 h-16 md:h-20 border-4 border-pink-500 rounded-full flex items-center justify-center text-white text-xl md:text-4xl font-semibold  transition-all duration-300 neon-glow-pink bg-black/20 backdrop-blur-sm">
            {
              quantity == 1 ? formatCurrency(70000) : quantity == 2 ? formatCurrency(120000) : quantity == 3 ? formatCurrency(150000) : null
            }
          </button>
        </div>
      </main>

      {/* Navigation buttons */}
      <div className="flex justify-between w-full px-16 py-12 z-10">
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
