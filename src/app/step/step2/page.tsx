"use client";

import { HomeIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Step2() {
  const router = useRouter();
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [glowEffect, setGlowEffect] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    // Add a subtle glow effect after component loads
    const timer = setTimeout(() => {
      setGlowEffect(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    // Navigate to the next step if a language is selected
    if (selectedLanguage) {
      router.push("/step/step3");
    } else {
      // Show an alert or message that a language needs to be selected
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
    <div className={`step-container relative flex flex-col items-center justify-between min-h-screen text-white ${glowEffect ? 'glow-container' : ''}`}>
      {/* Background overlay and effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-radial from-purple-800/50 to-purple-900/90"></div>
        <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-black to-transparent"></div>
        <Image
          src="/anh/bg.png"
          alt="Background"
          layout="fill"
          objectFit="cover"
          className="opacity-30"
          priority
        />
        {/* Enhanced light beams effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(236,72,153,0.15)_0%,_rgba(0,0,0,0)_70%)] animate-pulse"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(124,58,237,0.2)_0%,_rgba(0,0,0,0)_60%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(236,72,153,0.1)_0%,_rgba(0,0,0,0)_60%)]"></div>
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
        <h1 className="text-white text-3xl md:text-5xl lg:text-6xl font-bold text-center mb-16 md:mb-20 mt-16 tracking-wide">
          VUI LÒNG CHỌN NGÔN NGỮ <br />
          <div className="text-2xl md:text-3xl lg:text-4xl font-semibold mt-4">
            언어를 선택해 주세요
          </div>

        </h1>
        <button
          onClick={
            () => {
              router.push("/");
            }
          }
          className="w-18 h-18 rounded-full border-2 border-gray-500 flex items-center justify-center"
        >
          <HomeIcon className="w-10 h-10" />
        </button>
      </header>

      {/* Main content */}
      <main className={`flex-1 flex flex-col items-center justify-center z-10 w-full max-w-5xl px-8 py-8 transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>

        <div className="flex flex-col md:flex-row gap-6 md:gap-8 w-full max-w-4xl justify-between items-center mt-20">
          {languageOptions.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setSelectedLanguage(lang.code)}
              className={`bg-gradient-to-r from-pink-500 to-purple-600  text-white text-xl md:text-2xl font-semibold py-4 md:py-6 px-8 md:px-12 rounded-full transition-all duration-300 transform  shadow-lg  ${selectedLanguage === lang.code ? 'ring-4 ring-pink-500' : ''}`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </main>

      {/* Navigation buttons */}
      <div className="flex justify-between w-full px-16 py-12 z-10">
        <button
          onClick={handleBack}
          className="rounded-full p-6 bg-transparent border-2 border-white  transition glow-button"
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

      {/* Enhanced glow effects */}
      <style jsx global>{`
        @keyframes pulse-glow {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(236, 72, 153, 0.8)); }
          50% { filter: drop-shadow(0 0 15px rgba(236, 72, 153, 1)); }
        }
        
        @keyframes float-logo {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        .logo-animation {
          animation: float-logo 3s ease-in-out infinite, pulse-glow 3s infinite;
        }
        
        .hover\:glow-button:hover {
          box-shadow: 0 0 20px rgba(236, 72, 153, 0.8);
          animation: pulse-glow 2s infinite;
        }

        .navigation-arrow {
          transition: all 0.3s ease;
        }

        .hover\:glow-button:hover .navigation-arrow {
          transform: scale(1.15);
          text-shadow: 0 0 15px rgba(236, 72, 153, 1);
        }

        button[disabled] .navigation-arrow {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
