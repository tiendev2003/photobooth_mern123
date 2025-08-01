import { AuthProvider } from "@/lib/context/AuthContext";
import type { Metadata, Viewport } from "next";
import { Ubuntu } from "next/font/google";
import { BoothProvider } from "../lib/context/BoothContext";
import CleanupScheduler from "./components/CleanupScheduler";
import "./globals.css";
import { DialogProvider } from "@/lib/context/DialogContext";

const ubuntu = Ubuntu({
  subsets: ["latin"],
  weight: ["400", "700"], // chọn các weight bạn cần
  variable: "--font-ubuntu", // optional: sử dụng biến CSS
});

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "S Photobooth - Unique Photo Booth",
    description:
      "Capture fun moments and create photo strips with S Photobooth. Try it now!",
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "S Photobooth",
    },
    openGraph: {
      title: "S Photobooth - Unique Photo Booth",
      description:
        "Capture fun moments and create photo strips with S Photobooth. Try it now!",
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
      description:
        "Capture fun moments and create photo strips with S Photobooth. Try it now!",
      images: ["https://s.mayphotobooth.com/og-image.jpg"],
    },
    other: {
      "apple-mobile-web-app-title": "S Photobooth",
      "apple-mobile-web-app-capable": "yes",
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
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon.png" />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/web-app-manifest-192x192.png"
        />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon.ico" />
      </head>
      <body
        className={`${ubuntu.className} antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <CleanupScheduler />
          <BoothProvider>
            <DialogProvider>{children}</DialogProvider>
          </BoothProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
