import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";

// Control global de logs (puedes dejar esto si quieres)
if (import.meta.env.VITE_ENABLE_LOGS !== "true") {
  const noOp = () => {};
  console.log = noOp;
  console.debug = noOp;
  console.info = noOp;
}

// HE BORRADO EL BLOQUE "Inject Tailwind CSS globally" AQUÍ

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
