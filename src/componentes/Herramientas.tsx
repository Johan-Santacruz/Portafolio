import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { iconos, stack } from "../datos/stack";
import { useIdioma } from "../idioma/idioma";
import { textos } from "../idioma/textos";
import { vigilarCercania } from "../retrato/cercania";
import { deslizando, deslizarHasta, irSuave } from "../retrato/suave";
import { SecuenciaFotogramas } from "../retrato/secuencia";
import { esCelular } from "../retrato/telefono";
import { Tunel } from "./Tunel";
import { Glifo } from "./Glifo";
import "./Herramientas.css";

const ICONOS = `${import.meta.env.BASE_URL}iconos/`;
/** Fotogramas del agujero negro (de `video6.mp4`, con el blanco y el negro
 *  llevados a los de la página). Ver README, «Movimiento». */
const AGUJERO = `${import.meta.env.BASE_URL}imagenes/agujero/`;
const AGUJERO_MINI = `${import.meta.env.BASE_URL}imagenes/agujero-mini/`;
const AGUJERO_MOVIL = `${import.meta.env.BASE_URL}imagenes/agujero-movil/`;
const FOTOGRAMAS = 52;
/** Fotogramas del corte entre lo técnico y el criterio (de `video8.mp4`). */
const CORTE = `${import.meta.env.BASE_URL}imagenes/corte/`;
const CORTE_MINI = `${import.meta.env.BASE_URL}imagenes/corte-mini/`;
const CORTES = 32;

/**
 * Herramientas como una lista de palabras que pasa por un lector.
 *
 * La sección mide varias pantallas y su contenido queda fijo. Al bajar, la
 * columna de categorías sube: la que pasa por el centro (junto a la marca
 * lima) se enciende y las demás se quedan en contorno, apagándose hacia los
 * bordes. A la derecha solo están las herramientas de la categoría activa;
 * al cambiar, las anteriores salen en la dirección del scroll y las nuevas
 * se imprimen en cascada.
 *
 * Todo sale de `--p` (posición en la lista, continua de 0 a N−1) y de
 * `data-estado` en cada grupo, que escribe este componente con el scroll.
 * Los datos salen de `datos/stack.ts`.
 */

/** Lo que tardan en reproducirse solas las animaciones largas, en ms. */
const DURACION_TUNEL = 1100;
/** El corte y, sin soltar, el armado de las habilidades blandas. */
const DURACION_CORTE = 1500;
/** El agujero y, sin soltar, la llegada de los proyectos. */
const DURACION_AGUJERO = 1900;

/** Tramos del recorrido que la lista se queda quieta al empezar y al acabar. */
const PAUSA_INICIO = 0.06;
const PAUSA_FINAL = 0.05;
/** Parte de cada tramo entre dos palabras en que la lista reposa. */
const REPOSO = 0.45;

/** Avance con reposo: se queda en cada entero y se desliza entre ellos. */
function conReposo(x: number) {
  const i = Math.floor(x);
  const f = x - i;
  const g = Math.min(1, Math.max(0, (f - REPOSO / 2) / (1 - REPOSO)));
  return i + g * g * (3 - 2 * g);
}

