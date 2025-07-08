"use client";

import { Store } from "@/lib/models/Store";
import { getStorePrimaryColor } from "@/lib/storeUtils";
import Image from "next/image";
import HomeButton from "./HomeButton";
import LogoApp from "./LogoApp";

interface StoreHeaderProps {
    currentStore: Store | null;
    title: string | React.ReactNode;
    titleClassName?: string;
}

export default function StoreHeader({ currentStore, title, titleClassName = "" }: StoreHeaderProps) {
    return (
        <header className="flex justify-between items-center w-full px-6 pt-10 z-10">
            <div className="flex items-center gap-4">
                {currentStore?.logo ? (
                    <div className="">
                        <Image
                            src={currentStore.logo}
                            alt={currentStore.name}
                            width={300}
                            height={150}
                        />

                    </div>
                ) : (
                    <LogoApp />
                )}
            </div>
            <h1
                className={`text-white text-3xl md:text-5xl lg:text-6xl font-bold text-center tracking-wide ${titleClassName}`}
                style={{ color: getStorePrimaryColor(currentStore) }}
            >
                {title}
            </h1>
            <HomeButton />
        </header>
    );
}
