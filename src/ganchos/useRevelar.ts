import { useEffect } from "react";

/**
 * Revela los elementos marcados con `data-revelar` cuando entran en pantalla.
 * Observa el documento completo desde `App`, así que un componente nuevo solo
 * necesita el atributo; no hace falta pasar refs ni envolverlo en nada.
 * Con movimiento reducido o sin IntersectionObserver, todo aparece de una vez.
 */
export function useRevelar() {
  useEffect(() => {
    const nodos = () =>
      document.querySelectorAll<HTMLElement>("[data-revelar]:not(.revelado)");

    const sinMovimiento = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (sinMovimiento || !("IntersectionObserver" in window)) {
      for (const nodo of nodos()) nodo.classList.add("revelado");
      return;
    }

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) continue;
          entrada.target.classList.add("revelado");
          observador.unobserve(entrada.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.06 },
    );
    for (const nodo of nodos()) observador.observe(nodo);

    // Los detalles de proyecto añaden contenido al abrirse: volvemos a mirar.
    const mutaciones = new MutationObserver(() => {
      for (const nodo of nodos()) observador.observe(nodo);
    });
    mutaciones.observe(document.body, { childList: true, subtree: true });

    return () => {
      observador.disconnect();
      mutaciones.disconnect();
    };
  }, []);
}
