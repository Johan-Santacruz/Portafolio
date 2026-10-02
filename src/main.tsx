import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./estilos/fuentes.css";
import "./estilos/global.css";
import { App } from "./App";
import { ProveedorIdioma } from "./idioma/idioma";
import { activarScrollSuave } from "./retrato/suave";
import { activarDiagnostico } from "./retrato/diag";
import { pantallaDeCarga } from "./retrato/carga";

const contenedor = document.getElementById("root");
if (!contenedor) throw new Error("Falta el elemento #root en index.html");

const montar = () =>
  createRoot(contenedor).render(
    <StrictMode>
      <ProveedorIdioma>
        <App />
      </ProveedorIdioma>
    </StrictMode>,
  );

// Primero se pinta la pantalla de carga y luego monta React. Si el
// JavaScript llegaba antes que el primer fotograma, la página entera se
// construía antes de pintar nada: más rato en blanco en un celular lento, y
// las imágenes de la portada pedidas antes de esa primera pintura, que
// Lighthouse sumaba a su LCP. En una pestaña de fondo no hay fotogramas
// (requestAnimationFrame espera a que se vea), así que ahí monta ya.
if (document.visibilityState === "visible") {
  requestAnimationFrame(() => setTimeout(montar));
} else {
  montar();
}

pantallaDeCarga();
activarScrollSuave();
activarDiagnostico();
