import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const ThemeToggle = () => {
  // 1. ESTADO INICIAL INTELIGENTE (Lazy State)
  // En lugar de un useEffect, usamos una función dentro de useState.
  // Esto se ejecuta UNA sola vez antes de que el componente se monte.
  const [isDark, setIsDark] = useState(() => {
    // Verificación de seguridad para evitar errores en compilación
    if (typeof window === 'undefined') return false;

    const storedTheme = localStorage.getItem('theme');
    const hasDarkClass = document.documentElement.classList.contains('dark');

    // Si el usuario guardó 'dark' O (no guardó nada Y el HTML ya es oscuro por defecto)
    return storedTheme === 'dark' || (!storedTheme && hasDarkClass);
  });

  // 2. EFECTO SIMPLE
  // Solo se encarga de pintar/despintar la clase cuando isDark cambia.
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="p-2 rounded-xl bg-surface border border-border text-text-muted hover:text-primary hover:border-primary transition-all shadow-sm cursor-pointer"
      title={isDark ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
    >
      {isDark ? (
        <Sun size={20} className="animate-fade-in" />
      ) : (
        <Moon size={20} className="animate-fade-in" />
      )}
    </button>
  );
};

export default ThemeToggle;