import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

// Control global de logs basado en el archivo .env
if (import.meta.env.VITE_ENABLE_LOGS !== 'true') {
  const noOp = () => {};
  console.log = noOp;
  console.debug = noOp;
  console.info = noOp;
  // Mantener console.warn y console.error por seguridad técnica
}

// Inject Tailwind CSS globally
if (typeof document !== "undefined") {
  const script = document.createElement("script");
  script.src = "https://cdn.tailwindcss.com";
  document.head.appendChild(script);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
