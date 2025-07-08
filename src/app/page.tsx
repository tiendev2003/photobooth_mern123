"use client";

import StoreBackground from "@/app/components/StoreBackground";
import StoreNavigationButtons from "@/app/components/StoreNavigationButtons";
import { useAuth } from "@/lib/context/AuthContext";
import { useBooth } from "@/lib/context/BoothContext";
import { getStorePrimaryColor } from "@/lib/storeUtils";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LogoApp from "./components/LogoApp";

export default function Home() {
  const { user, isAdmin, isLoading } = useAuth();
  const { currentStore } = useBooth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
        return;
      }

      // Redirect based on user role
      if (user.role === 'ADMIN' || user.role === 'MANAGER' || user.role === 'KETOAN') {
        router.push('/admin');
        return;
      } else if (user.role === 'STORE_OWNER') {
        router.push('/store');
        return;
      }
      // USER and MACHINE stay on main photobooth interface
    }
  }, [user, isAdmin, isLoading, router]);

  if (isLoading || !user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const handleNext = () => {
    router.push("/step/step2");
  };

  return (
    <StoreBackground currentStore={currentStore}>
      {/* Main content */}
      <main className="flex flex-col items-center justify-center flex-grow z-10 px-4">
        <div className="flex flex-col items-center mb-8">
          {currentStore?.logo ? (
            <div className="flex flex-col items-center gap-6">
              <Image
                src={currentStore.logo}
                alt={currentStore.name}
                width={300}
                height={150}
              />

            </div>
          ) : (
            <LogoApp className="w-[500px]" />
          )}
        </div>

        <h2
          className="text-4xl md:text-6xl font-bold text-center glow-text mb-4"
          style={{ color: getStorePrimaryColor(currentStore) }}
        >
          {currentStore?.name ?
            `Chào mừng đến với ${currentStore.name}` :
            "Welcome to the S Photo Booth "
          }
        </h2>

        {/* Korean greeting */}
        <h3 className="text-xl md:text-4xl font-bold text-center glow-text text-white/80">
          &#34;안녕 하세요&#34; (annyeong haseyo)
        </h3>
      </main>

      <StoreNavigationButtons
        onNext={handleNext}
        currentStore={currentStore}
      />
    </StoreBackground>
  );
}
