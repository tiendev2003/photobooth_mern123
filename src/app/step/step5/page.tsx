"use client";

import HomeButton from "@/app/components/HomeButton";
import LogoApp from "@/app/components/LogoApp";
import { useBooth } from "@/lib/context/BoothContext";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Trash2 } from "react-feather";

export default function Step5() {
  const router = useRouter();
  const { selectedTotalAmount, } = useBooth();


  const handleBack = () => {
    router.push("/step/step4");
  };

  const [paymentCode, setPaymentCode] = useState("")

  const handleNumberClick = (number: string) => {
    if (paymentCode.length < 4) {
      setPaymentCode(paymentCode + number)
    }
  }

  const handleDelete = () => {
    setPaymentCode(paymentCode.slice(0, -1))
  }

  const handleClear = () => {
    setPaymentCode("")
  }

  const numbers = [
    ["0", "1", "2", "3", "4"],
    ["5", "6", "7", "8", "9"],
  ]
  const [isVerifying, setIsVerifying] = useState(false);

  const handleNext = async () => {
    if (paymentCode.length !== 4) {
      alert("Vui lòng nhập mã thanh toán 4 chữ số");
      return;
    }
    setIsVerifying(true);
    try {
      const res = await fetch("/api/coupons/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: paymentCode, totalAmount: selectedTotalAmount }),
      });
      const data = await res.json();
      console.log("Verify response:", data);
      if (data.isValid) {

        router.push("/step/step6");

      } else {
        alert(data.message || "Mã thanh toán không hợp lệ");
      }
    } catch (err) {
      console.error("Error verifying payment code:", err);
      alert("Lỗi kiểm tra mã thanh toán. Vui lòng thử lại.");
    } finally {
      setIsVerifying(false);
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
          NHẬP MÃ THANH TOÁN
        </h1>

        <HomeButton />

      </header>

      {/* Main content - camera view and capture UI */}
      <main className="flex flex-col items-center justify-center flex-grow z-10 w-full   px-8">
        <h2 className="text-6xl font-bold mb-8 text-center">
          Mã thanh toán sẽ được cấp tại quầy thanh toán
        </h2>
        <div className="w-full max-w-5xl   h-[150px] border-4 border-purple-400 rounded-full flex items-center justify-center mb-8 md:mb-12 neon-glow-purple bg-black/20 backdrop-blur-sm">
          <span className="text-white 50 text-7xl font-mono tracking-widest">{paymentCode || ""}</span>
          <span className="text-white/50 text-7xl font-mono ml-2 animate-pulse">
            {paymentCode.length < 4 ? "|" : ""}
          </span>
        </div>

        {/* Numeric Keypad */}
        <div className="flex flex-col gap-4 md:gap-6">
          {numbers.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-4 md:gap-6 justify-center">
              {row.map((number) => (
                <button
                  key={number}
                  onClick={() => handleNumberClick(number)}
                  className="w-[150px] h-[150px]  rounded-full border-4 border-pink-400 flex items-center justify-center text-pink-400 text-2xl md:text-3xl font-bold   transition-all duration-300 group neon-glow-pink bg-black/20 backdrop-blur-sm"
                >
                  <span className=" transition-transform text-5xl">{number}</span>
                </button>
              ))}
              {rowIndex === 0 && (
                <button
                  onClick={handleDelete}
                  className="w-[150px] h-[150px]  rounded-full border-4 border-cyan-400 flex items-center justify-center text-cyan-400  transition-all duration-300 group neon-glow-blue bg-black/20 backdrop-blur-sm"
                >
                  <ArrowLeft className="w-8 h-8 md:w-10 md:h-10  " />
                </button>
              )}
              {rowIndex === 1 && (
                <button
                  onClick={handleClear}
                  className="w-[150px] h-[150px]  rounded-full border-4 border-cyan-400 flex items-center justify-center text-cyan-400  transition-all duration-300 group neon-glow-blue bg-black/20 backdrop-blur-sm"
                >
                  <Trash2 className="w-8 h-8 md:w-10 md:h-10  " />
                </button>
              )}
            </div>
          ))}
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
          onClick={isVerifying ? undefined : handleNext}
          className="rounded-full p-6 bg-transparent border-2 border-white   glow-button"
          disabled={isVerifying}
        >
          <div className="w-12 h-12 flex items-center justify-center text-pink-500 text-4xl">
            {isVerifying ? (
              <span className="animate-pulse text-base">Đang kiểm tra...</span>
            ) : (
              <>&#8594;</>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}
