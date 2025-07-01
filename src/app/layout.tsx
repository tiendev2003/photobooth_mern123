import { AuthProvider } from "@/lib/context/AuthContext";
import type { Metadata } from "next";
import { Ubuntu } from "next/font/google";
import { BoothProvider } from "../lib/context/BoothContext";
import CleanupScheduler from "./components/CleanupScheduler";
import "./globals.css";


const ubuntu = Ubuntu({
  subsets: ["latin"],
  weight: ["400", "700"], // chọn các weight bạn cần
  variable: "--font-ubuntu", // optional: sử dụng biến CSS
});

 export async function generateMetadata(): Promise<Metadata> {
   return {
    title: "S Photobooth - Unique Photo Booth",
    description: "Capture fun moments and create photo strips with S Photobooth. Try it now!",
    openGraph: {
      title: "S Photobooth - Unique Photo Booth",
      description: "Capture fun moments and create photo strips with S Photobooth. Try it now!",
      url: "https://s.mayphotobooth.com/",
      siteName: "S Photobooth",
      images: [
        {
          url: "https://s.mayphotobooth.com/og-image.jpg",
          width: 980,
          height: 980,
          alt: "S Photobooth",
        },
      ],
      type: "website",
      locale: "vi_VN",
    },
    twitter: {
      card: "summary_large_image",
      title: "S Photobooth - Unique Photo Booth",
      description: "Capture fun moments and create photo strips with S Photobooth. Try it now!",
      images: ["https://s.mayphotobooth.com/og-image.jpg"],
    },
    other: {
      "apple-mobile-web-app-title": "S Photobooth",
      viewport:
        "width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes",
      keywords:
        "photo booth, online camera, photo strips, selfie booth, fun photo app",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${ubuntu.className} antialiased select-none`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <CleanupScheduler />
          {/* BoothProvider for photobooth context */}
          <BoothProvider>
            {children}
          </BoothProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
           