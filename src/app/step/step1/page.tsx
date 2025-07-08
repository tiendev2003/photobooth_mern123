"use client";

import StoreBackground from "@/app/components/StoreBackground";
import StoreHeader from "@/app/components/StoreHeader";
import StoreNavigationButtons from "@/app/components/StoreNavigationButtons";
import { useBooth } from "@/lib/context/BoothContext";
import { getStorePrimaryColor } from "@/lib/storeUtils";
import { useRouter } from "next/navigation";

export default function Step1() {
  const router = useRouter();
  const { currentStore } = useBooth();

  const handleNext = () => {
    router.push("/step/step2");
  };

  const handleBack = () => {
    router.push("/");
  };

  return (
    <StoreBackground currentStore={currentStore}>
      <StoreHeader 
        currentStore={currentStore}
        title="CHUẨN BỊ CHỤP ẢNH"
      />

      <main className="flex-1 flex flex-col items-center justify-center z-10 px-4">
        <div className="text-center mb-8">
          <h2 
            className="text-4xl md:text-6xl font-bold glow-text mb-4"
            style={{ color: getStorePrimaryColor(currentStore) }}
          >
            Bắt đầu phiên chụp
          </h2>
          <p className="text-xl md:text-2xl text-white/90">
            Nhấn tiếp tục để bắt đầu trải nghiệm photobooth
          </p>
        </div>
      </main>

      <StoreNavigationButtons 
        onBack={handleBack}
        onNext={handleNext}
        currentStore={currentStore}
      />
    </StoreBackground>
  );
}
