import React from "react";
import { TrendingUp } from "lucide-react";

const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center overflow-hidden relative">
      {/* Background Blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vh] h-[50vh] bg-[#3A1078]/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50vh] h-[50vh] bg-[#88304E]/20 rounded-full blur-[100px]" />
      
      <div className="relative z-10 text-center">
         <div className="inline-flex items-center justify-center p-6 bg-white/40 backdrop-blur-xl rounded-[2rem] shadow-glass border border-white/50 mb-6 animate-pulse">
            <TrendingUp className="text-[#3A1078]" size={56} />
         </div>
         <p className="text-[#0F172A] text-lg font-medium tracking-wide">Iniciando sistema...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;