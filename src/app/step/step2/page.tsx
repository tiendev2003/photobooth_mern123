"use client";

import StoreBackground from "@/app/components/StoreBackground";
import StoreHeader from "@/app/components/StoreHeader";
import StoreNavigationButtons from "@/app/components/StoreNavigationButtons";
import { useBooth } from "@/lib/context/BoothContext";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Step2() {
  const router = useRouter();
  const { currentStore } = useBooth();
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);


  const handleNext = () => {
    // Navigate to the next step if a language is selected
    if (selectedLanguage) {
      router.push("/step/step3");
    } else {
      alert("Vui lòng chọn ngôn ngữ trước khi tiếp tục");
    }
  };

  const handleBack = () => {
    router.push("/");
  };

  const languageOptions = [
    { code: 'en', label: 'English' },
    { code: 'vi', label: 'Tiếng Việt' },
    { code: 'ko', label: '한국어' }
  ];

  return (
    <StoreBackground currentStore={currentStore}>
      <StoreHeader 
        currentStore={currentStore}
        title={
          <>
            VUI LÒNG CHỌN NGÔN NGỮ <br />
            <div className="text-2xl md:text-3xl lg:text-4xl font-semibold mt-4">
              언어를 선택해 주세요
            </div>
          </>
        }
      />

      <main className={`flex-1 flex flex-col items-center justify-center z-10 px-8 py-8 transition-opacity duration-500`}>
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 justify-between items-center mt-20">
          {languageOptions.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setSelectedLanguage(lang.code)}
              style={{
                border: selectedLanguage === lang.code ? '14px solid white' : 'none',
                background: currentStore?.primaryColor 
                  ? `linear-gradient(45deg, ${currentStore.primaryColor}, ${currentStore.secondaryColor || currentStore.primaryColor})`
                  : 'linear-gradient(to right, #ec4899, #8b5cf6)'
              }}
              className={`text-white text-2xl md:text-4xl font-semibold py-4 md:py-6 px-8 md:px-12 rounded-full transition-all duration-300 transform shadow-lg ${selectedLanguage === lang.code ? 'ring-white' : ''}`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </main>

      <StoreNavigationButtons 
        onBack={handleBack}
        onNext={handleNext}
        nextDisabled={!selectedLanguage}
        currentStore={currentStore}
      />
    </StoreBackground>
  );
}
