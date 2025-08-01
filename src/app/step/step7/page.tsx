"use client";

import StoreBackground from "@/app/components/StoreBackground";
import StoreHeader from "@/app/components/StoreHeader";
import StoreNavigationButtons from "@/app/components/StoreNavigationButtons";
import { useBooth } from "@/lib/context/BoothContext";
import { useDialog } from "@/lib/context/DialogContext";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Step7() {
  const router = useRouter();
  const { photos, selectedFrame, selectedIndices, setSelectedIndices, currentStore } = useBooth();
  
  // Define aspect ratios based on frame configurations (columns, rows, isCustom)
  const aspect_ratios: Record<string, [number, number]> = {
    "1,1,false": [16, 9],   // 1x1 frame (standard)
    "1,1,true": [1, 1],     // 1x1 circle frame
    "2,1,false": [1, 1],    // 2x1 frame
    "2,1,true": [3, 4],     // 2x1 custom frame
    "2,2,false": [4, 3],    // 2x2 frame
    "3,2,false": [5, 4],    // 3x2 frame
    "2,3,false": [13, 12],  // 2x3 frame
    "1,4,true": [4, 3],     // 1x4 custom frame
    "1,2,true": [3, 4]      // 1x2 custom frame
  };
  
  const handleBack = () => {
    router.push("/step/step6");
  };
  const {showDialog} = useDialog();
 

  const handleNext = () => {
    // Check if enough photos are selected
    const maxPhotos = selectedFrame?.isCustom
      ? selectedFrame.rows
      : selectedFrame
        ? selectedFrame.columns * selectedFrame.rows
        : 4; // Default to 4 if no frame selected
    const selectedCount = selectedIndices.filter(i => i !== undefined).length;
    if (selectedCount < maxPhotos) {
      showDialog({
        header: "Thông báo",
        content: `Vui lòng chọn ít nhất ${maxPhotos} ảnh để tiếp tục.`,
      });
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
      )}>
        <span className="text-xs">{"Empty"}</span>
      </div>
    );

    // Get aspect ratio based on frame type
    const frameKey = selectedFrame ? `${selectedFrame.columns},${selectedFrame.rows},${selectedFrame.isCustom}` : "";
    
    // Determine the correct aspect ratio for the cell
    let cellAspectRatio: [number, number];
    if (selectedFrame && selectedFrame.id === "1" && selectedFrame.columns === 1 && selectedFrame.rows === 1 && !selectedFrame.isCustom) {
      cellAspectRatio = [16, 9]; // Special case for id=1 (1x1 horizontal)
    } else if (selectedFrame && selectedFrame.isCircle) {
      cellAspectRatio = [1, 1]; // Perfect square for circle
    } else {
      cellAspectRatio = aspect_ratios[frameKey] || [4, 3]; // Default to 4:3 if not found
    }
    
    const baseClass = "relative flex items-center justify-center transition-all duration-200 overflow-hidden border border-transparent w-full h-full";
    const emptyClass = "border-dashed border-gray-200 bg-gray-50/50";
    const hasPhoto = selectedIndices[idx] !== undefined;
    
    return (
      <div
        key={idx}
        className={cn(
          baseClass,
          !hasPhoto && emptyClass,
          hasPhoto && "cursor-pointer",
          selectedFrame?.isCircle && "rounded-full",
        )}
        onClick={() => hasPhoto && handleRemovePhoto(idx)}
      >
        <div 
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
            // This ensures the image respects the aspect ratio within the container
            aspectRatio: selectedFrame?.id === "5" ? "4/3" : `${cellAspectRatio[0]}/${cellAspectRatio[1]}`,
            borderRadius: selectedFrame?.isCircle ? "50%" : "0",
            overflow: "hidden"
          }}
        >
          {cellContent}
        </div>
      </div>
    );
  };

  const renderPreview = () => {
    if (!selectedFrame) return null;
    const commonClasses = "mx-auto overflow-hidden shadow-md";

      
    // Calculate padding based on frame type - using only the template string
    let paddingTemplate = "";
    
    if (selectedFrame.columns === 1 && selectedFrame.rows === 1 && !selectedFrame.isCustom) {
      // 1x1 frame (4x6 horizontal) - top, left, right = 13px, bottom = whatever
      paddingTemplate = "px-[13px] pt-[13px] pb-0";
    } 
    else if (selectedFrame.columns === 1 && selectedFrame.rows === 1 && selectedFrame.isCircle) {
      // Circle frame - equal padding on left and right sides only, positioned in the center
      // Don't use padding template - we'll handle it with inline styles
      paddingTemplate = "";
    }
    else if (selectedFrame.columns === 1 && selectedFrame.rows === 2 && selectedFrame.isCustom) {
      // 1x2 custom frame - top, left, right = 13px, bottom = whatever
      paddingTemplate = "px-[13px] pt-[13px] pb-0";
    }
    else if (selectedFrame.columns === 2 && selectedFrame.rows === 1 && !selectedFrame.isCustom) {
      // 2x1 frame (2 items in 1 row) - all sides = 13px
      paddingTemplate = "px-[13px] pt-[13px] pb-[13px]";
    }
    else if (selectedFrame.columns === 2 && selectedFrame.rows === 2 && !selectedFrame.isCustom) {
      // 2x2 frame (horizontal) - top=13px, left=13px, bottom=13px, right=0 (remaining space on right)
      // Total vertical space used by padding/gap: 13px(top) + 13px(gap) + 13px(bottom) = 39px
      // Each image height: (480px - 39px) / 2 = 220.5px ≈ 220px
      // Each image width with aspect ratio 4:3: 220px * (4/3) = 293.33px
      // Remaining space on right: 720px - 13px(left padding) - 293.33px * 2 = 120.34px
      paddingTemplate = "pl-[13px] pt-[13px] pr-0 pb-[13px]";
    }
    else if (selectedFrame.columns === 3 && selectedFrame.rows === 2 && !selectedFrame.isCustom) {
      // 3x2 frame (horizontal, id=8) - top, left, right = 13px, bottom = whatever
      paddingTemplate = "px-[13px] pt-[13px] pb-0";
    }
    else if (selectedFrame.columns === 2 && selectedFrame.rows === 3 && !selectedFrame.isCustom) {
      // 2x3 frame (vertical) - top, left, right = 13px, bottom = whatever
      paddingTemplate = "px-[13px] pt-[13px] pb-0";
    }
    else if (selectedFrame.columns === 1 && selectedFrame.rows === 4 && selectedFrame.isCustom) {
      // 1x4 frame (vertical, custom) - all sides = 24px, gap = 13px
      paddingTemplate = "px-[24px] pt-[24px] pb-[24px]";
    }
    else {
      // Default padding
      paddingTemplate = "px-[13px] pt-[13px] pb-[13px]";
    }

    // Determine gap size based on frame type
    const gapSize = selectedFrame.columns === 2 && selectedFrame.rows === 1 && !selectedFrame.isCustom 
      ? "gap-[24px]" 
      : selectedFrame.columns === 1 && selectedFrame.rows === 4 && selectedFrame.isCustom
        ? "gap-[13px]"
        : "gap-[13px]";
    
    // Set fixed frame dimensions
    const isLandscape = selectedFrame.columns > selectedFrame.rows && !selectedFrame.isCustom || 
                       (selectedFrame.id === "1" && selectedFrame.columns === 1 && selectedFrame.rows === 1 && !selectedFrame.isCustom);
    
    // Fixed frame dimensions - these are the container sizes
    let frameWidth = isLandscape ? 720 : 480;
    let frameHeight = isLandscape ? 480 : 720;
    
    // For custom frames or circle frames, use special dimensions
    if (selectedFrame.isCustom) {
      frameWidth = 240;
      frameHeight = 720;
    } else if (selectedFrame.isCircle ) {
      // For circle frame, use portrait dimensions (480x720)
      frameWidth = 480;
      frameHeight = 720; // Keep portrait dimensions
    } else if(selectedFrame.id =="5"){
      // For 2x2 frame, landscape dimensions (720x480)
      // Each image should be exactly 220px tall ((480-39)/2) and 293px wide (220*4/3)
      // with 13px padding on top, left, bottom and 0px on right
      frameWidth = 720; 
      frameHeight = 480; // Maintain landscape aspect as per requirement
    }
    
    console.log("Frame dimensions:", { 
      frameWidth, 
      frameHeight, 
      isLandscape,
      paddingTemplate
    });
    
    return (
      <div className={cn("relative w-full", commonClasses)} style={{ 
        width: `${frameWidth}px`,
        height: `${frameHeight}px`,
        padding: "0",
        boxSizing: "border-box"
      }} >
        <div
          data-preview
          className={cn(
            "print-preview photo-booth-preview bg-white",
            !selectedFrame.isCircle && paddingTemplate, // Only apply padding template if not a circle
          )}
          style={{
            width: "100%",
            height: "100%",
            position: "relative", // Add position relative for absolute positioning of circle
          }}
        >
          {selectedFrame.isCircle ? (
            // Special rendering for circular frame
            <div 
              className="absolute"
              style={{
                width: "calc(100% - 26px)", // Account for 13px padding on each side
                left: "13px",
                right: "13px",
                top: "50%",
                transform: "translateY(-50%)",
                aspectRatio: "1/1", // Perfect circle
              }}
            >
              {renderCell(0)} {/* For circular frame there's only one cell */}
            </div>
          ) : selectedFrame.isCustom ? (
            <div className={`relative z-10 grid grid-cols-1 ${gapSize}`}>
              {Array.from({ length: selectedFrame.rows }, (_, idx) => renderCell(idx))}
            </div>
          ) : (
            <div
              className={cn(
                "relative z-10 grid",
                gapSize
              )}
              style={{
                display: "grid",
                gridTemplateColumns: selectedFrame.id === "5" ? 
                  "repeat(2, 293px)" : // Exact width for 2x2 frame
                  `repeat(${selectedFrame.columns}, 1fr)`,
                gridTemplateRows: selectedFrame.id === "5" ? 
                  "repeat(2, 220px)" : // Exact height for 2x2 frame
                  undefined,
                gap: "13px",
               }}
            >
              {Array.from({ length: selectedFrame.columns * selectedFrame.rows }, (_, idx) => {
                // Determine cell position directly for all frames
                return (
                  <div key={idx}>
                    {renderCell(idx)}
                  </div>
                );
              })}
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