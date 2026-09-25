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
  if (reducido.matches) return;
  if (/[?&]suave=0/.test(location.search)) return;
  // En táctil, de momento solo a prueba, con `?suave=1` en la dirección:
  // Lenis sustituye el scroll nativo del teléfono (que ya va fuera del hilo
  // principal) por uno hecho en JavaScript, y en un gama media puede ir con
  // retraso respecto al dedo o pelear con la barra del navegador. Se deja
  // así para compararlo en teléfonos de verdad antes de ponerlo por defecto.
  const tactilDePrueba = !fino.matches && /[?&]suave=1/.test(location.search);
  if (!fino.matches && !tactilDePrueba) return;
  lenis = new Lenis({
    autoRaf: true,
    lerp: 0.1,
    wheelMultiplier: 0.9,
    // Los enlaces de la cabecera (#herramientas…) también se deslizan.
    anchors: true,
    // Dentro de las ventanas de proyecto, scroll nativo.
    prevent: (nodo) => !!nodo.closest("dialog"),
    // El dedo con inercia suave, como la rueda en escritorio.
    ...(tactilDePrueba
      ? { syncTouch: true, syncTouchLerp: 0.085, touchInertiaExponent: 1.7 }
      : {}),
  });
}

/** Curva suave: arranca y frena despacio. */
const suave = (v: number) => v * v * (3 - 2 * v);

let enCurso = false;

/**
 * Lleva la página hasta `y` en `ms`: las animaciones largas (el túnel, el
 * corte, el agujero negro) se terminan solas en cuanto se pide bajar, en vez
 * de avanzar a tirones según cuánto se arrastre.
 *
 * Mientras dura, seguir bajando no lo corta: va al mismo sitio al que va el
 * lector, y con el trackpad la inercia manda eventos de rueda casi un segundo
 * después de soltar el dedo, que antes lo cancelaban siempre. Lo que sí lo
 * corta es querer otra cosa: rueda hacia arriba o un dedo en la pantalla. Ahí
 * manda el lector y la página se queda donde va, no donde iba.
 *
 * Devuelve `false` si ya había un deslizamiento en curso.
 */
export function deslizarHasta(y: number, ms: number) {
  if (enCurso) return false;
  enCurso = true;
  let vivo = true;
  let reloj = 0;
  const soltar = () => {
    if (!vivo) return;
    vivo = false;
    enCurso = false;
    window.clearTimeout(reloj);
    window.removeEventListener("wheel", alRodar);
    window.removeEventListener("touchstart", cortar);
  };
  const cortar = () => {
    if (!vivo) return;
    // `stop` y `start` pasan por `reset`, que quita el cerrojo y deja la
    // página donde está en ese momento.
    if (lenis) {
      lenis.stop();
      soltar();
      lenis.start();
    } else soltar();
  };
  /** Hacia abajo es hacia donde vamos: solo corta echarse atrás. */
  const alRodar = (ev: WheelEvent) => {
    if (ev.deltaY < 0) cortar();
  };
  window.addEventListener("wheel", alRodar, { passive: true });
  window.addEventListener("touchstart", cortar, { passive: true });

  if (lenis) {
    lenis.scrollTo(y, {
      duration: ms / 1000,
      easing: suave,
      // Con cerrojo, o la inercia de la rueda sustituye la animación por un
      // scroll normal y el tramo vuelve a hacerse a tirones.
      lock: true,
      onComplete: soltar,
    });
    // Red de seguridad: si Lenis no avisa, se suelta igual, y con `cortar`
    // para que no quede el cerrojo puesto.
    reloj = window.setTimeout(cortar, ms + 400);
    return true;
  }

  const desde = window.scrollY;
  const t0 = performance.now();
  const paso = (t: number) => {
    if (!vivo) return;
    const k = Math.min(1, (t - t0) / ms);
    window.scrollTo(0, desde + (y - desde) * suave(k));
    if (k < 1) requestAnimationFrame(paso);
    else soltar();
  };
  reloj = window.setTimeout(soltar, ms + 400);
  requestAnimationFrame(paso);
  return true;
}

/**
 * Lleva la página a `y` con un deslizamiento corto que se puede interrumpir
 * en cualquier momento: sin cerrojo, la rueda o el dedo mandan en cuanto se
 * mueven. Es para lo que pide quien lee (ir a una categoría) o para asentar el
 * lector en la categoría más cercana, no para las animaciones largas.
 */
export function irSuave(y: number, ms: number) {
  if (lenis) {
    lenis.scrollTo(y, { duration: ms / 1000, easing: suave });
    return;
  }
  const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: y, behavior: reducido ? "instant" : "smooth" });
}

/** Si hay un deslizamiento automático en marcha. */
export function deslizando() {
  return enCurso;
}
