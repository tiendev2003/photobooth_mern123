"use client";

import { Store } from "@/lib/models/Store";
import { getStoreStyles } from "@/lib/storeUtils";
import Image from "next/image";

interface StoreBackgroundProps {
    currentStore: Store | null;
    children: React.ReactNode;
    className?: string;
}

export default function StoreBackground({ currentStore, children, className = "" }: StoreBackgroundProps) {
    const backgroundStyles = getStoreStyles(currentStore);

    return (
        <div
            className={`relative flex flex-col items-center justify-between min-h-screen text-white overflow-hidden ${className}`}
            style={backgroundStyles}
        >
            <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-black to-transparent z-0"></div>

            {!currentStore?.background && (
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
            )}

            {children}
        </div>
    );
}
