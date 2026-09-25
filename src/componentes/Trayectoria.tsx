import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { idiomas, pases } from "../datos/trayectoria";
import { useIdioma } from "../idioma/idioma";
import { textos } from "../idioma/textos";
import { vigilarCercania } from "../retrato/cercania";
import { SecuenciaFotogramas } from "../retrato/secuencia";
import { esCelular } from "../retrato/telefono";
import "./Trayectoria.css";

/** Fotogramas de la niebla de salida (de `video7.mp4`). Ver README. */
const NIEBLA = `${import.meta.env.BASE_URL}imagenes/niebla/`;
const NIEBLA_MINI = `${import.meta.env.BASE_URL}imagenes/niebla-mini/`;
const FOTOGRAMAS = 36;

/** Tramos del recorrido en que la pila se queda quieta al empezar y acabar. */
const PAUSA_INICIO = 0.05;
const PAUSA_FINAL = 0.05;
/** Parte de cada tramo entre dos pases en que la pila reposa. */
const REPOSO = 0.5;

/** Avance con reposo: se queda en cada pase y se desliza entre ellos. */
function conReposo(x: number) {
  const i = Math.floor(x);
  const f = x - i;
  const g = Math.min(1, Math.max(0, (f - REPOSO / 2) / (1 - REPOSO)));
  return i + g * g * (3 - 2 * g);
}

/**
 * Trayectoria: una pila de credenciales que se va pasando.
 *
 * La sección mide varias pantallas y su contenido queda fijo. Al bajar, el
 * pase de delante sale y entra el siguiente; a la izquierda cambia su ficha,
 * con el año en grande. La pila se detiene en cada pase (`conReposo`), así
 * que ninguno pasa de largo.
 *
 * Sigue al capítulo de proyectos con su mismo fondo, así que entra sin borde.
 * Al final, la niebla se lleva la sección y deja el blanco con el que llega
 * el contacto (`--fin`).
 */

/**
 * Una banda del recorrido, a todo el ancho. Siempre se ve su línea (índice,
 * año, de qué fue y dónde); la del pase activo se abre y enseña dentro lo
 * que hizo, el sitio y las notas. Cuánto se abre sale de --p, así que al
 * bajar una se cierra mientras la siguiente se abre.
 */
function Banda({ n, pase }: { n: number; pase: (typeof pases)[number] }) {
  const { di } = useIdioma();
  return (
    <li className="tray-pase" style={{ "--n": n } as CSSProperties}>
      <div className="tray-linea">
        <span className="tray-indice" aria-hidden="true">
          {String(n + 1).padStart(2, "0")}
        </span>
        <span className="tray-anio">{di(pase.año)}</span>
        <span className="tray-tipo">{di(pase.tipo)}</span>
        <h3 className="tray-donde">{pase.donde}</h3>
        {pase.sello && <b className="tray-sello">{di(pase.sello)}</b>}
      </div>
      <div className="tray-detalle">
        <div>
          <p className="tray-rol">{di(pase.rol)}</p>
          <p className="tray-lugar">{di(pase.lugar)}</p>
        </div>
        <div>
          <ul>
            {pase.notas.map((nota, i) => (
              <li key={i}>{di(nota)}</li>
            ))}
          </ul>
          <p className="tray-codigo" aria-hidden="true">
            {pase.codigo}
            <span className="tray-barras" />
          </p>
        </div>
      </div>
    </li>
  );
}

