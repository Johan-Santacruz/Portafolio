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
let lenis: Lenis | null = null;

export function activarScrollSuave() {
  const fino = window.matchMedia("(hover: hover) and (pointer: fine)");
  const reducido = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!fino.matches || reducido.matches) return;
  if (/[?&]suave=0/.test(location.search)) return;
  lenis = new Lenis({
    autoRaf: true,
    lerp: 0.1,
    wheelMultiplier: 0.9,
    // Los enlaces de la cabecera (#herramientas…) también se deslizan.
    anchors: true,
    // Dentro de las ventanas de proyecto, scroll nativo.
    prevent: (nodo) => !!nodo.closest("dialog"),
  });
}

/** Curva suave: arranca y frena despacio. */
const suave = (v: number) => v * v * (3 - 2 * v);

let enCurso = false;

/**
 * Lleva la página hasta `y` en `ms`, sin que el gesto de quien lee la
 * interrumpa: las animaciones largas (el corte, el agujero negro) se
 * reproducen enteras en cuanto se pide bajar, en vez de avanzar a tirones
 * según cuánto se arrastre.
 *
 * Con Lenis lo hace Lenis (`lock`). Sin él —táctil, o con `?suave=0`— se
 * anima a mano y se bloquean rueda y dedo mientras dura. Devuelve `false` si
 * ya había un deslizamiento en curso.
 */
export function deslizarHasta(y: number, ms: number) {
  if (enCurso) return false;
  enCurso = true;
  const acabar = () => {
    enCurso = false;
  };

  if (lenis) {
    lenis.scrollTo(y, {
      duration: ms / 1000,
      lock: true,
      easing: suave,
      onComplete: acabar,
    });
    // Red de seguridad: si Lenis no avisa, se suelta igual.
    window.setTimeout(acabar, ms + 400);
    return true;
  }

  const desde = window.scrollY;
  const t0 = performance.now();
  const frenar = (ev: Event) => ev.preventDefault();
  window.addEventListener("wheel", frenar, { passive: false });
  window.addEventListener("touchmove", frenar, { passive: false });
  const paso = (t: number) => {
    const k = Math.min(1, (t - t0) / ms);
    window.scrollTo(0, desde + (y - desde) * suave(k));
    if (k < 1) requestAnimationFrame(paso);
    else {
      window.removeEventListener("wheel", frenar);
      window.removeEventListener("touchmove", frenar);
      acabar();
    }
  };
  requestAnimationFrame(paso);
  return true;
}

/** Si hay un deslizamiento automático en marcha. */
export function deslizando() {
  return enCurso;
}
