"use client";

import HomeButton from "@/app/components/HomeButton";
import LogoApp from "@/app/components/LogoApp";
import { useBooth } from "@/lib/context/BoothContext";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Step7() {
  const router = useRouter();
  const { photos, selectedFrame, selectedIndices, setSelectedIndices } = useBooth();
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
          selectedFrame?.isCustom && selectedFrame?.rows == 4 ? "aspect-[4/3]" : selectedFrame?.isCustom && selectedFrame?.rows == 2 ? "ha aspect-[3/4]" : isSquare && selectedFrame?.columns == 2 ? "aspect-[3/4]" : selectedFrame?.columns == 2 ? "aspect-square" : isLandscape ? "aspect-[5/4]" : "aspect-square"
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

    // Determine if the frame is landscape based on its columns and rows
    // For a landscape frame, columns > rows (e.g., 3x2 is landscape)
    const isLandscape = selectedFrame.columns > selectedFrame.rows && !selectedFrame.isCustom;
    const isSquare = selectedFrame.columns === selectedFrame.rows;

    // Set dimensions based on orientation
    const previewHeight = isLandscape ? "4in" : "6in";
    const previewWidth = isLandscape ? "6in" : "4in";
    const aspectRatio = isLandscape ? "3/2" : "2/3";
    console.log("isLandscape:", isLandscape);
    return (
      <div className={cn("relative w-full", commonClasses)} style={{ height: previewHeight, width: selectedFrame.isCustom ? "2in" : previewWidth }} >
        <div
          data-preview
          className={cn(
            "flex flex-col gap-4 print-preview photo-booth-preview bg-white",
            selectedFrame.isCustom ? "pb-[10%] pt-[10%]" : "pb-[10%] pt-[5%]",
            isSquare && selectedFrame.columns == 2 ? "pt-[10%]" : "",
            isSquare &&  selectedFrame.columns == 1 ? "pt-[20%]" : "",
            isLandscape ? "px-[5%] pt-[5%]" : "px-[10%] pt-[10%]"
          )}
          style={{
            height: previewHeight,
            aspectRatio: selectedFrame.isCustom ? "1/3" : (isSquare && selectedFrame.columns == 1) ? "2/3" : aspectRatio,
          }}
        >
          {selectedFrame.isCustom ? (
            <div className="relative z-10 grid grid-cols-1 gap-[5%]">
              {Array.from({ length: selectedFrame.rows }, (_, idx) => renderCell(idx))}
            </div>
          ) : (
            <div
              className={cn(
                "relative z-10 grid gap-[calc(2.5%*3/2)]"
              )}
              style={{
                gridTemplateColumns: `repeat(${selectedFrame.columns}, 1fr)`
              }}
            >
              {Array.from({ length: selectedFrame.columns }, (_, colIdx) => (
                <div key={colIdx} className="flex flex-col gap-1">
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
    <div className="relative flex flex-col items-center justify-between min-h-screen bg-purple-900 text-white overflow-hidden">
      {/* Background graphics */}
      <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-black to-transparent z-0"></div>
      <div className="absolute top-0 left-0 right-0 w-full h-full">
        <LogoApp />

      </div>

      <header className="flex justify-between items-start w-full p-6 z-10">
        <div className="flex items-center">
          <Image
            src="/logo.svg"
            alt="Music Box Photobooth"
            width={150}
            height={50}
            className="glow-image"
          />
        </div>
        <h1 className="text-white text-3xl md:text-5xl lg:text-6xl font-bold text-center tracking-wide">
          HOÀN THIỆN ẢNH CỦA BẠN
        </h1>
        <HomeButton />
      </header>

      {/* Main content */}
      <div className="mx-auto flex max-w-6xl flex-col gap-6 p-3 relative">
        <div className="grid grid-cols-2 gap-6  ">
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="bg-black bg-opacity-50 rounded-lg p-4 flex flex-col items-center justify-center">
              <h3 className="text-2xl font-bold mb-4">
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
                      <img
                        src={photo.image}
                        alt={`Photo ${idx + 1}`}
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
      </div>


      {/* Navigation buttons */}
      <div className="flex justify-between w-full px-16 pb-12 z-10">
        <button
          onClick={handleBack}
          className="rounded-full p-6 bg-transparent border-2 white  glow-button"
        >
          <div className="w-12 h-12 flex items-center justify-center text-pink-500 text-4xl">
            &#8592;
          </div>
        </button>

        <button
          onClick={handleNext}
          className="rounded-full p-6 bg-transparent border-2 white  glow-button"
        >
          <div className="w-12 h-12 flex items-center justify-center text-pink-500 text-4xl">
            &#8594;
          </div>
        </button>
      </div>
    </div >
  );
}
