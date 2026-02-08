import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = "", ...props }) => {
  return (
    <div
      className={`bg-white/60 backdrop-blur-xl border border-white/50 rounded-[2.5rem] shadow-xl ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};