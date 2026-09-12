import { useEffect } from "react";

/**
 * Escribe en `--avance` (0 a 1) cuánto se ha recorrido la página, para la
 * barrita de progreso. Se actualiza dentro de un rAF para no pelear con el
 * scroll.
 */
export function useAvance() {
  useEffect(() => {
    let pendiente = false;
    const calcular = () => {
      pendiente = false;
      const alto =
        document.documentElement.scrollHeight - window.innerHeight || 1;
      const avance = Math.min(1, Math.max(0, window.scrollY / alto));
      document.documentElement.style.setProperty("--avance", String(avance));
    };
    const alHacerScroll = () => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(calcular);
    };
    calcular();
    window.addEventListener("scroll", alHacerScroll, { passive: true });
    window.addEventListener("resize", alHacerScroll);
    return () => {
      window.removeEventListener("scroll", alHacerScroll);
      window.removeEventListener("resize", alHacerScroll);
    };
  }, []);
}
