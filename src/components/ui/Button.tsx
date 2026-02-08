import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  fullWidth = false,
  isLoading = false,
  className = "",
  children,
  disabled,
  ...props
}) => {
  // Estilos base (animaciones, posición, fuente)
  const baseStyles = "rounded-2xl font-bold transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 outline-none";
  
  // Variantes de color
  const variants = {
    // AHORA: usamos los colores 'brand' que definimos
    primary: "bg-gradient-to-r from-brand-primary to-brand-secondary text-white hover:shadow-xl hover:-translate-y-1 shadow-lg",
    
    secondary: "bg-white/50 border border-white/60 text-brand-dark hover:bg-white/80 hover:scale-105 shadow-sm font-semibold",
    
    ghost: "bg-transparent hover:bg-white/20 text-brand-dark",
    
    danger: "bg-white/30 border border-white/40 text-red-600 hover:bg-red-50 hover:border-red-200 hover:scale-105",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {children}
        </>
      ) : (
        children
      )}
    </button>
  );
};