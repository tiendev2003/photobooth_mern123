"use client";

import { useStore } from "@/lib/hooks/useStore";
import { FrameTemplate } from "@/lib/models/FrameTemplate";
import { FrameType } from "@/lib/models/FrameType";
import { Store } from "@/lib/models/Store";
import { createContext, ReactNode, useContext, useState } from "react";

export interface Photo {
  image: string;
  timestamp: string;
}

export interface FilterOption {
  id: string;
  name: string;
  className: string;
  preview?: string;
}

interface BoothContextType {
  photos: Photo[];
  setPhotos: (photos: Photo[]) => void;
  selectedFrame: FrameType | null;
  setSelectedFrame: (frame: FrameType | null) => void;
  selectedIndices: (number | undefined)[];
  setSelectedIndices: (indices: (number | undefined)[]) => void;
  selectedFilter: FilterOption;
  setSelectedFilter: (filter: FilterOption) => void;
  selectedTemplate: FrameTemplate | null;
  setSelectedTemplate: (template: FrameTemplate | null) => void;
  selectedTotalAmount: number;
  setSelectedTotalAmount: (amount: number) => void;
  videos: string[]; // blob URLs
  setVideos: (videos: string[] | ((prev: string[]) => string[])) => void;
  imageQrCode: string; // URL for the QR code image
  setImageQrCode: (url: string) => void;
  videoQrCode: string; // URL for the video QR code
  setVideoQrCode: (url: string) => void;
  gifQrCode: string; // URL for the GIF QR code
  setGifQrCode: (url: string) => void;
  // Store information
  currentStore: Store | null;
  setCurrentStore: (store: Store | null) => void;
  storeLoading: boolean;
  storeError: string | null;
  loadStoreInfo: (storeId?: string) => Promise<void>;
  clearStore: () => void;
}

// Default filter options
export const filterOptions = [
  { id: "none", name: "Không có filter", className: "" },
  { id: "grayscale", name: "Đen trắng", className: "grayscale" },
  { id: "sepia", name: "Sepia", className: "sepia" },
  { id: "saturate", name: "Sống động", className: "saturate-150" },
  { id: "contrast", name: "Tương phản", className: "contrast-125" },
  { id: "blur", name: "Mờ nhẹ", className: "blur-[0.5px]" },
  { id: "warm", name: "Ấm áp", className: "hue-rotate-15 saturate-125" },
  { id: "cool", name: "Lạnh", className: "hue-rotate-[-15deg] brightness-105" },
];

const BoothContext = createContext<BoothContextType | undefined>(undefined);

export const BoothProvider = ({ children }: { children: ReactNode }) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedFrame, setSelectedFrame] = useState<FrameType | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<(number | undefined)[]>(Array(8).fill(undefined));
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>(filterOptions[0]);
  const [selectedTemplate, setSelectedTemplate] = useState<FrameTemplate | null>(null);
  const [selectedTotalAmount, setSelectedTotalAmount] = useState<number>(1);
  const [videos, setVideos] = useState<string[]>([]);
  const [imageQrCode, setImageQrCode] = useState<string>("");
  const [videoQrCode, setVideoQrCode] = useState<string>("");
  const [gifQrCode, setGifQrCode] = useState<string>("");
  
  // Use the custom store hook
  const { currentStore, storeLoading, storeError, loadStoreInfo, clearStore, setCurrentStore } = useStore();

  return (
    <BoothContext.Provider value={{
      photos,
      setPhotos,
      selectedFrame,
      setSelectedFrame,
      selectedIndices,
      setSelectedIndices,
      selectedFilter,
      setSelectedFilter,
      selectedTemplate,
      setSelectedTemplate,
      selectedTotalAmount,
      setSelectedTotalAmount,
      videos, setVideos,
      imageQrCode, setImageQrCode,
      videoQrCode, setVideoQrCode,
      gifQrCode, setGifQrCode,
      currentStore, setCurrentStore,
      storeLoading, storeError,
      loadStoreInfo, clearStore,
    }}>
      {children}
    </BoothContext.Provider>
  );
};

export const useBooth = () => {
  const context = useContext(BoothContext);
  if (!context) {
    throw new Error("useBooth must be used within a BoothProvider");
  }
  
  // Adding a utility function to clear all booth data
  const clearAllBoothData = () => {
    context.setPhotos([]);
    context.setSelectedFrame(null);
    context.setSelectedIndices(Array(8).fill(undefined));
    context.setSelectedFilter(filterOptions[0]);
    context.setSelectedTemplate(null);
    context.setSelectedTotalAmount(1);
    context.setVideos([]);
    context.setImageQrCode("");
    context.setVideoQrCode("");
    context.setGifQrCode("");
    localStorage.removeItem("imageQrCode");
    localStorage.removeItem("videoQrCode");
    localStorage.removeItem("gifQrCode");
  };
  
  return { ...context, clearAllBoothData };
};
