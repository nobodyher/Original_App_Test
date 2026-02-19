import React from "react";
import { DashboardSkeleton } from "./Skeleton";

const LoadingScreen: React.FC = () => {
  return (
    <div className="flex h-screen bg-bg-main overflow-hidden animate-in fade-in duration-300">
      {/* Sidebar Mockup (Desktop) */}
      <div className="hidden md:flex flex-col w-52 bg-surface border-r border-border shrink-0 p-4 relative z-20">
        <div className="h-8 w-32 bg-surface-highlight rounded-lg animate-pulse mb-8 ml-2 mt-2" />
        <div className="space-y-2">
           {[1, 2, 3, 4, 5, 6].map((i) => (
             <div key={i} className="h-12 w-full bg-surface-highlight rounded-xl animate-pulse opacity-60" />
           ))}
        </div>
        <div className="mt-auto pt-4 border-t border-border">
            <div className="h-14 w-full bg-surface-highlight rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Main Content Mockup */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
           <DashboardSkeleton />
        </div>
      </div>
    </div>
  );
};
export default LoadingScreen;
