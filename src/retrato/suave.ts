import Lenis from "lenis";
import "lenis/dist/lenis.css";

/**
 * Scroll suave en escritorio. La rueda del ratón avanza a saltos (~100 px) y
 * todo en esta página se mueve con el scroll: sin suavizar, túnel, vídeo y
 * terminal avanzan a tirones. Lenis interpola la posición con una pequeña
 * inercia.
 *
 * Solo con puntero fino: en táctil el scroll del dedo ya es suave. Con
 * movimiento reducido no se activa, y `?suave=0` en la dirección lo apaga
 * para comparar con el scroll nativo.
 */
export function activarScrollSuave() {
  const fino = window.matchMedia("(hover: hover) and (pointer: fine)");
  const reducido = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!fino.matches || reducido.matches) return;
  if (/[?&]suave=0/.test(location.search)) return;
  new Lenis({
    autoRaf: true,
    lerp: 0.1,
    wheelMultiplier: 0.9,
    // Los enlaces de la cabecera (#herramientas…) también se deslizan.
    anchors: true,
    // Dentro de las ventanas de proyecto, scroll nativo.
    prevent: (nodo) => !!nodo.closest("dialog"),
  });
}
