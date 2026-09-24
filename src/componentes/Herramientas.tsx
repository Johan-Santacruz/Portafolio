import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { iconos, stack } from "../datos/stack";
import { useIdioma } from "../idioma/idioma";
import { textos } from "../idioma/textos";
import { vigilarCercania } from "../retrato/cercania";
import { deslizando, deslizarHasta } from "../retrato/suave";
import { SecuenciaFotogramas } from "../retrato/secuencia";
import { Tunel } from "./Tunel";
import { Glifo } from "./Glifo";
import "./Herramientas.css";

const ICONOS = `${import.meta.env.BASE_URL}iconos/`;
/** Fotogramas del agujero negro (de `video6.mp4`, con el blanco y el negro
 *  llevados a los de la página). Ver README, «Movimiento». */
const AGUJERO = `${import.meta.env.BASE_URL}imagenes/agujero/`;
const AGUJERO_MINI = `${import.meta.env.BASE_URL}imagenes/agujero-mini/`;
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
const DURACION_AGUJERO = 1200;

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

  useEffect(() => {
    const raiz = seccion.current;
    if (!raiz) return;
    const grupos = Array.from(raiz.querySelectorAll<HTMLElement>(".herr-grupo"));
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
    const medirSuccion = () => {
      if (!fijo) return;
      const f = fijo.getBoundingClientRect();
      const cx = f.left + f.width / 2;
      const cy = f.top + f.height / 2;
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

    // Escribir una variable CSS invalida el estilo de toda la sección, así
    // que solo se escribe cuando el valor cambia de verdad.
    const ultimos = new Map<string, string>();
    const poner = (nombre: string, valor: string) => {
      if (ultimos.get(nombre) === valor) return;
      ultimos.set(nombre, valor);
      raiz.style.setProperty(nombre, valor);
    };

    const limitar = (v: number) => Math.min(1, Math.max(0, v));
    // Curva suave (arranca y frena despacio).
    const suave = (v: number) => v * v * (3 - 2 * v);

    // --- Animaciones que se reproducen solas ---------------------------------
    // El corte y el agujero son largos: en vez de avanzar a tirones según
    // cuánto se arrastre, en cuanto se pide bajar se reproducen enteros. Solo
    // se disparan con un gesto normal (un salto grande —un enlace, una
    // prueba— no cuenta) y una vez por pasada.
    const reducidoMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
    let ultimoY = window.scrollY;
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
    window.addEventListener("wheel", alRodar, { passive: true });
    window.addEventListener("touchmove", marcarGesto, { passive: true });
    window.addEventListener("keydown", alTeclado);
    const lanzar = (hasta: number, ms: number, usado: number) => {
      if (reducidoMedia.matches || deslizando()) return usado;
      // Un gesto, un lanzamiento: con el trackpad llegan decenas de eventos
      // de rueda por cada empujón.
      if (ultimoGesto === usado) return usado;
      if (performance.now() - ultimoGesto > 1200) return usado;
      // La página tiene que estar bajando de verdad: quieta o subiendo, no.
      const salto = window.scrollY - ultimoY;
      if (salto <= 0 || salto > window.innerHeight * 0.5) return usado;
      return deslizarHasta(hasta, ms) ? ultimoGesto : usado;
    };

    // --- El agujero negro: secuencia de fotogramas, como la portada -------
    const ctx = lienzo?.getContext("2d") ?? null;
    let pintadoAgujero = -1;
    let pedido = 0;
    const pintarAgujero = (quiero: number) => {
      const img = secuencia.mejor(quiero);
      if (!img || !lienzo || !ctx) return;
      // Sin más resolución que la del fotograma (ver Retrato.tsx).
      const cubreCaja = Math.max(lienzo.clientWidth / 1280, lienzo.clientHeight / 720);
      const dpr = Math.min(window.devicePixelRatio || 1, Math.max(1, 1 / cubreCaja));
      const ancho = lienzo.clientWidth;
      const alto = lienzo.clientHeight;
      const w = Math.round(ancho * dpr);
      const h = Math.round(alto * dpr);
      if (lienzo.width !== w || lienzo.height !== h) {
        lienzo.width = w;
        lienzo.height = h;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Como object-fit: cover, centrado: el agujero nace en el centro de la
      // pantalla y acaba cubriéndola entera.
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const escala = Math.max(ancho / iw, alto / ih);
      const dw = iw * escala;
      const dh = ih * escala;
      ctx.drawImage(img, (ancho - dw) / 2, (alto - dh) / 2, dw, dh);
      pintadoAgujero = quiero;
    };
    const secuencia = new SecuenciaFotogramas(
      FOTOGRAMAS,
      (i) => `${AGUJERO}f${String(i).padStart(3, "0")}.jpg`,
      (i) => {
        if (pintadoAgujero < 0 || Math.abs(i - pedido) <= 2) pintarAgujero(pedido);
      },
      8,
      (i) => `${AGUJERO_MINI}f${String(i).padStart(3, "0")}.jpg`,
    );
    // --- El corte entre lo técnico y el criterio -------------------------
    // Un barrido que deja la pantalla en negro y la devuelve a blanco: marca
    // que lo que sigue es de otra naturaleza. Ocurre en el tramo en que el
    // lector pasa de la penúltima categoría a la última.
    const ctxCorte = lienzoCorte?.getContext("2d") ?? null;
    let pintadoCorte = -1;
    let pedidoCorte = 0;
    const pintarCorte = (quiero: number) => {
      const img = secuenciaCorte.mejor(quiero);
      if (!img || !lienzoCorte || !ctxCorte) return;
      const cubreCaja = Math.max(
        lienzoCorte.clientWidth / 1280,
        lienzoCorte.clientHeight / 720,
      );
      const dpr = Math.min(window.devicePixelRatio || 1, Math.max(1, 1 / cubreCaja));
      const ancho = lienzoCorte.clientWidth;
      const alto = lienzoCorte.clientHeight;
      const w = Math.round(ancho * dpr);
      const h = Math.round(alto * dpr);
      if (lienzoCorte.width !== w || lienzoCorte.height !== h) {
        lienzoCorte.width = w;
        lienzoCorte.height = h;
      }
      ctxCorte.setTransform(dpr, 0, 0, dpr, 0, 0);
      const escala = Math.max(ancho / img.naturalWidth, alto / img.naturalHeight);
      const dw = img.naturalWidth * escala;
      const dh = img.naturalHeight * escala;
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
        secuenciaCorte.empezar();
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
        secuencia.empezar();
      },
      { rootMargin: "0px 0px 100% 0px" },
    );
    if (sondaAgujero) vigiaAgujero.observe(sondaAgujero);

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
    const pintar = () => {
      pendiente = false;
      const caja = raiz.getBoundingClientRect();
      const alto = window.innerHeight;
      // Primero el túnel: arranca en cuanto la sección asoma por abajo y
      // termina tras recorrer su tramo fijo (--tunel). La sonda también mide
      // la cola (--cola): la última pantalla, que Proyectos cubre al llegar.
      const tunel = sonda?.offsetTop ?? 0;
      const cola = sonda?.offsetHeight ?? 0;
      const agujero = sondaAgujero?.offsetHeight ?? 0;
      // Cubierta: de 0 cuando Proyectos asoma por abajo a 1 cuando tapa la
      // pantalla; la sección se hunde un poco y se oscurece por debajo.
      const cubre = limitar((alto + cola - caja.bottom) / Math.max(1, cola));
      poner("--cubre", cubre.toFixed(4));
      const pt = limitar((alto - caja.top) / (alto + tunel));
      poner("--pt", pt.toFixed(4));
      const ahora = performance.now();
      const dt = Math.max(16, ahora - ultimoT);
      // Solo cuenta mientras el túnel está en juego.
      if (pt > 0 && pt < 1) {
        const inst = (Math.abs(pt - ultimoPt) / dt) * 1000; // túneles por segundo
        vel = Math.max(vel, limitar(inst / 0.9));
        if (!rafVel) rafVel = requestAnimationFrame(apagarVel);
      }
      poner("--vel", vel.toFixed(3));
      // El túnel es el tramo más largo de todos: en cuanto se pide bajar se
      // recorre entero solo.
      if (pt > 0.02 && pt < 0.9) {
        gestoTunel = lanzar(raiz.offsetTop + tunel, DURACION_TUNEL, gestoTunel);
      } else if (pt <= 0.02) gestoTunel = 0;
      ultimoPt = pt;
      ultimoT = ahora;
      // Al fondo del túnel, «LENGUAJES» crece desde el punto de fuga y se
      // desliza a su sitio; entonces aparece el resto de la sección.
      poner("--acerca", limitar((pt - 0.42) / 0.4).toFixed(4));
      poner("--asienta", suave(limitar((pt - 0.8) / 0.12)).toFixed(4));
      poner("--llegada", suave(limitar((pt - 0.9) / 0.08)).toFixed(4));
      // Después, el lector recorre las categorías con el resto del scroll,
      // menos el tramo que se reserva para el corte: así el corte no comparte
      // sitio con el paso de una categoría a otra y no se puede pasar de
      // largo por bajar deprisa.
      const largo = caja.height - alto - tunel - cola - agujero;
      const anchoCorte = sondaCorte?.offsetHeight ?? 0;
      const largoLector = Math.max(1, largo - anchoCorte);
      const s = -caja.top - tunel;
      // Dónde queda el lector al llegar a la penúltima categoría: ahí se
      // abre el hueco del corte.
      const avanceCorte =
        PAUSA_INICIO +
        ((total - 2) / (total - 1)) * (1 - PAUSA_INICIO - PAUSA_FINAL);
      const sCorte = avanceCorte * largoLector;
      let avance: number;
      let corte: number;
      if (s < sCorte) {
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
      poner("--p", p.toFixed(4));
      // El armado del criterio: las casillas salen del centro de la pantalla
      // (donde se apaga la luz del corte) y se reparten hasta su sitio, en el
      // tramo que queda entre el corte y el agujero. Es el mismo camino
      // que luego hace el agujero al revés: nacen de la luz y se las traga la
      // oscuridad, al mismo centro.
      // Empieza justo cuando el corte termina: mientras dura, su luz tapa la
      // pantalla y la primera fila se armaba sin que se viera.
      const sArmaIni = sCorte + anchoCorte;
      const trasCorte = Math.max(1, largoLector - sCorte);
      const sArmaFin = sArmaIni + trasCorte * 0.62;
      const arma = limitar((s - sArmaIni) / Math.max(1, sArmaFin - sArmaIni));
      poner("--arma", arma.toFixed(4));
      // Al asomar, se reproduce solo hasta el final de su tramo.
      if (corte > 0.002 && corte < 0.9) {
        gestoCorte = lanzar(
          raiz.offsetTop + tunel + sArmaFin,
          DURACION_CORTE,
          gestoCorte,
        );
      } else if (corte <= 0.002) gestoCorte = 0;
      poner("--corte", corte.toFixed(4));
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
        gestoAgujero = lanzar(
          raiz.offsetTop + tunel + largo + agujero,
          DURACION_AGUJERO,
          gestoAgujero,
        );
      } else if (traga <= 0.002) gestoAgujero = 0;
      poner("--traga", traga.toFixed(4));
      raiz.toggleAttribute("data-traga", traga > 0);
      const cuadro = Math.round(traga * (FOTOGRAMAS - 1));
      if (cuadro !== pedido) {
        pedido = cuadro;
        secuencia.pedir(pedido);
      }
      if (traga > 0 && pedido !== pintadoAgujero) pintarAgujero(pedido);
      ultimoY = window.scrollY;
      // Durante el corte el lector se queda en la penúltima categoría, pero
      // lo que hay detrás ya tiene que ser el criterio: si no, al aclararse
      // el barrido se ven todavía las placas de la anterior.
      const nuevo = corte > 0.5 ? total - 1 : Math.round(p);
      if (nuevo > 0) movido = true;
      if (pt < 1) movido = false;
      ponerFase(reducido ? "lector" : pt < 1 ? "tunel" : movido ? "lector" : "aterrizado");
      if (nuevo === activo) return;
      activo = nuevo;
      grupos.forEach((g, i) =>
        g.setAttribute(
          "data-estado",
          i < activo ? "antes" : i > activo ? "despues" : "activo",
        ),
      );

    };
    // Solo se mide con la sección a la vista (ver cercania.ts).
    let cerca = true;
    const alScroll = () => {
      if (pendiente || !cerca) return;
      pendiente = true;
      requestAnimationFrame(pintar);
    };
    const alRedimensionar = () => {
      colocarDestino();
      medidas = false;
      alScroll();
    };
    colocarDestino();
    document.fonts?.ready.then(colocarDestino);
    pintar();
    const dejarDeVigilar = vigilarCercania(raiz, (c) => {
      cerca = c;
      pintar();
    });
    window.addEventListener("scroll", alScroll, { passive: true });
    window.addEventListener("resize", alRedimensionar);
    return () => {
      window.removeEventListener("wheel", marcarGesto);
      window.removeEventListener("touchmove", marcarGesto);
      window.removeEventListener("keydown", alTeclado);
      dejarDeVigilar();
      vigiaAgujero.disconnect();
      vigiaCorte.disconnect();
      secuencia.detener();
      secuenciaCorte.detener();
      cancelAnimationFrame(rafVel);
      window.removeEventListener("scroll", alScroll);
      window.removeEventListener("resize", alRedimensionar);
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
        <div className="herr-lector" aria-hidden="true">
          <span className="herr-marca" />
          <ul className="herr-palabras">
            {stack.map((grupo, i) => (
              <li
                key={grupo.id}
                style={{ "--i": i } as CSSProperties}
                data-texto={di(grupo.palabra ?? grupo.titulo)}
              >
                {di(grupo.palabra ?? grupo.titulo)}
              </li>
            ))}
          </ul>
        </div>

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
                          "--i": i,
                          // Su sitio en la rejilla de escritorio (4 × 2) y en
                          // la de móvil (2 × 4): el CSS lo usa para sacarla
                          // del centro de la pantalla hasta su casilla.
                          "--c4": i % 4,
                          "--f4": Math.floor(i / 4),
                          "--c2": i % 2,
                          "--f2": Math.floor(i / 2),
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
