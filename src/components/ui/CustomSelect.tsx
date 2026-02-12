import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface Option {
  label: string;
  value: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "Seleccionar...",
  className = "",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {/* Trigger */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-3 h-10 rounded-lg bg-surface border border-border text-text-main text-sm flex justify-between items-center cursor-pointer transition-all duration-300 ${
            isOpen ? 'border-primary ring-4 ring-primary/10' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50'}`}
      >
        <span className={`flex-1 text-left truncate ${!selectedOption ? "text-text-muted" : "text-text-main font-medium"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`text-text-muted transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : ''}`}
        />
      </div>

      {/* Dropdown Options */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-2 bg-surface border border-border rounded-xl shadow-xl z-[999] overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-60 overflow-y-auto">
          {options.length > 0 ? (
            options.map((option) => (
              <div
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`px-3 py-2 text-sm cursor-pointer transition-colors flex items-center justify-between ${
                  value === option.value
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-text-main hover:bg-surface-highlight hover:text-primary"
                }`}
              >
                <span>{option.label}</span>
                {value === option.value && (
                  <Check size={14} className="text-primary" />
                )}
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-text-muted text-sm">
              No hay opciones disponibles
            </div>
          )}
        </div>
      )}
    </div>
  );
};
