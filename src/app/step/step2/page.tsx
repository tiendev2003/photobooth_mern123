"use client";

import HomeButton from "@/app/components/HomeButton";
import LogoApp from "@/app/components/LogoApp";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Step2() {
  const router = useRouter();
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
      {/* Header */}
      <header className="flex justify-between items-center w-full px-6 pt-10 z-10">
        <div className="flex items-center">
          <LogoApp />
        </div>
        <h1 className="text-white text-3xl md:text-5xl lg:text-6xl font-bold text-center  tracking-wide">
          VUI LÒNG CHỌN NGÔN NGỮ <br />
          <div className="text-2xl md:text-3xl lg:text-4xl font-semibold mt-4">
            언어를 선택해 주세요
          </div>

        </h1>
        <HomeButton />
      </header>

      <main className={`flex-1 flex flex-col items-center justify-center z-10  px-8 py-8 transition-opacity duration-500`}>
        <div className="flex flex-col md:flex-row gap-6 md:gap-8   justify-between items-center mt-20">
          {languageOptions.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setSelectedLanguage(lang.code)}
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

      {/* Navigation buttons */}
      <div className="flex justify-between w-full px-16 pb-20 z-10">
        <button
          onClick={handleBack}
          className="rounded-full p-6 bg-transparent border-2 border-white transition glow-button"
          aria-label="Go back"
        >
          <div className="w-12 h-12 flex items-center justify-center text-pink-500 text-4xl glow-text-small">
            &#8592;
          </div>
        </button>
        <button
          onClick={handleNext}
          disabled={!selectedLanguage}

          className="rounded-full p-6 bg-transparent border-2 border-white  transition glow-button"
        >
          <div className="w-12 h-12 flex items-center justify-center text-pink-500 text-4xl glow-text-small">
            &#8594;
          </div>
        </button>

      </div>


    </div>
  );
}
