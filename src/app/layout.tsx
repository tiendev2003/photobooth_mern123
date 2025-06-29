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

 

export const metadata: Metadata = {
  title: "Photobooth Admin",
  description: "Photobooth admin management system",
};

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
