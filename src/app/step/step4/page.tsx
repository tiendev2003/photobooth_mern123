"use client";

import StoreBackground from "@/app/components/StoreBackground";
import StoreHeader from "@/app/components/StoreHeader";
import StoreNavigationButtons from "@/app/components/StoreNavigationButtons";
import { useAuth } from "@/lib/context/AuthContext";
import { useBooth } from "@/lib/context/BoothContext";
import { Pricing } from "@/lib/models";
import { getStoreAccentColor, getStoreBorderColor, getStorePrimaryColor } from "@/lib/storeUtils";
import { Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Step4() {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1)
  const { setSelectedTotalAmount, setSelectedQuantity, currentStore } = useBooth();
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [loading, setLoading] = useState(true);
  const {user} = useAuth();

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        let url = '/api/pricing/default';
        const params = new URLSearchParams();
        
        // Thêm storeId nếu có currentStore
        if (currentStore?.id) {
          params.append('storeId', currentStore.id);
        }
        
         if (user?.id) {
          params.append('userId', user.id);
        }
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setPricing(data);
        }
      } catch (error) {
        console.error('Error fetching pricing:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPricing();
  }, [currentStore]);

  const getPriceForQuantity = (qty: number) => {
    if (!pricing) return 0;
    
    switch (qty) {
      case 1:
        return pricing.priceOnePhoto;
      case 2:
        return pricing.priceTwoPhoto;
      case 3:
        return pricing.priceThreePhoto;
      default:
        return pricing.priceThreePhoto;
    }
  };

  const handleBack = () => {
    router.push("/step/step3");
  };

  const handleNext = () => {
    const price = getPriceForQuantity(quantity);
    setSelectedTotalAmount(price);
    setSelectedQuantity(quantity);
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
    <StoreBackground currentStore={currentStore}>
      <StoreHeader 
        currentStore={currentStore}
        title="LỰA CHỌN SỐ LẦN IN"
      />


      <div className="flex-1 flex flex-col items-center justify-center px-6 md:px-8 -mt-8 z-10">
        <div className="flex items-center justify-center gap-8 md:gap-12 mb-12 md:mb-16">
          <button
            onClick={decreaseQuantity}
            disabled={quantity <= 1}
            className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 flex items-center justify-center transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed neon-glow-pink"
            style={{ 
              borderColor: getStoreAccentColor(currentStore),
              color: getStoreAccentColor(currentStore)
            }}
          >
            <Minus className="w-8 h-8 md:w-10 md:h-10 transition-transform" />
          </button>

          {/* Display Area */}
          <div 
            className="w-[600px] h-[400px] border-4 rounded-2xl flex items-center justify-center neon-glow-blue bg-black/20 backdrop-blur-sm"
            style={{ borderColor: getStoreBorderColor(currentStore) }}
          >
            <span 
              className="text-6xl md:text-8xl font-bold"
              style={{ color: getStorePrimaryColor(currentStore) }}
            >
              {quantity}
            </span>
          </div>

          {/* Increase Button */}
          <button
            onClick={increaseQuantity}
            disabled={quantity >= 3}
            className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 flex items-center justify-center transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed neon-glow-pink"
            style={{ 
              borderColor: getStoreAccentColor(currentStore),
              color: getStoreAccentColor(currentStore)
            }}
          >
            <Plus className="w-16 h-16 transition-transform" />
          </button>
        </div>

        {/* Confirm Button */}
        <button 
          className="w-[400px] h-[100px] border-4 rounded-full flex items-center justify-center text-white text-xl md:text-4xl font-semibold transition-all duration-300 neon-glow-pink bg-black/20 backdrop-blur-sm"
          style={{ 
            borderColor: getStoreAccentColor(currentStore),
            color: getStorePrimaryColor(currentStore)
          }}
        >
          {loading ? "..." : 
            pricing ? `${getPriceForQuantity(quantity)} xu` : "Chưa có giá"
          }
        </button>
      </div>

      <StoreNavigationButtons 
        onBack={handleBack}
        onNext={handleNext}
        currentStore={currentStore}
      />
    </StoreBackground>
  );
}
