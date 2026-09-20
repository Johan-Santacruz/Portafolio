import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { idiomas, pases } from "../datos/trayectoria";
import { vigilarCercania } from "../retrato/cercania";
import { SecuenciaFotogramas } from "../retrato/secuencia";
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
 * Un pase: acero achaflanado con su filete lima, la banda del tipo arriba, el
 * sitio en grande y los datos en mono abajo. Su sitio en la pila sale de la
 * distancia al pase activo (--d), que se calcula en CSS.
 */
function Credencial({ n, pase }: { n: number; pase: (typeof pases)[number] }) {
  return (
    <li className="tray-pase" style={{ "--n": n } as CSSProperties}>
      <span className="tray-troquel" aria-hidden="true" />
      <p className="tray-tipo">
        <span>{pase.tipo}</span>
        {pase.sello && <b className="tray-sello">{pase.sello}</b>}
      </p>
      <h3 className="tray-donde">{pase.donde}</h3>
      <p className="tray-rol">{pase.rol}</p>
      <p className="tray-codigo" aria-hidden="true">
        {pase.codigo}
        <span className="tray-barras" />
      </p>
    </li>
  );
}

export function Trayectoria() {
  const seccion = useRef<HTMLElement>(null);

  useEffect(() => {
    const raiz = seccion.current;
    if (!raiz) return;
    const listaPases = Array.from(raiz.querySelectorAll<HTMLElement>(".tray-pase"));
    const sonda = raiz.querySelector<HTMLElement>(".tray-sonda");
    const lienzo = raiz.querySelector<HTMLCanvasElement>(".tray-niebla");
    const ctx = lienzo?.getContext("2d") ?? null;
    const total = listaPases.length;
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
      const escala = Math.max(ancho / img.naturalWidth, alto / img.naturalHeight);
      const dw = img.naturalWidth * escala;
      const dh = img.naturalHeight * escala;
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
        secuencia.empezar();
      },
      { rootMargin: "0px" },
    );
    vigiaNiebla.observe(raiz);

    // --- El carril y la salida -----------------------------------------------
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
      raiz.style.setProperty("--p", p.toFixed(4));
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
      raiz.style.setProperty("--fin", fin.toFixed(4));
      raiz.style.setProperty(
        "--velo",
        (1 - limitar((alto + cola - caja.bottom) / (alto * 0.5))).toFixed(4),
      );
      const cuadro = Math.round(fin * (FOTOGRAMAS - 1));
      if (cuadro !== pedido) {
        pedido = cuadro;
        secuencia.pedir(pedido);
      }
      if (fin > 0 || pintado >= 0) pintarNiebla(pedido);
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
        <h2 id="titulo-trayectoria" className="tray-titulo">
          Trayectoria
        </h2>

        {/* La ficha del pase activo: el año en grande y lo que se hizo. */}
        <div className="tray-ficha">
          {pases.map((pase, i) => (
            <article
              key={pase.codigo}
              className="tray-detalle"
              style={{ "--n": i } as CSSProperties}
            >
              <p className="tray-anio">{pase.año}</p>
              <p className="tray-lugar">{pase.lugar}</p>
              <ul>
                {pase.notas.map((nota) => (
                  <li key={nota}>{nota}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        {/* La pila de pases: el activo al frente, los demás detrás. */}
        <ul className="tray-pila">
          {pases.map((pase, i) => (
            <Credencial key={pase.codigo} n={i} pase={pase} />
          ))}
        </ul>

        <p className="tray-idiomas">
          {idiomas.map((l) => (
            <span key={l.lengua}>
              {l.lengua} <b>{l.nivel}</b>
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
