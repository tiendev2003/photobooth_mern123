"use client";

import StoreBackground from "@/app/components/StoreBackground";
import StoreHeader from "@/app/components/StoreHeader";
import StoreNavigationButtons from "@/app/components/StoreNavigationButtons";
import { useAuth } from "@/lib/context/AuthContext";
import { useBooth } from "@/lib/context/BoothContext";
import { getStoreAccentColor, getStoreBorderColor, getStorePrimaryColor } from "@/lib/storeUtils";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Trash2 } from "react-feather";

export default function Step5() {
  const router = useRouter();
  const { selectedTotalAmount, currentStore } = useBooth();
  const { token } = useAuth();


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
        headers: { "Content-Type": "application/json", 'Authorization': `Bearer ${token}` },
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
    <StoreBackground currentStore={currentStore}>
      <StoreHeader 
        currentStore={currentStore}
        title="NHẬP MÃ THANH TOÁN"
      />

      {/* Main content - camera view and capture UI */}
      <main className="flex flex-col items-center justify-center flex-grow z-10 w-full   px-8">
        <h2 className="text-6xl font-bold mb-4 text-center">
          Mã thanh toán sẽ được cấp tại quầy thanh toán
        </h2>

        <div 
          className="w-full max-w-5xl h-[150px] border-4 rounded-full flex items-center justify-center mb-8 md:mb-12 neon-glow-purple bg-black/20 backdrop-blur-sm"
          style={{ borderColor: getStoreBorderColor(currentStore) }}
        >
          <span 
            className="text-white 50 text-7xl font-mono tracking-widest"
            style={{ color: getStorePrimaryColor(currentStore) }}
          >
            {paymentCode || ""}
          </span>
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
                  className="w-[150px] h-[150px] rounded-full border-4 flex items-center justify-center text-2xl md:text-3xl font-bold transition-all duration-300 group neon-glow-pink bg-black/20 backdrop-blur-sm"
                  style={{ 
                    borderColor: getStoreAccentColor(currentStore),
                    color: getStoreAccentColor(currentStore)
                  }}
                >
                  <span className="transition-transform text-5xl">{number}</span>
                </button>
              ))}
              {rowIndex === 0 && (
                <button
                  onClick={handleDelete}
                  className="w-[150px] h-[150px] rounded-full border-4 flex items-center justify-center transition-all duration-300 group neon-glow-blue bg-black/20 backdrop-blur-sm"
                  style={{ 
                    borderColor: getStoreBorderColor(currentStore),
                    color: getStoreBorderColor(currentStore)
                  }}
                >
                  <ArrowLeft className="w-8 h-8 md:w-10 md:h-10" />
                </button>
              )}
              {rowIndex === 1 && (
                <button
                  onClick={handleClear}
                  className="w-[150px] h-[150px] rounded-full border-4 flex items-center justify-center transition-all duration-300 group neon-glow-blue bg-black/20 backdrop-blur-sm"
                  style={{ 
                    borderColor: getStoreBorderColor(currentStore),
                    color: getStoreBorderColor(currentStore)
                  }}
                >
                  <Trash2 className="w-8 h-8 md:w-10 md:h-10" />
                </button>
              )}
            </div>
          ))}
        </div>
      </main>

      <StoreNavigationButtons 
        onBack={handleBack}
        onNext={isVerifying ? undefined : handleNext}
        nextDisabled={isVerifying}
        nextLabel={isVerifying ? "Đang kiểm tra..." : undefined}
        currentStore={currentStore}
      />
    </StoreBackground>
  );
}
