"use client";

import AuthGuard from "@/app/components/AuthGuard";
import { ReactNode } from "react";
  
export default function StepLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="bg-purple-900 min-h-screen relative overflow-hidden">
        {/* Global visual effects that apply to all steps */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(124,58,237,0.3)_0%,_rgba(76,29,149,0.5)_70%)]"></div>
        </div>
        {children}
      </div>
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        
        .floating {
          animation: float 6s ease-in-out infinite;
        }
        
        .glow-pulse {
          animation: glow-pulse 4s ease-in-out infinite;
        }
      `}</style>
    </AuthGuard>
  );
}
