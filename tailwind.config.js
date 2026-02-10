/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          400: '#c39a7c', // Earth Light / Accent
          600: '#885f43', // Earth Base
          700: '#5f422f', // Earth Dark / Hover
        },
        neutral: {
          50: '#f9f8f6', // Off-white / Background
          200: '#dad0c6', // Borders
          900: '#1d1d1b', // Soft Black / Text Main
        },
        // Aquí conectamos Tailwind con nuestras variables CSS para mantener compatibilidad
        brand: {
          primary: "var(--color-primary)",
          secondary: "var(--color-secondary)",
          accent: "var(--color-accent)",
          dark: "var(--color-text)",
          bg: "var(--color-background)",
        }
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
