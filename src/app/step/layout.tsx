"use client";

import AuthGuard from "@/app/components/AuthGuard";
import { ReactNode } from "react";

export default function StepLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="bg-purple-900 min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(124,58,237,0.3)_0%,_rgba(76,29,149,0.5)_70%)]"></div>
        </div>
        {children}
      </div>
    </AuthGuard>
  );
}
