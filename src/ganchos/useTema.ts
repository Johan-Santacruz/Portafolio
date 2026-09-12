import { useCallback, useEffect, useState } from "react";

export type Tema = "light" | "dark";

const CLAVE = "tema";

function leerGuardado(): Tema | null {
  try {
    const valor = localStorage.getItem(CLAVE);
    return valor === "light" || valor === "dark" ? valor : null;
  } catch {
    // Ventana privada o almacenamiento bloqueado: seguimos con el tema del sistema.
    return null;
  }
}

function temaDelSistema(): Tema {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * Sin elección guardada devolvemos `null` y no marcamos el documento, para que
 * el CSS resuelva el tema con `prefers-color-scheme`. Solo al alternar se
 * estampa `data-theme` en la raíz.
 */
export function useTema() {
  const [tema, setTema] = useState<Tema | null>(() => leerGuardado());

  useEffect(() => {
    const raiz = document.documentElement;
    if (tema) raiz.setAttribute("data-theme", tema);
    else raiz.removeAttribute("data-theme");
  }, [tema]);

  const alternar = useCallback(() => {
    setTema((actual) => {
      const efectivo = actual ?? temaDelSistema();
      const siguiente: Tema = efectivo === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(CLAVE, siguiente);
      } catch {
        // El tema sigue aplicándose en esta sesión aunque no se pueda guardar.
      }
      return siguiente;
    });
  }, []);

  return { tema, alternar };
}
