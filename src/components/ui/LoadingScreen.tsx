import React from "react";
import { TrendingUp } from "lucide-react";

const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center overflow-hidden relative">
      {/* Background Blobs - Void Style */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vh] h-[50vh] bg-primary-900/20 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50vh] h-[50vh] bg-primary-800/10 rounded-full blur-[100px] animate-pulse delay-700" />

      <div className="relative z-10 text-center">
        <div className="inline-flex items-center justify-center p-6 bg-surface/40 backdrop-blur-xl rounded-[2rem] shadow-[0_0_30px_rgba(6,182,212,0.2)] border border-white/10 mb-6 ">
          <TrendingUp className="text-primary-500 animate-bounce" size={56} />
        </div>
        <p className="text-text-main text-lg font-medium tracking-wide animate-pulse">
          Iniciando sistema...
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;
