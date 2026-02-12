/** @type {import('tailwindcss').Config} */

// Función para permitir opacidad con variables CSS (ej: bg-primary/20)
function withOpacity(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgb(var(${variableName}) / ${opacityValue})`
    }
    return `rgb(var(${variableName}))`
  }
}

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Activa el modo oscuro manual
  theme: {
    extend: {
      colors: {
        // --- COLORES DINÁMICOS (Cambian Light/Dark) ---
        background: withOpacity('--background'),
        surface: withOpacity('--surface'),
        'surface-highlight': withOpacity('--surface-highlight'),
        'surface-active': withOpacity('--surface-active'),

        // Marca Adaptable
        primary: {
          DEFAULT: withOpacity('--primary'),
          // Variantes fijas para mantener compatibilidad si las usas
          400: '#22D3EE', 
          500: withOpacity('--primary'),
          600: '#0891B2',
          700: '#0E7490',
          800: '#155E75',
          900: '#164E63',
          foreground: '#FFFFFF',
        },

        secondary: {
          DEFAULT: withOpacity('--secondary'),
        },

        text: {
          main: withOpacity('--text-main'),
          muted: withOpacity('--text-muted'),
          dim: withOpacity('--text-dim'),
        },

        border: withOpacity('--border'),
        'border-highlight': withOpacity('--border-highlight'),

        // --- COLORES FIJOS (Estados) ---
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
      },

      // --- TUS ANIMACIONES ORIGINALES (INTACTAS) ---
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.7s ease-out forwards',
      }
    },
  },
  plugins: [],
}