export function Herramientas() {
  const { di } = useIdioma();
  const seccion = useRef<HTMLElement>(null);
  // Ir a una categoría al pulsar su palabra en el lector. Lo rellena el
  // efecto, que es quien sabe dónde queda cada una.
  const irA = useRef<(i: number) => void>(() => {});

  useEffect(() => {
    const raiz = seccion.current;
    if (!raiz) return;
    const grupos = Array.from(raiz.querySelectorAll<HTMLElement>(".herr-grupo"));
    const botones = Array.from(raiz.querySelectorAll<HTMLElement>(".herr-ir"));
    // Mide --tunel en px (svh no se puede leer desde CSS).
    const sonda = raiz.querySelector<HTMLElement>(".herr-sonda");
    const sondaAgujero = raiz.querySelector<HTMLElement>(".herr-sonda-agujero");
    const sondaCorte = raiz.querySelector<HTMLElement>(".herr-sonda-corte");
    const lienzo = raiz.querySelector<HTMLCanvasElement>(".herr-agujero");
    const lienzoCorte = raiz.querySelector<HTMLCanvasElement>(".herr-corte");
    const fijo = raiz.querySelector<HTMLElement>(".herr-fijo");
    const palabras = raiz.querySelector<HTMLElement>(".herr-palabras");
    const marca = raiz.querySelector<HTMLElement>(".herr-marca");
    const destino = raiz.querySelector<HTMLElement>(".herr-destino");
    // Dónde se escribe cada variable del scroll: en el elemento más pequeño
    // que la usa. Una variable en la raíz obliga a recalcular el estilo de
    // los 450 elementos de la sección en cada fotograma, y en un teléfono de
    // gama media eso eran 30-100 ms por fotograma: la sección se quedaba
    // pegada. `--p` solo la usan el lector y el riel; `--pt` y `--vel`, el
    // túnel; `--arma`, la rejilla del criterio.
    const lector = raiz.querySelector<HTMLElement>(".herr-lector");
    const riel = raiz.querySelector<HTMLElement>(".herr-riel");
    const tunelCapa = raiz.querySelector<HTMLElement>(".tunel");
    const rejillaCriterio = raiz.querySelector<HTMLElement>(".herr-criterio");
    // La orden del final: solo ella usa --cubre, y con el lienzo, --traga.
    const final = raiz.querySelector<HTMLElement>(".herr-final");

    // El destino («LENGUAJES» al fondo del túnel) acaba exactamente donde está
    // la primera palabra del lector: se mide esa posición y desde dónde sale
    // (el centro de la pantalla). Se mide con las placas sin transformar
    // (en ninguna fase llevan transform).
    const colocarDestino = () => {
      if (!fijo || !palabras || !marca || !destino) return;
      const f = fijo.getBoundingClientRect();
      const ul = palabras.getBoundingClientRect();
      const m = marca.getBoundingClientRect();
      const estilo = getComputedStyle(palabras);
      destino.style.fontSize = getComputedStyle(palabras.parentElement!).fontSize;
      const x = ul.left - f.left + parseFloat(estilo.paddingLeft) + 10;
      const y = m.top + m.height / 2 - f.top;
      destino.style.left = `${x}px`;
      destino.style.top = `${y}px`;
      const w = destino.offsetWidth;
      destino.style.setProperty("--sx", `${f.width / 2 - (x + w / 2)}px`);
      destino.style.setProperty("--sy", `${f.height / 2 - y}px`);
      // La orden que se teclea al final aparece exactamente donde quedará el
      // rótulo de Proyectos, que es esa misma orden.
      const rotulo = document.querySelector<HTMLElement>(".proy-rotulo");
      const seccionProy = rotulo?.closest("section");
      if (rotulo && seccionProy) {
        const r = rotulo.getBoundingClientRect();
        const s = seccionProy.getBoundingClientRect();
        raiz.style.setProperty("--ox", `${(r.left - s.left).toFixed(1)}px`);
        raiz.style.setProperty("--oy", `${(r.top - s.top).toFixed(1)}px`);
      }
      // Casilla de cada placa del primer grupo, respecto al centro de la
      // pantalla: ahí aterrizan las placas del túnel (ver Tunel.css).
      const reales = grupos[0]?.querySelectorAll<HTMLElement>(".herr-placa") ?? [];
      raiz.querySelectorAll<HTMLElement>(".tunel-aterriza").forEach((placa, i) => {
        const real = reales[i];
        if (!real) return;
        const r = real.getBoundingClientRect();
        placa.style.setProperty("--tx", `${r.left + r.width / 2 - (f.left + f.width / 2)}px`);
        placa.style.setProperty("--ty", `${r.top + r.height / 2 - (f.top + f.height / 2)}px`);
      });
    };
    // Succión: cada pieza de la sección guarda su vector hacia el centro de
    // la pantalla, para caer dentro del agujero. Se mide la primera vez que
    // el agujero entra en juego, cuando la lista ya está en su última
    // posición; al redimensionar se vuelve a medir.
    const PIEZAS =
      ".herr-cabecera, .herr-marca, .herr-riel, .herr-palabras li," +
      " .herr-grupo[data-estado='activo'] .herr-placa," +
      " .herr-grupo[data-estado='activo'] .herr-criterio > li," +
      " .herr-grupo[data-estado='activo'] .herr-consola";
    let medidas = false;
    // En el celular no cae pieza a pieza (cada casilla a su tiempo y con su
    // giro se veía desordenado): la cabecera y la rejilla se encogen enteras
    // hacia el centro, como una lámina que el agujero absorbe (`absorber`).
    let laminas: { el: HTMLElement; ax: number; ay: number; puesto: string }[] = [];
    const medirSuccion = () => {
      if (!fijo) return;
      const f = fijo.getBoundingClientRect();
      const cx = f.left + f.width / 2;
      const cy = f.top + f.height / 2;
      if (celular) {
        laminas = [".herr-cabecera", ".herr-bandeja"].flatMap((sel) => {
          const el = raiz.querySelector<HTMLElement>(sel);
          if (!el) return [];
          // Sin la transformación que lleve ya, o se mediría encogida.
          el.style.transform = "";
          const r = el.getBoundingClientRect();
          return [{ el, ax: cx - (r.left + r.width / 2), ay: cy - (r.top + r.height / 2), puesto: "" }];
        });
        medidas = true;
        return;
      }
      raiz.querySelectorAll<HTMLElement>(PIEZAS).forEach((el, i) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--ax", `${(cx - (r.left + r.width / 2)).toFixed(1)}px`);
        el.style.setProperty("--ay", `${(cy - (r.top + r.height / 2)).toFixed(1)}px`);
        // Giro alterno y arranque escalonado: caen en desorden, no a la vez.
        el.style.setProperty("--ag", `${(i % 2 ? 1 : -1) * (18 + (i % 3) * 14)}deg`);
        el.style.setProperty("--ar", ((i % 5) * 0.05).toFixed(2));
      });
      medidas = true;
    };
    const total = grupos.length;
    let activo = -1;
    let pendiente = false;
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // En el celular no hay túnel (ver telefono.ts): la sección entra
    // directamente con el lector. El agujero negro sí está, con sus
    // fotogramas del celular.
    const celular = esCelular();
    // Fase de las placas del primer grupo: «tunel» mientras vuelan, «aterrizado»
    // recién llegadas (relevo sin transición) y «lector» en cuanto se mueve
    // la lista; al volver a subir al túnel se reinicia.
    let fase = "";
    let movido = false;
    const ponerFase = (nueva: string) => {
      if (nueva === fase) return;
      fase = nueva;
      raiz.setAttribute("data-fase", nueva);
    };

    // Escribir una variable CSS invalida el estilo de todo lo que cuelga del
    // elemento, así que solo se escribe cuando el valor cambia de verdad, y
    // en los elementos que la usan (la raíz si no se dice otra cosa).
    const ultimos = new WeakMap<HTMLElement, Map<string, string>>();
    const poner = (nombre: string, valor: string, ...en: (HTMLElement | null)[]) => {
      for (const el of en.length ? en : [raiz]) {
        if (!el) continue;
        let previos = ultimos.get(el);
        if (!previos) ultimos.set(el, (previos = new Map()));
        if (previos.get(nombre) === valor) continue;
        previos.set(nombre, valor);
        el.style.setProperty(nombre, valor);
      }
    };

    const limitar = (v: number) => Math.min(1, Math.max(0, v));
    // Curva suave (arranca y frena despacio).
    const suave = (v: number) => v * v * (3 - 2 * v);
    // La lámina del celular: se encoge hacia el centro con una curva suave al
    // empezar y al acabar, y se apaga en la segunda mitad, ya dentro del
    // negro. Desplazar cada una k veces su vector al centro y escalarla por
    // 1 − k es encoger todo el conjunto a la vez, sin que se separen. Se
    // escribe directamente su transform: son dos elementos, y así no hay
    // variables que recalcular en los de dentro.
    const absorber = (traga: number) => {
      const u = limitar(traga / 0.72);
      const k = 0.8 * suave(u);
      const opacidad = 1 - limitar((u - 0.4) / 0.45);
      for (const l of laminas) {
        const transform =
          k > 0
            ? `translate3d(${(l.ax * k).toFixed(1)}px, ${(l.ay * k).toFixed(1)}px, 0) scale(${(1 - k).toFixed(4)})`
            : "";
        const puesto = `${transform}|${opacidad.toFixed(3)}`;
        if (puesto === l.puesto) continue;
        l.puesto = puesto;
        l.el.style.transform = transform;
        l.el.style.opacity = k > 0 ? opacidad.toFixed(3) : "";
      }
    };

    // --- Animaciones que se reproducen solas ---------------------------------
    // El corte y el agujero son largos: en vez de avanzar a tirones según
    // cuánto se arrastre, en cuanto se pide bajar se reproducen enteros. Solo
    // se disparan con un gesto normal (un salto grande —un enlace, una
    // prueba— no cuenta) y una vez por pasada.
    const reducidoMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
    let ultimoY = window.scrollY;
    // La posición leída al empezar `pintar`, antes de escribir nada: leer
    // `scrollY` después de escribir estilos obliga a recalcularlos al
    // momento, y aquí se leía al final de cada fotograma.
    let yAhora = ultimoY;
    // Cada tramo recuerda con qué gesto se lanzó, no si se lanzó ya. Si el
    // lector se echa atrás y el deslizamiento se corta, el siguiente gesto
    // hacia abajo es otro y el tramo se vuelve a lanzar; antes, un intento
    // cortado dejaba el resto de la pasada a tirones.
    let gestoTunel = 0;
    let gestoCorte = 0;
    let gestoAgujero = 0;
    // Solo cuenta como «quiero bajar» un gesto de verdad: rueda, dedo o
    // tecla. Un salto programático (un enlace, volver atrás) no dispara nada.
    // La ventana es ancha porque el dedo suelta y la página sigue por
    // inercia: el tramo puede empezar bastante después del último toque.
    let ultimoGesto = -1e9;
    const marcarGesto = () => {
      ultimoGesto = performance.now();
    };
    // Solo hacia abajo. Si la rueda hacia arriba contara, echarse atrás
    // cortaría el deslizamiento y, en cuanto la página se parase, ese mismo
    // gesto lo volvería a lanzar hacia abajo.
    const alRodar = (ev: WheelEvent) => {
      if (ev.deltaY > 0) marcarGesto();
    };
    const alTeclado = (ev: KeyboardEvent) => {
      if (["ArrowDown", "PageDown", "Down", " ", "Spacebar"].includes(ev.key))
        marcarGesto();
    };
    // El dedo: si está puesto y hacia dónde arrastró por última vez.
    let dedoPuesto = false;
    let dedoY = 0;
    let dedoBaja = false;
    const alTocar = (ev: TouchEvent) => {
      dedoPuesto = true;
      dedoY = ev.touches?.[0]?.clientY ?? dedoY;
    };
    const alArrastrar = (ev: TouchEvent) => {
      const y = ev.touches?.[0]?.clientY ?? dedoY;
      // El dedo sube: la página baja.
      if (y !== dedoY) dedoBaja = y < dedoY;
      dedoY = y;
      marcarGesto();
    };
    // Al soltar se mira si hay que lanzar algo, aunque la página no se mueva.
    const alSoltar = () => {
      dedoPuesto = false;
      alScroll();
    };
    window.addEventListener("wheel", alRodar, { passive: true });
    window.addEventListener("touchstart", alTocar, { passive: true });
    window.addEventListener("touchmove", alArrastrar, { passive: true });
    window.addEventListener("touchend", alSoltar, { passive: true });
    window.addEventListener("touchcancel", alSoltar, { passive: true });
    window.addEventListener("keydown", alTeclado);
    // En pantallas táctiles, casi nunca: el dedo ya lleva la página, y que
    // siguiera bajando sola después de soltarlo confundía. Salvo el agujero
    // negro (`tactilVale`): seguido con el dedo se veía a tirones, y se
    // entiende mejor entero. Ahí se lanza al soltar, si el último arrastre
    // era hacia abajo; mientras el dedo está puesto, manda él, y volver a
    // tocar la pantalla lo corta (ver deslizarHasta).
    const tactil = window.matchMedia("(pointer: coarse)");
    const lanzar = (hasta: number, ms: number, usado: number, tactilVale = false) => {
      if (reducidoMedia.matches || deslizando()) return usado;
      if (tactil.matches) {
        if (!tactilVale || dedoPuesto || !dedoBaja) return usado;
        if (ultimoGesto === usado || performance.now() - ultimoGesto > 1200) return usado;
        return deslizarHasta(hasta, ms) ? ultimoGesto : usado;
      }
      // Un gesto, un lanzamiento: con el trackpad llegan decenas de eventos
      // de rueda por cada empujón.
      if (ultimoGesto === usado) return usado;
      if (performance.now() - ultimoGesto > 1200) return usado;
      // La página tiene que estar bajando de verdad: quieta o subiendo, no.
      const salto = yAhora - ultimoY;
      if (salto <= 0 || salto > window.innerHeight * 0.5) return usado;
      return deslizarHasta(hasta, ms) ? ultimoGesto : usado;
    };

    // --- El agujero negro: secuencia de fotogramas, como la portada -------
    const ctx = lienzo?.getContext("2d") ?? null;
    let pintadoAgujero = -1;
    let pedido = 0;
    // Las medidas del lienzo, guardadas: leerlas en cada fotograma, justo
    // después de escribir las variables del scroll, obligaba a recalcular el
    // estilo a mitad del fotograma. Se vuelven a tomar al redimensionar.
    let dimsLienzo: { ancho: number; alto: number; fijo: number } | null = null;
    const pintarAgujero = (quiero: number) => {
      const img = secuencia.mejor(quiero);
      if (!img || !lienzo || !ctx) return;
      dimsLienzo ??= {
        ancho: lienzo.clientWidth,
        alto: lienzo.clientHeight,
        fijo: fijo?.clientHeight || lienzo.clientHeight,
      };
      const { ancho, alto } = dimsLienzo;
      // Sin más resolución que la del fotograma (ver Retrato.tsx).
      const cubreCaja = Math.max(ancho / 1280, alto / 720);
      const dpr = Math.min(window.devicePixelRatio || 1, Math.max(1, 1 / cubreCaja));
      const w = Math.round(ancho * dpr);
      const h = Math.round(alto * dpr);
      if (lienzo.width !== w || lienzo.height !== h) {
        lienzo.width = w;
        lienzo.height = h;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Como object-fit: cover: el agujero nace en el centro de la pantalla
      // y acaba cubriéndola entera. El lienzo puede ser más alto que la
      // pantalla fija (ver el CSS): el centro es el de ella, que es adonde
      // cae el contenido, y la imagen cubre también lo que sobra por debajo.
      const iw = img.width;
      const ih = img.height;
      const cy = Math.min(alto, dimsLienzo.fijo) / 2;
      const escala = Math.max(ancho / iw, (2 * Math.max(cy, alto - cy)) / ih);
      const dw = iw * escala;
      const dh = ih * escala;
      ctx.drawImage(img, (ancho - dw) / 2, cy - dh / 2, dw, dh);
      pintadoAgujero = quiero;
    };
    // En el celular en vertical, el juego de fotogramas del celular (el
    // centro de cada uno, a 360 × 640; ver scripts/agujero-movil.mjs), y
    // entero: 52 ligeros caben en memoria y se tienen todos antes de llegar,
    // así el agujero no se traba esperando a ninguno.
    const agujeroMovil = celular && window.innerWidth < window.innerHeight;
    const secuencia = new SecuenciaFotogramas(
      FOTOGRAMAS,
      (i) => `${agujeroMovil ? AGUJERO_MOVIL : AGUJERO}f${String(i).padStart(3, "0")}.jpg`,
      (i) => {
        if (pintadoAgujero < 0 || Math.abs(i - pedido) <= 2) pintarAgujero(pedido);
      },
      8,
      agujeroMovil ? undefined : (i) => `${AGUJERO_MINI}f${String(i).padStart(3, "0")}.jpg`,
      agujeroMovil ? FOTOGRAMAS : undefined,
    );
    // --- El corte entre lo técnico y el criterio -------------------------
    // Un barrido que deja la pantalla en negro y la devuelve a blanco: marca
    // que lo que sigue es de otra naturaleza. Ocurre en el tramo en que el
    // lector pasa de la penúltima categoría a la última.
    const ctxCorte = lienzoCorte?.getContext("2d") ?? null;
    let pintadoCorte = -1;
    let pedidoCorte = 0;
    let dimsCorte: [number, number] | null = null;
    const pintarCorte = (quiero: number) => {
      const img = secuenciaCorte.mejor(quiero);
      if (!img || !lienzoCorte || !ctxCorte) return;
      // Su tamaño, guardado, como el de las líneas del túnel.
      dimsCorte ??= [lienzoCorte.clientWidth, lienzoCorte.clientHeight];
      const [ancho, alto] = dimsCorte;
      if (!ancho || !alto) dimsCorte = null;
      const cubreCaja = Math.max(ancho / 1280, alto / 720);
      const dpr = Math.min(window.devicePixelRatio || 1, Math.max(1, 1 / cubreCaja));
      const w = Math.round(ancho * dpr);
      const h = Math.round(alto * dpr);
      if (lienzoCorte.width !== w || lienzoCorte.height !== h) {
        lienzoCorte.width = w;
        lienzoCorte.height = h;
      }
      ctxCorte.setTransform(dpr, 0, 0, dpr, 0, 0);
      const escala = Math.max(ancho / img.width, alto / img.height);
      const dw = img.width * escala;
      const dh = img.height * escala;
      ctxCorte.drawImage(img, (ancho - dw) / 2, (alto - dh) / 2, dw, dh);
      pintadoCorte = quiero;
    };
    const secuenciaCorte = new SecuenciaFotogramas(
      CORTES,
      (i) => `${CORTE}f${String(i).padStart(3, "0")}.jpg`,
      (i) => {
        if (pintadoCorte < 0 || Math.abs(i - pedidoCorte) <= 2) pintarCorte(pedidoCorte);
      },
      6,
      (i) => `${CORTE_MINI}f${String(i).padStart(3, "0")}.jpg`,
    );
    const vigiaCorte = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        vigiaCorte.disconnect();
        // Sin tramo para el corte (en pantallas táctiles, o con movimiento
        // reducido) no hay nada que descargar.
        if ((sondaCorte?.offsetHeight ?? 0) >= 1) secuenciaCorte.empezar();
      },
      { rootMargin: "0px" },
    );
    vigiaCorte.observe(raiz);

    // Se empieza a cargar cuando el lector va por la mitad: no compite con el
    // túnel ni con la portada.
    const vigiaAgujero = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        vigiaAgujero.disconnect();
        // Sin tramo para el agujero (movimiento reducido), nada que descargar.
        if ((sondaAgujero?.offsetHeight ?? 0) >= 1) secuencia.empezar();
      },
      // En el celular con más antelación: los 52 tienen que estar listos
      // cuando se llega, y la red del teléfono tarda más.
      { rootMargin: celular ? "0px 0px 300% 0px" : "0px 0px 100% 0px" },
    );
    if (sondaAgujero) vigiaAgujero.observe(sondaAgujero);

    // --- La estructura del túnel -------------------------------------------
    // Marcos achaflanados, como las placas, repartidos a lo largo del túnel:
    // al avanzar la cámara se acercan, crecen, giran un poco y pasan por los
    // lados. Son los que dan la profundidad: sin ellos, las placas lejanas
    // eran motas sobre blanco y no se leía que aquello fuera un túnel. Un
    // solo lienzo y una veintena de trazos por fotograma; misma perspectiva
    // y mismo recorrido que las placas (Tunel.css), para que avancen juntos.
    const lineas = raiz.querySelector<HTMLCanvasElement>(".tunel-lineas");
    const ctxLineas = lineas?.getContext("2d") ?? null;
    let lineasPintadas = "";
    let dimsLineas: [number, number] | null = null;
    const PERSPECTIVA = 700;
    const VIAJE = 4600;
    const pintarLineas = (pt: number, vel: number) => {
      if (!lineas || !ctxLineas) return;
      const clave = `${pt.toFixed(4)}|${vel.toFixed(2)}`;
      if (clave === lineasPintadas) return;
      lineasPintadas = clave;
      // Su tamaño, guardado (ver `tomarMedidas`): leerlo aquí, después de
      // escribir las variables del túnel, recalculaba el estilo en cada
      // fotograma. Oculto mide 0 y no se guarda.
      dimsLineas ??= [lineas.clientWidth, lineas.clientHeight];
      const [ancho, alto] = dimsLineas;
      if (!ancho || !alto) {
        dimsLineas = null;
        return;
      }
      // En el teléfono, a densidad 1: son líneas finas y tenues, y a doble
      // densidad subir el lienzo a la GPU en cada fotograma costaba más que
      // el resto del túnel en uno de gama media.
      const dpr = tactil.matches ? 1 : Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(ancho * dpr);
      const h = Math.round(alto * dpr);
      if (lineas.width !== w || lineas.height !== h) {
        lineas.width = w;
        lineas.height = h;
      }
      const c = ctxLineas;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, ancho, alto);
      // Aparece al entrar y se va mientras «LENGUAJES» se asienta.
      const presencia = limitar(pt / 0.06) * limitar((0.9 - pt) / 0.14);
      if (presencia <= 0) return;
      for (let k = 0; k < 20; k++) {
        const z = -k * 420 + pt * VIAJE;
        if (z < -3600 || z > PERSPECTIVA * 0.86) continue;
        const escala = PERSPECTIVA / (PERSPECTIVA - z);
        const a =
          limitar((z + 3600) / 1900) *
          limitar((PERSPECTIVA * 0.86 - z) / 240) *
          presencia *
          (0.75 + vel * 0.5);
        if (a < 0.01) continue;
        const mw = ancho * 0.52 * escala;
        const mh = alto * 0.52 * escala;
        const chaflan = Math.min(mw, mh) * 0.14;
        c.save();
        c.translate(ancho / 2, alto / 2);
        c.rotate(k * 0.085 + pt * 0.5);
        c.beginPath();
        c.moveTo(-mw, -mh);
        c.lineTo(mw - chaflan, -mh);
        c.lineTo(mw, -mh + chaflan);
        c.lineTo(mw, mh);
        c.lineTo(-mw + chaflan, mh);
        c.lineTo(-mw, mh - chaflan);
        c.closePath();
        c.lineWidth = Math.min(3, 0.6 + escala * 0.9);
        // Uno de cada cuatro en lima: marca el ritmo del avance.
        c.strokeStyle =
          k % 4 === 0
            ? `rgba(140, 194, 26, ${Math.min(1, a * 0.95).toFixed(3)})`
            : `rgba(23, 24, 21, ${(a * 0.28).toFixed(3)})`;
        c.stroke();
        c.restore();
      }
    };

    // Velocidad del túnel (0 a 1): sube de golpe al bajar rápido y se
    // apaga sola en unos cientos de ms cuando el scroll se detiene.
    let vel = 0;
    let ultimoPt = 0;
    let ultimoT = performance.now();
    let rafVel = 0;
    // El apagado no escribe --vel por su cuenta: lo deja en manos de pintar,
    // que primero lee (getBoundingClientRect) y luego escribe todo de una
    // vez. Escribir antes de esa lectura obligaba a recalcular estilos dos
    // veces por fotograma. Si ya hay un pintado en cola, ese lo escribirá.
    const apagarVel = () => {
      vel *= 0.88;
      if (vel < 0.01) {
        vel = 0;
        rafVel = 0;
      } else rafVel = requestAnimationFrame(apagarVel);
      if (!pendiente) pintar();
    };
    // Dónde queda en la página el reposo de cada categoría: el mismo cálculo
    // que hace `pintar` al revés. El del criterio va detrás del corte.
    const destinoDe = (i: number) => {
      const alto = window.innerHeight;
      const tunel = sonda?.offsetTop ?? 0;
      const cola = sonda?.offsetHeight ?? 0;
      const agujero = sondaAgujero?.offsetHeight ?? 0;
      const largo = raiz.offsetHeight - alto - tunel - cola - agujero;
      const anchoCorte = sondaCorte?.offsetHeight ?? 0;
      const largoLector = Math.max(1, largo - anchoCorte);
      const avance =
        PAUSA_INICIO + (i / (total - 1)) * (1 - PAUSA_INICIO - PAUSA_FINAL);
      let s = avance * largoLector;
      if (i === total - 1 && anchoCorte >= 1) s += anchoCorte;
      return raiz.offsetTop + tunel + s;
    };
    // Lo último que pintó `pintar`: para saber si el lector está a medias.
    let ultimoP = 0;
    let ultimoCorte = 0;
    let ultimaTraga = 0;
    irA.current = (i: number) => {
      const pasos = Math.abs(i - ultimoP);
      irSuave(destinoDe(i), Math.min(1400, 450 + 160 * pasos));
    };

    // Las medidas de la sección, guardadas. Leer su caja y sus sondas en cada
    // fotograma obligaba a recalcular a mitad del fotograma los estilos que
    // otra sección acababa de escribir (la portada, mientras entra el
    // túnel). Solo cambian si cambia el tamaño: se vuelven a tomar al
    // redimensionar.
    let med = { vista: 0, inicio: 0, altoSeccion: 0, tunel: 0, cola: 0, agujero: 0, anchoCorte: 0 };
    const tomarMedidas = () => {
      med = {
        // Arriba de la sección en la página: para la caja en pantalla…
        vista: raiz.getBoundingClientRect().top + window.scrollY,
        // …y para los destinos de los deslizamientos, como antes.
        inicio: raiz.offsetTop,
        altoSeccion: raiz.offsetHeight,
        tunel: sonda?.offsetTop ?? 0,
        cola: sonda?.offsetHeight ?? 0,
        agujero: sondaAgujero?.offsetHeight ?? 0,
        anchoCorte: sondaCorte?.offsetHeight ?? 0,
      };
    };
    tomarMedidas();
    const pintar = () => {
      pendiente = false;
      yAhora = window.scrollY;
      const arriba = med.vista - yAhora;
      const caja = { top: arriba, bottom: arriba + med.altoSeccion, height: med.altoSeccion };
      const alto = window.innerHeight;
      // Primero el túnel: arranca en cuanto la sección asoma por abajo y
      // termina tras recorrer su tramo fijo (--tunel). La sonda también mide
      // la cola (--cola): la última pantalla, que Proyectos cubre al llegar.
      // Cubierta: de 0 cuando Proyectos asoma por abajo a 1 cuando tapa la
      // pantalla; la sección se hunde un poco y se oscurece por debajo.
      const { tunel, cola, agujero, anchoCorte, inicio } = med;
      const cubre = limitar((alto + cola - caja.bottom) / Math.max(1, cola));
      poner("--cubre", cubre.toFixed(4), final);
      const pt = limitar((alto - caja.top) / (alto + tunel));
      poner("--pt", pt.toFixed(4), tunelCapa, destino);
      const ahora = performance.now();
      const dt = Math.max(16, ahora - ultimoT);
      // Solo cuenta mientras el túnel está en juego.
      if (pt > 0 && pt < 1) {
        const inst = (Math.abs(pt - ultimoPt) / dt) * 1000; // túneles por segundo
        vel = Math.max(vel, limitar(inst / 0.9));
        if (!rafVel) rafVel = requestAnimationFrame(apagarVel);
      }
      poner("--vel", vel.toFixed(3), tunelCapa);
      if (pt > 0 && pt < 1) pintarLineas(pt, vel);
      // El túnel es el tramo más largo de todos: en cuanto se pide bajar se
      // recorre entero solo.
      if (pt > 0.02 && pt < 0.9) {
        gestoTunel = lanzar(inicio + tunel, DURACION_TUNEL, gestoTunel);
      } else if (pt <= 0.02) gestoTunel = 0;
      ultimoPt = pt;
      ultimoT = ahora;
      // Al fondo del túnel, «LENGUAJES» crece desde el punto de fuga y se
      // desliza a su sitio; entonces aparece el resto de la sección.
      poner("--acerca", limitar((pt - 0.42) / 0.4).toFixed(4), destino);
      poner("--asienta", suave(limitar((pt - 0.8) / 0.12)).toFixed(4), destino);
      poner("--llegada", suave(limitar((pt - 0.9) / 0.08)).toFixed(4));
      // Después, el lector recorre las categorías con el resto del scroll,
      // menos el tramo que se reserva para el corte: así el corte no comparte
      // sitio con el paso de una categoría a otra y no se puede pasar de
      // largo por bajar deprisa.
      const largo = caja.height - alto - tunel - cola - agujero;
      const largoLector = Math.max(1, largo - anchoCorte);
      const s = -caja.top - tunel;
      // Dónde queda el lector al llegar a la penúltima categoría: ahí se
      // abre el hueco del corte.
      const avanceCorte =
        PAUSA_INICIO +
        ((total - 2) / (total - 1)) * (1 - PAUSA_INICIO - PAUSA_FINAL);
      const sCorte = avanceCorte * largoLector;
      // Lo que avanza el lector de una categoría a la siguiente.
      const paso = (largoLector * (1 - PAUSA_INICIO - PAUSA_FINAL)) / (total - 1);
      // Sin corte (en el teléfono no hay barrido, y con movimiento reducido
      // tampoco), el criterio llega como una categoría más: a mitad del paso
      // desde la penúltima, como cambian todas. Antes saltaba al llegar a la
      // penúltima y «Control de versiones» no se llegaba a ver.
      const sinCorte = anchoCorte < 1;
      let avance: number;
      let corte: number;
      if (sinCorte) {
        avance = limitar(s / largoLector);
        corte = s >= sCorte + paso / 2 ? 1 : 0;
      } else if (s < sCorte) {
        avance = limitar(s / largoLector);
        corte = 0;
      } else if (s < sCorte + anchoCorte) {
        avance = avanceCorte;
        corte = anchoCorte > 0 ? limitar((s - sCorte) / anchoCorte) : 1;
      } else {
        avance = limitar((s - anchoCorte) / largoLector);
        corte = 1;
      }
      const tramo = Math.min(
        1,
        Math.max(0, (avance - PAUSA_INICIO) / (1 - PAUSA_INICIO - PAUSA_FINAL)),
      );
      const p = conReposo(tramo * (total - 1));
      poner("--p", p.toFixed(4), lector, riel);
      // La entrada del criterio: las casillas aparecen a su turno (se funden
      // y suben un poco), en el tramo que queda entre el corte y el agujero.
      // Empieza justo cuando el corte termina: mientras dura, su luz tapa la
      // pantalla y la primera fila aparecía sin que se viera.
      const sArmaIni = sinCorte ? sCorte + paso / 2 : sCorte + anchoCorte;
      const trasCorte = Math.max(1, largoLector - sCorte);
      // Sin corte (teléfono) termina justo al asentarse el criterio: si no,
      // al ir a «Cómo trabajo» las casillas llegaban a medio armar.
      const sArmaFin = sinCorte ? sCorte + paso : sArmaIni + trasCorte * 0.62;
      const arma = limitar((s - sArmaIni) / Math.max(1, sArmaFin - sArmaIni));
      poner("--arma", arma.toFixed(4), rejillaCriterio);
      // Al asomar, se reproduce solo hasta el final de su tramo.
      if (corte > 0.002 && corte < 0.9) {
        gestoCorte = lanzar(
          inicio + tunel + sArmaFin,
          DURACION_CORTE,
          gestoCorte,
        );
      } else if (corte <= 0.002) gestoCorte = 0;
      poner("--corte", corte.toFixed(4), lienzoCorte);
      // El criterio es el capítulo de después del corte.
      raiz.toggleAttribute("data-criterio", corte > 0.5);
      const cuadroCorte = Math.round(corte * (CORTES - 1));
      if (cuadroCorte !== pedidoCorte) {
        pedidoCorte = cuadroCorte;
        secuenciaCorte.pedir(pedidoCorte);
      }
      // Solo se repinta si el fotograma cambia: dibujar el mismo en cada
      // fotograma de scroll cuesta y no se ve.
      if (corte > 0 && corte < 1 && pedidoCorte !== pintadoCorte)
        pintarCorte(pedidoCorte);
      // Tras el lector, una pantalla más (--agujero) en la que un agujero
      // negro se traga la sección: el contenido cae hacia el centro y la
      // secuencia avanza hasta el negro, que ya es el fondo de Proyectos.
      const traga = limitar((-caja.top - tunel - largo) / Math.max(1, agujero));
      if (traga > 0 && !medidas) medirSuccion();
      if (traga > 0.002 && traga < 0.9) {
        // Hasta el final de la cola, con los proyectos ya en su sitio: si se
        // parara al cerrarse el agujero, dejaría la pantalla en negro.
        gestoAgujero = lanzar(
          inicio + tunel + largo + agujero + cola,
          DURACION_AGUJERO,
          gestoAgujero,
          true,
        );
      } else if (traga <= 0.002) gestoAgujero = 0;
      // En el celular, --traga solo en el lienzo y la orden del final: las
      // piezas no la usan (ver `absorber`), y en la raíz obligaba a
      // recalcular la sección entera en cada fotograma del agujero.
      if (celular) {
        poner("--traga", traga.toFixed(4), lienzo, final);
        absorber(traga);
      } else poner("--traga", traga.toFixed(4));
      raiz.toggleAttribute("data-traga", traga > 0);
      const cuadro = Math.round(traga * (FOTOGRAMAS - 1));
      if (cuadro !== pedido) {
        pedido = cuadro;
        secuencia.pedir(pedido);
      }
      if (traga > 0 && pedido !== pintadoAgujero) pintarAgujero(pedido);
      ultimoY = yAhora;
      ultimoP = p;
      ultimoCorte = corte;
      ultimaTraga = traga;
      // Durante el corte el lector se queda en la penúltima categoría, pero
      // lo que hay detrás ya tiene que ser el criterio: si no, al aclararse
      // el barrido se ven todavía las placas de la anterior.
      const nuevo = corte > 0.5 ? total - 1 : Math.round(p);
      if (nuevo > 0) movido = true;
      if (pt < 1) movido = false;
      ponerFase(
        reducido || celular ? "lector" : pt < 1 ? "tunel" : movido ? "lector" : "aterrizado",
      );
      if (nuevo === activo) return;
      activo = nuevo;
      grupos.forEach((g, i) =>
        g.setAttribute(
          "data-estado",
          i < activo ? "antes" : i > activo ? "despues" : "activo",
        ),
      );
      botones.forEach((b, i) =>
        i === activo ? b.setAttribute("aria-current", "true") : b.removeAttribute("aria-current"),
      );

    };
    // --- Asentar el lector ---------------------------------------------------
    // Cada categoría pide un tramo de scroll, y quien se paraba a medias veía
    // dos palabras encendidas a medias y las placas de las dos cruzándose. En
    // escritorio, al dejar de hacer scroll entre dos, la página se desliza a
    // la más cercana (hacia la que se iba, si ya se había pasado de un
    // tercio). Sin cerrojo: la rueda manda en cuanto se mueve. En el teléfono
    // no, que el dedo ya lleva la página y moverla sola confunde.
    const fino = window.matchMedia("(hover: hover) and (pointer: fine)");
    let relojAsentar = 0;
    let yPrevio = window.scrollY;
    let direccion = 1;
    const asentar = () => {
      if (!fino.matches || reducidoMedia.matches || deslizando()) return;
      // Solo en el lector: ni en el túnel, ni en el corte, ni en el agujero.
      if (ultimoPt < 1 || ultimaTraga > 0 || (ultimoCorte > 0 && ultimoCorte < 1)) return;
      const base = Math.floor(ultimoP);
      const fraccion = ultimoP - base;
      if (fraccion < 0.01 || fraccion > 0.99) return;
      let i = fraccion > (direccion > 0 ? 0.35 : 0.65) ? base + 1 : base;
      // Pasado el corte ya se está en el criterio: volver atrás lo repetiría.
      if (ultimoCorte >= 1 && (sondaCorte?.offsetHeight ?? 0) >= 1) i = total - 1;
      irSuave(destinoDe(i), 420);
    };

    // Solo se mide con la sección a la vista (ver cercania.ts).
    let cerca = true;
    const alScroll = () => {
      const y = window.scrollY;
      if (y !== yPrevio) direccion = y > yPrevio ? 1 : -1;
      yPrevio = y;
      window.clearTimeout(relojAsentar);
      if (cerca && fino.matches && !reducidoMedia.matches)
        relojAsentar = window.setTimeout(asentar, 200);
      if (pendiente || !cerca) return;
      pendiente = true;
      requestAnimationFrame(pintar);
    };
    let anchoPrevio = window.innerWidth;
    const alRedimensionar = () => {
      // En el celular, la barra del navegador aparece y se esconde al bajar y
      // cambia el alto de la ventana; nada de lo que se mide depende de eso
      // (va en svh), y volver a medirlo a mitad del agujero daba un tirón.
      if (celular && window.innerWidth === anchoPrevio) {
        alScroll();
        return;
      }
      anchoPrevio = window.innerWidth;
      tomarMedidas();
      dimsLienzo = null;
      dimsLineas = null;
      dimsCorte = null;
      lineasPintadas = "";
      colocarDestino();
      medidas = false;
      alScroll();
    };
    colocarDestino();
    document.fonts?.ready.then(() => {
      tomarMedidas();
      colocarDestino();
    });
    // Y si cambia el alto de la sección (sus tramos van en svh).
    const vigiaTamano = new ResizeObserver(() => {
      tomarMedidas();
      alScroll();
    });
    vigiaTamano.observe(raiz);
    pintar();
    const dejarDeVigilar = vigilarCercania(raiz, (c) => {
      cerca = c;
      // Lejos, sus cursores dejan de parpadear (ver Herramientas.css).
      raiz.toggleAttribute("data-lejos", !c);
      pintar();
      // Lejos, sus fotogramas sobran en memoria (ver secuencia.ts).
      if (!c) {
        secuencia.soltar();
        secuenciaCorte.soltar();
      }
    });
    window.addEventListener("scroll", alScroll, { passive: true });
    window.addEventListener("resize", alRedimensionar);
    return () => {
      window.removeEventListener("wheel", alRodar);
      window.removeEventListener("touchstart", alTocar);
      window.removeEventListener("touchmove", alArrastrar);
      window.removeEventListener("touchend", alSoltar);
      window.removeEventListener("touchcancel", alSoltar);
      window.removeEventListener("keydown", alTeclado);
      dejarDeVigilar();
      vigiaTamano.disconnect();
      vigiaAgujero.disconnect();
      vigiaCorte.disconnect();
      secuencia.detener();
      secuenciaCorte.detener();
      cancelAnimationFrame(rafVel);
      window.removeEventListener("scroll", alScroll);
      window.removeEventListener("resize", alRedimensionar);
      window.clearTimeout(relojAsentar);
    };
  }, []);

  return (
    <section
      ref={seccion}
      className="herramientas"
      id="herramientas"
      aria-labelledby="titulo-herramientas"
      style={{ "--n": stack.length } as CSSProperties}
    >
      <span className="herr-sonda" aria-hidden="true" />
      <span className="herr-sonda-corte" aria-hidden="true" />
      <span className="herr-sonda-agujero" aria-hidden="true" />
      <div className="herr-fijo">
        <Tunel />
        {/* El agujero negro crece detrás del contenido, que cae dentro. */}
        <canvas className="herr-agujero" aria-hidden="true" />
        {/* El corte entre lo técnico y el criterio, por delante de todo. */}
        <canvas className="herr-corte" aria-hidden="true" />
        <span className="herr-destino" aria-hidden="true">
          {di(stack[0].palabra ?? stack[0].titulo)}
        </span>
        {/* El criterio es otro capítulo: al pasar el corte, la cabecera
            cambia de nombre. El cambio ocurre con la pantalla en negro, así
            que no se ve el relevo. */}
        <header className="herr-cabecera">
          <p className="herr-rotulo">
            <span className="herr-r1">{di(textos.herramientasRotulo)}</span>
            <span className="herr-r2" aria-hidden="true">
              {di(textos.criterioRotulo)}
            </span>
          </p>
          <h2 id="titulo-herramientas">
            <span className="herr-r1">{di(textos.herramientasTitulo)}</span>
            <span className="herr-r2" aria-hidden="true">
              {di(textos.criterioTitulo)}
            </span>
          </h2>
        </header>

        {/* Decorativa: los nombres reales están en los h3 de cada grupo. */}
        {/* El lector también es el índice: cada palabra lleva a su categoría. */}
        <nav className="herr-lector" aria-label={di(textos.categorias)}>
          <span className="herr-marca" aria-hidden="true" />
          <ul className="herr-palabras">
            {stack.map((grupo, i) => (
              <li
                key={grupo.id}
                style={{ "--i": i } as CSSProperties}
                data-texto={di(grupo.palabra ?? grupo.titulo)}
              >
                <button
                  type="button"
                  className="herr-ir"
                  aria-current={i === 0 ? "true" : undefined}
                  onClick={() => irA.current(i)}
                >
                  {di(grupo.palabra ?? grupo.titulo)}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="herr-bandeja">
          {stack.map((grupo, g) => (
            <div
              className="herr-grupo"
              key={grupo.id}
              data-estado={g === 0 ? "activo" : "despues"}
            >
              <h3 className="herr-titulo">{di(grupo.titulo)}</h3>
              {/* El criterio no son herramientas: en vez de placas, un
                  circuito que sale de un bus común. */}
              {grupo.criterio ? (
                <ul className="herr-criterio">
                  {grupo.criterio.map((c, i) => (
                    <li
                      key={c.id}
                      style={
                        {
                          // Su turno en la entrada (ver .herr-criterio > li).
                          "--i": i,
                        } as CSSProperties
                      }
                    >
                      <span className="herr-indice" aria-hidden="true">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {/* El hueco entre el número y la palabra: un esquema
                          que enseña la habilidad y se dibuja al aparecer. */}
                      <Glifo id={c.id} />
                      <h4>{di(c.titulo)}</h4>
                      <p>{di(c.texto)}</p>
                      <span className="herr-filo" aria-hidden="true" />
                    </li>
                  ))}
                </ul>
              ) : (
              <ul>
                {grupo.items.map((item, i) => (
                  <li
                    key={item}
                    className="herr-placa"
                    style={
                      {
                        "--i": i,
                        "--logo": iconos[item]
                          ? `url("${ICONOS}${iconos[item]}.svg")`
                          : "none",
                      } as CSSProperties
                    }
                  >
                    {iconos[item] && (
                      <span className="herr-logo" aria-hidden="true" />
                    )}
                    {item}
                  </li>
                ))}
              </ul>
              )}
              {/* Consola: la orden se teclea al activarse la categoría. */}
              <div className="herr-consola" aria-hidden="true">
                {grupo.consola.map((par, l) => {
                  const linea = di(par);
                  return (
                    <p
                      key={l}
                      className={l === 0 ? "herr-orden" : "herr-salida"}
                      style={{ "--largo": [...linea].length } as CSSProperties}
                    >
                      <span>{linea}</span>
                    </p>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Riel de progreso: una muesca por categoría. */}
        <div className="herr-riel" aria-hidden="true">
          {stack.map((grupo, i) => (
            <span key={grupo.id} style={{ "--i": i } as CSSProperties} />
          ))}
        </div>
      </div>
      {/* Sobre el negro ya total, la orden, donde irá el rótulo de Proyectos. */}
      <div className="herr-final" aria-hidden="true">
        <p className="herr-final-orden">
          <span className="herr-prompt">~ $</span>
          <span className="herr-final-tecleo">{di(textos.ordenProyectos)}</span>
        </p>
      </div>
    </section>
  );
}
