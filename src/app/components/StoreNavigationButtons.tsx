"use client";

import { Store } from "@/lib/models/Store";
import { getStoreAccentColor, getStoreBorderColor } from "@/lib/storeUtils";
import { cn } from "@/lib/utils";

interface StoreNavigationButtonsProps {
  currentStore: Store | null;
  onBack?: () => void;
  onNext?: () => void;
  backDisabled?: boolean;
  nextDisabled?: boolean;
  nextLabel?: string; // Custom label for next button
  children?: React.ReactNode; // For middle content like price display
}

export default function StoreNavigationButtons({
  currentStore,
  onBack,
  onNext,
  backDisabled = false,
  nextDisabled = false,
  nextLabel,
  children
}: StoreNavigationButtonsProps) {
  const borderColor = getStoreBorderColor(currentStore);
  const accentColor = getStoreAccentColor(currentStore);

  return (
    <div className={cn(
      "flex justify-between w-full px-16 pb-20 z-10 items-center",
      onBack && onNext ? "justify-between" : "justify-end"

    )}>
      {onBack && (
        <button
          onClick={onBack}
          disabled={backDisabled}
          className={`rounded-full p-6 bg-transparent border-2 transition glow-button ${backDisabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
          style={{ borderColor }}
        >
          <div
            className="w-12 h-12 flex items-center justify-center text-4xl"
            style={{ color: accentColor }}
          >
            &#8592;
          </div>
        </button>
      )}

      {children && (
        <div className="flex-1 flex justify-center">
          {children}
        </div>
      )}

      {onNext && (
        <button
          onClick={onNext}
          disabled={nextDisabled}
          className={`rounded-full p-6 bg-transparent border-2 transition glow-button ${nextDisabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
          style={{ borderColor }}
        >
          {nextLabel ? (
            <div
              className="px-4 py-2 text-base font-medium"
              style={{ color: accentColor }}
            >
              {nextLabel}
            </div>
          ) : (
            <div
              className="w-12 h-12 flex items-center justify-center text-4xl"
              style={{ color: accentColor }}
            >
              &#8594;
            </div>
          )}
        </button>
      )}
    </div>
  );
}