export function Trayectoria() {
  const { di } = useIdioma();
  const seccion = useRef<HTMLElement>(null);

  useEffect(() => {
    const raiz = seccion.current;
    if (!raiz) return;
    const listaPases = Array.from(raiz.querySelectorAll<HTMLElement>(".tray-pase"));
    const sonda = raiz.querySelector<HTMLElement>(".tray-sonda");
    const lienzo = raiz.querySelector<HTMLCanvasElement>(".tray-niebla");
    const ctx = lienzo?.getContext("2d") ?? null;
    const total = listaPases.length;
    const celular = esCelular();
    let activa = -1;
    let pintado = -1;
    let pedido = 0;
    let pendiente = false;
    const limitar = (v: number) => Math.min(1, Math.max(0, v));

    // --- La niebla de salida -------------------------------------------------
    const pintarNiebla = (quiero: number) => {
      const img = secuencia.mejor(quiero);
      if (!img || !lienzo || !ctx) return;
      const cubre = Math.max(lienzo.clientWidth / 1280, lienzo.clientHeight / 720);
      const dpr = Math.min(window.devicePixelRatio || 1, Math.max(1, 1 / cubre));
      const ancho = lienzo.clientWidth;
      const alto = lienzo.clientHeight;
      const w = Math.round(ancho * dpr);
      const h = Math.round(alto * dpr);
      if (lienzo.width !== w || lienzo.height !== h) {
        lienzo.width = w;
        lienzo.height = h;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Como object-fit: cover, anclado abajo: la niebla entra por ahí.
      const escala = Math.max(ancho / img.width, alto / img.height);
      const dw = img.width * escala;
      const dh = img.height * escala;
      ctx.drawImage(img, (ancho - dw) / 2, alto - dh, dw, dh);
      pintado = quiero;
    };
    const secuencia = new SecuenciaFotogramas(
      FOTOGRAMAS,
      (i) => `${NIEBLA}f${String(i).padStart(3, "0")}.jpg`,
      (i) => {
        if (pintado < 0 || Math.abs(i - pedido) <= 2) pintarNiebla(pedido);
      },
      6,
      (i) => `${NIEBLA_MINI}f${String(i).padStart(3, "0")}.jpg`,
    );
    const vigiaNiebla = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        vigiaNiebla.disconnect();
        // En el celular no hay niebla: el paso al blanco del cierre lo hace
        // una capa blanca que se funde con --fin (ver el modo celular en el
        // CSS).
        if (!celular) secuencia.empezar();
      },
      { rootMargin: "0px" },
    );
    vigiaNiebla.observe(raiz);

    // --- El carril y la salida -----------------------------------------------
    // --p solo lo usan las bandas y el contador (dentro de .tray-marco) y el
    // riel: escrito en la raíz, se recalculaban los 125 elementos de la
    // sección en cada fotograma. Y cada variable solo se escribe si cambia.
    const marco = raiz.querySelector<HTMLElement>(".tray-marco");
    const riel = raiz.querySelector<HTMLElement>(".tray-riel");
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
    const medir = () => {
      pendiente = false;
      const alto = window.innerHeight;
      const caja = raiz.getBoundingClientRect();
      const niebla = sonda?.offsetHeight || alto;
      const cola = sonda ? raiz.offsetHeight - (sonda.offsetTop + niebla) : alto;

      // Los pases se van pasando con el scroll, hasta donde empieza la salida
      // (la sonda marca ese punto).
      const largo = (sonda?.offsetTop ?? caja.height) - alto;
      const avance = largo > 0 ? limitar(-caja.top / largo) : 0;
      const tramo = limitar(
        (avance - PAUSA_INICIO) / (1 - PAUSA_INICIO - PAUSA_FINAL),
      );
      const p = conReposo(tramo * (total - 1));
      // En el celular, --p va de pase en pase y el CSS anima el cambio: al
      // bajar entre dos pases no hay nada que recalcular ni que repintar.
      // Seguirlo fotograma a fotograma recolocaba las cinco bandas en cada
      // uno, y en un teléfono de gama media se notaba.
      poner("--p", celular ? String(Math.round(p)) : p.toFixed(4), marco, riel);
      const nueva = Math.round(p);
      if (nueva !== activa) {
        activa = nueva;
        listaPases.forEach((s, i) =>
          s.setAttribute(
            "data-estado",
            i < activa ? "antes" : i > activa ? "despues" : "activa",
          ),
        );
        raiz.setAttribute("data-pase", String(activa));
      }

      // Salida: una pantalla de niebla, desde que los pases se acaban hasta
      // que el contacto llena la pantalla.
      const fin = limitar((alto + cola + niebla - caja.bottom) / niebla);
      poner("--fin", fin.toFixed(4));
      // La capa lleva «screen»: dejarla puesta obliga a recomponer la
      // pantalla entera aunque no se vea, incluso desde otras secciones.
      raiz.toggleAttribute("data-niebla", fin > 0);
      poner("--velo", (1 - limitar((alto + cola - caja.bottom) / (alto * 0.5))).toFixed(4));
      const cuadro = Math.round(fin * (FOTOGRAMAS - 1));
      if (cuadro !== pedido) {
        pedido = cuadro;
        secuencia.pedir(pedido);
      }
      if (fin > 0 && pedido !== pintado) pintarNiebla(pedido);
    };

    let cerca = true;
    const alScroll = () => {
      if (pendiente || !cerca) return;
      pendiente = true;
      requestAnimationFrame(medir);
    };
    medir();
    const dejarDeVigilar = vigilarCercania(raiz, (c) => {
      cerca = c;
      medir();
      // Lejos, sus fotogramas sobran en memoria (ver secuencia.ts).
      if (!c) secuencia.soltar();
    });
    window.addEventListener("scroll", alScroll, { passive: true });
    window.addEventListener("resize", alScroll);
    return () => {
      dejarDeVigilar();
      vigiaNiebla.disconnect();
      secuencia.detener();
      window.removeEventListener("scroll", alScroll);
      window.removeEventListener("resize", alScroll);
    };
  }, []);

  return (
    <section
      ref={seccion}
      className="trayectoria"
      id="trayectoria"
      aria-labelledby="titulo-trayectoria"
      style={{ "--pases": pases.length } as CSSProperties}
    >
      <span className="tray-sonda" aria-hidden="true" />
      <div className="tray-velo" aria-hidden="true">
        <canvas className="tray-niebla" />
        <span className="tray-luz" />
      </div>

      <div className="tray-fijo">
        <header className="tray-cabecera">
          <p className="tray-rotulo">{di(textos.trayectoriaRotulo)}</p>
          <h2 id="titulo-trayectoria">{di(textos.trayectoriaTitulo)}</h2>
        </header>

        {/* El recorrido entero, como un libro mayor: un encabezado con el
            contador y cinco bandas a todo el ancho, con la activa abierta. */}
        <div className="tray-marco">
          <div className="tray-encabezado" aria-hidden="true">
            <span>
              {di(textos.trayectoriaRecorrido)} · {String(pases.length).padStart(2, "0")}{" "}
              {di(textos.trayectoriaPases)}
            </span>
            <span className="tray-contador">
              <span className="tray-contador-n">
                {pases.map((pase, i) => (
                  <b key={pase.codigo} style={{ "--n": i } as CSSProperties}>
                    {String(i + 1).padStart(2, "0")}
                  </b>
                ))}
              </span>
              <i>/ {String(pases.length).padStart(2, "0")}</i>
            </span>
          </div>
          <ol className="tray-lista">
            {pases.map((pase, i) => (
              <Banda key={pase.codigo} n={i} pase={pase} />
            ))}
          </ol>
        </div>

        <p className="tray-idiomas">
          {idiomas.map((l) => (
            <span key={l.lengua.es}>
              {di(l.lengua)} <b>{di(l.nivel)}</b>
            </span>
          ))}
        </p>

        {/* Riel: una muesca por pase, el actual en lima. */}
        <div className="tray-riel" aria-hidden="true">
          {pases.map((pase, i) => (
            <span key={pase.codigo} style={{ "--i": i } as CSSProperties} />
          ))}
        </div>
      </div>
    </section>
  );
}
