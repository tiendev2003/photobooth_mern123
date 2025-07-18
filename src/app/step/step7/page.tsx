"use client";

import StoreBackground from "@/app/components/StoreBackground";
import StoreHeader from "@/app/components/StoreHeader";
import StoreNavigationButtons from "@/app/components/StoreNavigationButtons";
import { useBooth } from "@/lib/context/BoothContext";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Step7() {
  const router = useRouter();
  const { photos, selectedFrame, selectedIndices, setSelectedIndices, currentStore } = useBooth();
  const handleBack = () => {
    router.push("/step/step6");
  };


  const handleNext = () => {
    // Check if enough photos are selected
    const maxPhotos = selectedFrame?.isCustom
      ? selectedFrame.rows
      : selectedFrame
        ? selectedFrame.columns * selectedFrame.rows
        : 4; // Default to 4 if no frame selected
    const selectedCount = selectedIndices.filter(i => i !== undefined).length;
    if (selectedCount < maxPhotos) {
      alert(`Vui lòng chọn ít nhất ${maxPhotos} ảnh để tiếp tục.`);
      return;
    }
    router.push("/step/step8");
  };

  const handleSelectPhoto = (idx: number) => {
    // Get current indices
    const current = [...selectedIndices];

    // If already selected, remove from selection
    const existingIndex = current.findIndex((i: number | undefined) => i === idx);
    if (existingIndex !== -1) {
      const newIndices = [...current];
      newIndices[existingIndex] = undefined;
      setSelectedIndices(newIndices);
      return;
    }

    // Calculate maximum photos based on selected frame
    const maxPhotos = selectedFrame?.isCustom
      ? selectedFrame.rows
      : selectedFrame
        ? selectedFrame.columns * selectedFrame.rows
        : 4; // Default to 4 if no frame selected

    // Find the first empty slot (undefined)
    const emptySlotIndex = current.findIndex((i: number | undefined) => i === undefined);
    if (emptySlotIndex !== -1 && emptySlotIndex < maxPhotos) {
      const newIndices = [...current];
      newIndices[emptySlotIndex] = idx;
      setSelectedIndices(newIndices);
      return;
    }

    // If we have less than max photos selected, add to selection
    if (current.filter((i: number | undefined) => i !== undefined).length < maxPhotos) {
      setSelectedIndices([...current, idx]);
      return;
    }
  };

  const handleRemovePhoto = (previewIdx: number) => {
    const newIndices = [...selectedIndices];
    newIndices[previewIdx] = undefined;
    setSelectedIndices(newIndices);
  };

  const renderCell = (idx: number) => {
    const photoIndex = selectedIndices[idx];

    const cellContent = photoIndex !== undefined ? (
      <Image
        src={photos[photoIndex].image || "/placeholder.svg"}
        alt={`Slot ${idx}`}
        className={cn(
          "h-full w-full object-cover photo-booth-image",
          selectedFrame?.isCircle && "rounded-full"
        )}
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
      />
    ) : (
      <div className={cn(
        "flex h-full w-full flex-col items-center justify-center text-gray-400",
        selectedFrame?.isCircle && "rounded-full"
      )}

      >
        <span className="text-xs">{"Empty"}</span>
      </div>
    );

    const baseClass =
      "relative w-full flex items-center justify-center transition-all duration-200 overflow-hidden border border-transparent";
    const emptyClass = "border-dashed border-gray-200 bg-gray-50/50";
    const hasPhoto = selectedIndices[idx] !== undefined;
    const isLandscape = (selectedFrame?.columns ?? 0) > (selectedFrame?.rows ?? 0) && !selectedFrame?.isCustom;
    const isSquare = selectedFrame?.columns === selectedFrame?.rows;
    return (
      <div
        key={idx}
        className={cn(
          baseClass,
          !hasPhoto && emptyClass,
          hasPhoto && "cursor-pointer",
          selectedFrame?.isCustom && selectedFrame?.rows == 4 ? "aspect-[4/3]" : selectedFrame?.isCustom && selectedFrame?.rows == 2 ? " aspect-[3/4]" : isSquare && selectedFrame?.columns == 2 ? "aspect-[3/4]" : selectedFrame?.columns == 2 || selectedFrame?.isCircle ? "aspect-square" : isLandscape ? "aspect-[5/4]" : "aspect-[3/4]",
          selectedFrame?.columns === 2 && selectedFrame?.rows === 3 ? "aspect-[13/12]" : "",
        )}
        onClick={() => hasPhoto && handleRemovePhoto(idx)}
      >
        {cellContent}
      </div>
    );
  };

  const renderPreview = () => {
    if (!selectedFrame) return null;
    const commonClasses = "mx-auto overflow-hidden shadow-md";

    const isLandscape = selectedFrame.columns > selectedFrame.rows && !selectedFrame.isCustom;
    const isSquare = selectedFrame.columns === selectedFrame.rows;

    const previewHeight = isLandscape ? "4.8in" : "7.2in";
    const previewWidth = isLandscape ? "7.2in" : "4.8in";
    const aspectRatio = isLandscape ? "3/2" : "2/3";
    console.log("isLandscape:", isLandscape);
    return (
      <div className={cn("relative w-full", commonClasses)} style={{ height: previewHeight, width: selectedFrame.isCustom ? "2.4in" : previewWidth }} >
        <div
          data-preview
          className={cn(
            "flex flex-col gap-4 print-preview photo-booth-preview bg-white px-[5%] ",
            selectedFrame.isCustom ? "pb-[10%] pt-[10%] px-[10%]" :
              isSquare && (selectedFrame.columns == 2 || selectedFrame.columns == 1) && !selectedFrame.isCircle ? "pt-[5%]" :
                selectedFrame.isCircle ? "pt-[20%]" :
                  isLandscape ? "px-[5%] pt-[5%]" : "px-[5%] pt-[5%]",
            selectedFrame?.isCircle && "px-[5%] pt-[20%]"
          )}
          style={{
            height: previewHeight,
            aspectRatio: selectedFrame.isCustom ? "1/3" : (isSquare && selectedFrame.columns == 1) ? "2/3" : aspectRatio,
          }}
        >
          {selectedFrame.isCustom ? (
            <div className="relative z-10 grid grid-cols-1 gap-[10px]">
              {Array.from({ length: selectedFrame.rows }, (_, idx) => renderCell(idx))}
            </div>
          ) : (
            <div
              className={cn(
                "relative z-10 grid gap-[20px]"
              )}
              style={{
                gridTemplateColumns: `repeat(${selectedFrame.columns}, 1fr)`
              }}
            >
              {Array.from({ length: selectedFrame.columns }, (_, colIdx) => (
                <div key={colIdx} className="flex flex-col gap-[20px]">
                  {Array.from({ length: selectedFrame.rows }, (_, rowIdx) => {
                    // Correctly calculate the index for each cell based on column and row
                    const cellIdx = colIdx + (rowIdx * selectedFrame.columns);
                    return (
                      <div key={rowIdx} className="">
                        {renderCell(cellIdx)}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <StoreBackground currentStore={currentStore}>
      <StoreHeader
        currentStore={currentStore}
        title="HOÀN THIỆN ẢNH CỦA BẠN"
      />

      <div className="grid grid-cols-2 gap-6 mx-32 z-30">
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-black bg-opacity-50 rounded-lg p-4 flex flex-col items-center justify-center mt-10">
            <h3 className="text-5xl font-bold mb-4">
              Ảnh đã chụp ({photos.length})
            </h3>
            <div className="grid grid-cols-3 gap-3 w-full">
              {photos.length === 0 ? (
                <div className="col-span-4 text-center text-gray-400">
                  Không có ảnh nào
                </div>
              ) : (
                photos.map((photo, idx) => (
                  <div
                    key={idx}
                    className={`relative border  overflow-hidden group transition-all duration-300 cursor-pointer ${selectedIndices.includes(idx)
                      ? "border-pink-500 ring-2 ring-pink-500"
                      : "border-purple-700 hover:border-pink-500"
                      }`}
                    onClick={() => handleSelectPhoto(idx)}
                  >
                    <Image
                      src={photo.image}
                      alt={`Photo ${idx + 1}`}
                      width={320}
                      height={320}
                      className="w-full object-cover "
                    />
                    {selectedIndices.includes(idx) && (
                      <div className="absolute top-2 right-2 bg-pink-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                        {selectedIndices.findIndex(i => i === idx) + 1}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            <p className="text-sm mt-4 text-gray-300">
              Chọn tối đa {selectedFrame?.isCustom
                ? selectedFrame.rows
                : selectedFrame
                  ? selectedFrame.columns * selectedFrame.rows
                  : 4} ảnh để hiển thị trong bản xem trước (
              {selectedIndices.filter(i => i !== undefined).length}/
              {selectedFrame?.isCustom
                ? selectedFrame.rows
                : selectedFrame
                  ? selectedFrame.columns * selectedFrame.rows
                  : 4})
            </p>
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="w-full flex items-center justify-center" >
            <div className={` `}>
              {renderPreview()}
            </div>
          </div>
        </div>
      </div>

      <StoreNavigationButtons
        onBack={handleBack}
        onNext={handleNext}
        currentStore={currentStore}
      />
    </StoreBackground>
  );
}