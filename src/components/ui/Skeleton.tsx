import React from "react";

interface SkeletonProps {
  className?: string;
  variant?: "circle" | "rectangle" | "text";
  height?: string | number;
  width?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  variant = "rectangle",
  height,
  width,
}) => {
  const baseClasses = "animate-pulse bg-surface-highlight"; // Dark theme base color

  let variantClasses = "";
  switch (variant) {
    case "circle":
      variantClasses = "rounded-full";
      break;
    case "text":
      variantClasses = "rounded-md";
      break;
    case "rectangle":
    default:
      variantClasses = "rounded-xl"; // Slightly rounded corners for a modern feel
      break;
  }

  const style = {
    height: height,
    width: width,
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses} ${className}`}
      style={style}
    />
  );
};

export const DashboardSkeleton = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton variant="text" width={200} height={32} />
          <Skeleton variant="text" width={300} height={20} />
        </div>
        <Skeleton variant="rectangle" width={120} height={40} />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-surface rounded-[2rem] p-6 border border-white/5 relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-4">
              <Skeleton
                variant="text"
                width={100}
                height={20}
                className="opacity-70"
              />
              <Skeleton
                variant="circle"
                width={40}
                height={40}
                className="bg-white/5"
              />
            </div>
            <Skeleton variant="text" width={120} height={40} className="mb-2" />
            <Skeleton
              variant="text"
              width={80}
              height={24}
              className="rounded-full opacity-60"
            />
          </div>
        ))}
      </div>

      {/* Charts / Large Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-surface rounded-[2.5rem] p-8 border border-white/5 h-[350px] flex flex-col gap-4">
          <div className="flex justify-between items-center mb-4">
            <Skeleton variant="text" width={150} height={28} />
            <Skeleton
              variant="rectangle"
              width={80}
              height={24}
              className="rounded-full"
            />
          </div>
          <div className="flex items-end justify-between h-full gap-2 px-4">
            {[60, 40, 75, 55, 80, 45, 70].map((height, i) => (
              <Skeleton
                key={i}
                variant="rectangle"
                width="100%"
                height={`${height}%`}
                className="rounded-t-lg bg-surface-highlight"
              />
            ))}
          </div>
        </div>
        <div className="bg-surface rounded-[2.5rem] p-8 border border-white/5 h-[350px] flex flex-col gap-4">
          <Skeleton variant="text" width={180} height={28} className="mb-4" />
          <div className="flex items-center justify-center h-full">
            <Skeleton
              variant="circle"
              width={200}
              height={200}
              className="border-8 border-surface ring-4 ring-white/5"
            />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-surface rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <Skeleton variant="text" width={180} height={24} />
          <Skeleton variant="rectangle" width={100} height={32} />
        </div>
        <div className="p-4 space-y-4">
          {/* Table Header */}
          <div className="grid grid-cols-5 gap-4 px-4 py-2 bg-white/5 rounded-lg">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} variant="text" width="60%" height={16} />
            ))}
          </div>
          {/* Table Rows */}
          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="grid grid-cols-5 gap-4 px-4 py-3 border-b border-white/5 last:border-0 items-center"
            >
              <div className="flex items-center gap-3">
                <Skeleton variant="circle" width={32} height={32} />
                <Skeleton variant="text" width={100} height={16} />
              </div>
              <Skeleton variant="text" width="80%" height={16} />
              <Skeleton variant="text" width="50%" height={16} />
              <Skeleton variant="text" width="40%" height={16} />
              <div className="flex justify-end">
                <Skeleton
                  variant="rectangle"
                  width={80}
                  height={24}
                  className="rounded-full"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const TableSkeleton = () => {
  return (
    <div className="bg-surface rounded-2xl border border-white/5 overflow-hidden animate-in fade-in duration-500 w-full max-w-7xl mx-auto">
      <div className="p-6 border-b border-white/5 flex justify-between items-center">
        <Skeleton variant="text" width={180} height={24} />
        <Skeleton variant="rectangle" width={100} height={32} />
      </div>
      <div className="p-4 space-y-4">
        {/* Table Header */}
        <div className="grid grid-cols-5 gap-4 px-4 py-3 bg-white/5 rounded-lg">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} variant="text" width="60%" height={16} />
          ))}
        </div>
        {/* Table Rows */}
        {[1, 2, 3, 4, 5, 6].map((row) => (
          <div
            key={row}
            className="grid grid-cols-5 gap-4 px-4 py-4 border-b border-white/5 last:border-0 items-center"
          >
            <div className="flex items-center gap-3">
              <Skeleton variant="circle" width={32} height={32} />
              <Skeleton variant="text" width={100} height={16} />
            </div>
            <Skeleton variant="text" width="80%" height={16} />
            <Skeleton variant="text" width="50%" height={16} />
            <Skeleton variant="text" width="40%" height={16} />
            <div className="flex justify-end">
              <Skeleton
                variant="rectangle"
                width={80}
                height={24}
                className="rounded-full"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
