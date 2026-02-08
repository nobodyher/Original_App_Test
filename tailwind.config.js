/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Aquí conectamos Tailwind con nuestras variables CSS
        brand: {
          primary: "var(--color-primary)",
          secondary: "var(--color-secondary)",
          accent: "var(--color-accent)",
          dark: "var(--color-text)",
          bg: "var(--color-background)",
        }
      }
    },
  },
  plugins: [],
}