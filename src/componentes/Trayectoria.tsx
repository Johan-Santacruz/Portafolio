import { useEffect, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  competencias,
  experiencia,
  formacion,
  idiomas,
  investigacion,
} from "../datos/trayectoria";
import type { Hito } from "../datos/trayectoria";
import { vigilarCercania } from "../retrato/cercania";
import { SecuenciaFotogramas } from "../retrato/secuencia";
import "./Trayectoria.css";

/** Fotogramas de la niebla de salida (de `video7.mp4`). Ver README. */
const NIEBLA = `${import.meta.env.BASE_URL}imagenes/niebla/`;
const NIEBLA_MINI = `${import.meta.env.BASE_URL}imagenes/niebla-mini/`;
const FOTOGRAMAS = 36;

/** Tramos del recorrido en que el carril se queda quieto al empezar y acabar. */
const PAUSA_INICIO = 0.05;
const PAUSA_FINAL = 0.05;
/** Parte de cada tramo entre dos paradas en que el carril reposa. */
const REPOSO = 0.5;

/** Avance con reposo: se queda en cada parada y se desliza entre ellas. */
function conReposo(x: number) {
  const i = Math.floor(x);
  const f = x - i;
  const g = Math.min(1, Math.max(0, (f - REPOSO / 2) / (1 - REPOSO)));
  return i + g * g * (3 - 2 * g);
}

/**
 * Trayectoria: el expediente, una parada por pantalla.
 *
 * La sección mide varias pantallas y su contenido queda fijo; al bajar, un
 * carril se desplaza en horizontal y cada apartado ocupa la pantalla entera,
 * con su número, su palabra gigante y su contenido. El carril se detiene en
 * cada parada (`conReposo`), así que nada pasa de largo.
 *
 * Sigue al capítulo de proyectos con su mismo fondo, así que entra sin borde.
 * Al final, la niebla se lleva la sección y deja el blanco con el que llega
 * el contacto (`--fin`).
 */

/** Un hito de la línea de tiempo, con su periodo, su sitio y lo que se hizo. */
function Ficha({ hito, i }: { hito: Hito; i: number }) {
  return (
    <article className="tray-ficha" style={{ "--i": i } as CSSProperties}>
      <p className="tray-periodo">{hito.periodo}</p>
      <h4>{hito.titulo}</h4>
      <p className="tray-lugar">{hito.lugar}</p>
      {hito.detalle.length > 0 && (
        <ul className="tray-detalle">
          {hito.detalle.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      )}
    </article>
  );
}

/** Una parada del carril: número, palabra gigante y contenido. */
function Parada({
  n,
  clave,
  palabra,
  orden,
  cifra,
  children,
}: {
  n: number;
  clave: string;
  palabra: string;
  orden: string;
  cifra?: { valor: string; pie: string };
  children: ReactNode;
}) {
  return (
    <section
      className="tray-parada"
      data-clave={clave}
      style={{ "--n": n } as CSSProperties}
      aria-label={palabra}
    >
      <header className="tray-encabezado">
        <p className="tray-numero" aria-hidden="true">
          {String(n + 1).padStart(2, "0")}
        </p>
        <p className="tray-orden" aria-hidden="true">
          <span>~ $ </span>
          {orden}
        </p>
        <h3 className="tray-palabra" data-texto={palabra}>
          {palabra}
        </h3>
      </header>
      <div className="tray-contenido">{children}</div>
      {cifra && (
        <p className="tray-cifra" aria-hidden="true">
          <span>{cifra.valor}</span>
          {cifra.pie}
        </p>
      )}
    </section>
  );
}

export function Trayectoria() {
  const seccion = useRef<HTMLElement>(null);

  useEffect(() => {
    const raiz = seccion.current;
    if (!raiz) return;
    const paradas = Array.from(raiz.querySelectorAll<HTMLElement>(".tray-parada"));
    const sonda = raiz.querySelector<HTMLElement>(".tray-sonda");
    const lienzo = raiz.querySelector<HTMLCanvasElement>(".tray-niebla");
    const ctx = lienzo?.getContext("2d") ?? null;
    const total = paradas.length;
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

      // El carril recorre las paradas con el scroll, hasta donde empieza la
      // salida (la sonda marca ese punto).
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
        paradas.forEach((s, i) =>
          s.setAttribute(
            "data-estado",
            i < activa ? "antes" : i > activa ? "despues" : "activa",
          ),
        );
      }

      // Salida: una pantalla de niebla, desde que las paradas se acaban hasta
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

  const paradas = [
    {
      clave: "experiencia",
      palabra: "Experiencia",
      orden: "cat ./experiencia",
      cifra: experiencia[0]?.cifra,
      hijos: (
        <div className="tray-fichas">
          {experiencia.map((h, i) => (
            <Ficha key={h.titulo} hito={h} i={i} />
          ))}
        </div>
      ),
    },
    {
      clave: "investigacion",
      palabra: "Investigación",
      orden: "cat ./investigacion",
      cifra: investigacion[1]?.cifra,
      hijos: (
        <div className="tray-fichas">
          {investigacion.map((h, i) => (
            <Ficha key={h.titulo} hito={h} i={i} />
          ))}
        </div>
      ),
    },
    {
      clave: "formacion",
      palabra: "Formación",
      orden: "cat ./formacion",
      cifra: formacion[0]?.cifra,
      hijos: (
        <div className="tray-fichas">
          {formacion.map((h, i) => (
            <Ficha key={h.titulo} hito={h} i={i} />
          ))}
        </div>
      ),
    },
    {
      clave: "competencias",
      palabra: "Cómo trabajo",
      orden: "cat ./competencias",
      hijos: (
        <ul className="tray-competencias">
          {competencias.map((c, i) => (
            <li key={c.titulo} style={{ "--i": i } as CSSProperties}>
              <h4>{c.titulo}</h4>
              <p>{c.texto}</p>
            </li>
          ))}
        </ul>
      ),
    },
    {
      clave: "idiomas",
      palabra: "Idiomas",
      orden: "cat ./idiomas",
      hijos: (
        <ul className="tray-idiomas">
          {idiomas.map((l, i) => (
            <li
              key={l.lengua}
              style={{ "--i": i, "--barra": l.barra } as CSSProperties}
            >
              <span className="tray-lengua">{l.lengua}</span>
              <span className="tray-medida" aria-hidden="true" />
              <span className="tray-nivel">{l.nivel}</span>
            </li>
          ))}
        </ul>
      ),
    },
  ];

  return (
    <section
      ref={seccion}
      className="trayectoria"
      id="trayectoria"
      aria-labelledby="titulo-trayectoria"
      style={{ "--paradas": paradas.length } as CSSProperties}
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

        <div className="tray-carril">
          {paradas.map((p, i) => (
            <Parada
              key={p.clave}
              n={i}
              clave={p.clave}
              palabra={p.palabra}
              orden={p.orden}
              cifra={p.cifra}
            >
              {p.hijos}
            </Parada>
          ))}
        </div>

        {/* Riel: una muesca por parada, la actual en lima. */}
        <div className="tray-riel" aria-hidden="true">
          {paradas.map((p, i) => (
            <span key={p.clave} style={{ "--i": i } as CSSProperties} />
          ))}
        </div>
      </div>
    </section>
  );
}
