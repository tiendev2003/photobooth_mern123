"use client";

import StoreBackground from "@/app/components/StoreBackground";
import StoreHeader from "@/app/components/StoreHeader";
import StoreNavigationButtons from "@/app/components/StoreNavigationButtons";
import { useBooth } from "@/lib/context/BoothContext";
import { useDialog } from "@/lib/context/DialogContext";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Step2() {
  const router = useRouter();
  const { currentStore } = useBooth();
  const [selectedLanguage] = useState<string | null>("vi");
  const {showDialog} = useDialog();

  const handleNext = () => {
     if (selectedLanguage) {
      router.push("/step/step3");
    } else {
      showDialog({
        header: "Thông báo",
        content: "Vui lòng chọn một ngôn ngữ để tiếp tục.",
      });
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

      <main className={`flex-1 flex flex-col items-center justify-center z-10  px-8 py-8 transition-opacity duration-500`}>
        <div className="flex flex-col md:flex-row gap-6 md:gap-8   justify-between items-center mt-20">
          {languageOptions.map((lang) => (
            <button
              key={lang.code}
              // onClick={() => setSelectedLanguage(lang.code)}
              style={
                {
                  border: selectedLanguage === lang.code ? '14px solid white' : 'none',
                }
              }
              className={`bg-gradient-to-r from-pink-500 to-purple-600  text-white text-2xl md:text-4xl font-semibold py-4 md:py-6 px-8 md:px-12 rounded-full transition-all duration-300 transform  shadow-lg  ${selectedLanguage === lang.code ? '  ring-white' : ''}`}
            >
              {lang.label}
            </button>
          ))}
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
