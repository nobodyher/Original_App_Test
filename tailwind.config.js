/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 🌑 FONDO (Base profunda, no negro puro)
        background: '#020617',      // Slate-950 (Azul muy oscuro, casi negro)
        
        // 🃏 SUPERFICIES (Tarjetas - Aquí estaba el error)
        // Antes eran muy claras. Ahora serán sutilmente más claras que el fondo.
        surface: '#0F172A',         // Slate-900 (La tarjeta base)
        'surface-highlight': '#1E293B', // Slate-800 (Hover o Inputs)
        'surface-active': '#334155',    // Slate-700 (Seleccionado)

        // ⚡ MARCA (Voidly Cyan - Ajustado para no vibrar demasiado)
        primary: {
          DEFAULT: '#06B6D4',       // Cyan-500 (Más legible)
          400: '#22D3EE',           // Cyan-400 (Brillo)
          500: '#06B6D4',           // Base
          600: '#0891B2',           // Hover oscuro
          700: '#0E7490',
          800: '#155E75',
          900: '#164E63',
          foreground: '#FFFFFF',    // Texto Blanco sobre Cyan oscuro (Mejor contraste)
        },

        // 🔮 SECUNDARIO
        secondary: {
          DEFAULT: '#6366F1',       // Indigo (Más suave que el violeta neón)
        },

        // 📝 TEXTOS (Jerarquía visual)
        text: {
          main: '#F1F5F9',          // Slate-100 (Blanco hueso, no quema)
          muted: '#94A3B8',         // Slate-400 (Texto secundario)
          dim: '#475569',           // Slate-600 (Detalles sutiles)
        },

        // 🧱 BORDES (La clave del Dark Mode moderno)
        border: '#1E293B',          // Slate-800 (Casi invisible)
        'border-highlight': '#334155', // Slate-700
        
        // 🚦 ESTADOS
        success: '#10B981', 
        warning: '#F59E0B', 
        danger: '#EF4444', 
      },

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
