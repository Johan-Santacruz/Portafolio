import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./estilos/global.css";
import { App } from "./App";

const contenedor = document.getElementById("root");
if (!contenedor) throw new Error("Falta el elemento #root en index.html");

createRoot(contenedor).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
