"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Step9() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  const handleBack = () => {
    router.push("/step/step8");
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
        <div className="text-3xl font-bold">CHIA SẺ</div>
      </header>

      {/* Main content */}
      <main className="flex flex-col items-center justify-center flex-grow z-10 w-full max-w-4xl px-8">
        <h2 className="text-4xl font-bold mb-8 text-center">Nhận video qua email</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          {/* Video preview area */}
          <div className="bg-black bg-opacity-50 rounded-lg p-4 aspect-video flex items-center justify-center">
            <div className="relative w-full h-full">
              <Image
                src="/anh/9.png"
                alt="Video Preview"
                layout="fill"
                objectFit="contain"
              />
            </div>
          </div>

          {/* Email form */}
          <div className="flex flex-col space-y-6 justify-center">
            <h3 className="text-2xl font-bold">Nhập email của bạn:</h3>

            <div className="flex flex-col space-y-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="youremail@example.com"
                className="p-4 rounded-lg text-black text-xl"
              />
            </div>


            <p className="text-sm opacity-70">
              Bạn sẽ nhận được video qua email trong vài phút. Chúng tôi không sử dụng email của bạn cho mục đích khác.
            </p>
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
      </div>
    </div>
  );
}
