import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import {
  competencias,
  experiencia,
  formacion,
  idiomas,
} from "../datos/trayectoria";
import { vigilarCercania } from "../retrato/cercania";
import { SecuenciaFotogramas } from "../retrato/secuencia";
import "./Trayectoria.css";

/** Fotogramas de la niebla de salida (de `video7.mp4`). Ver README. */
const NIEBLA = `${import.meta.env.BASE_URL}imagenes/niebla/`;
const NIEBLA_MINI = `${import.meta.env.BASE_URL}imagenes/niebla-mini/`;
const FOTOGRAMAS = 36;

/**
 * Trayectoria: dónde he estado y cómo trabajo.
 *
 * Sigue al capítulo de proyectos con su mismo fondo, así que entra sin borde.
 * La línea de tiempo y las competencias aparecen al entrar en pantalla, una
 * sola vez. Al final, la niebla se lleva la sección y deja el blanco con el
 * que llega el contacto (`--fin`, ver Proyectos.css para el mismo patrón).
 */
export function Trayectoria() {
  const seccion = useRef<HTMLElement>(null);

  // Aparición de cada bloque al entrar en pantalla.
  useEffect(() => {
    const raiz = seccion.current;
    if (!raiz) return;
    const piezas = raiz.querySelectorAll<HTMLElement>("[data-entra]");
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducido.matches || !("IntersectionObserver" in window)) {
      piezas.forEach((p) => p.setAttribute("data-entra", "si"));
      return;
    }
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          e.target.setAttribute("data-entra", "si");
          observador.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.15 },
    );
    piezas.forEach((p) => observador.observe(p));
    return () => observador.disconnect();
  }, []);

  // La niebla de salida, igual que la tenía Proyectos.
  useEffect(() => {
    const raiz = seccion.current;
    if (!raiz) return;
    const sonda = raiz.querySelector<HTMLElement>(".tray-sonda");
    const lienzo = raiz.querySelector<HTMLCanvasElement>(".tray-niebla");
    const ctx = lienzo?.getContext("2d") ?? null;
    let pintado = -1;
    let pedido = 0;
    let pendiente = false;
    const limitar = (v: number) => Math.min(1, Math.max(0, v));

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

    const medir = () => {
      pendiente = false;
      const alto = window.innerHeight;
      const caja = raiz.getBoundingClientRect();
      const niebla = sonda?.offsetHeight || alto;
      const cola = sonda ? raiz.offsetHeight - (sonda.offsetTop + niebla) : alto;
      // Una pantalla de scroll, desde que la sección se acaba hasta que el
      // contacto llena la pantalla.
      const fin = limitar((alto + cola + niebla - caja.bottom) / niebla);
      raiz.style.setProperty("--fin", fin.toFixed(4));
      // La capa se retira mientras el contacto entra: para entonces el fondo
      // de esta sección ya es blanco y no reaparece el negro.
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
    >
      <span className="tray-sonda" aria-hidden="true" />
      <div className="tray-velo" aria-hidden="true">
        <canvas className="tray-niebla" />
        <span className="tray-luz" />
      </div>

      <div className="tray-cuerpo">
        <header className="tray-cabecera" data-entra="no">
          <p className="tray-rotulo">
            <span aria-hidden="true">~ $ </span>cat ./trayectoria
          </p>
          <h2 id="titulo-trayectoria">Dónde he estado</h2>
        </header>

        <div className="tray-rejilla">
          <div className="tray-columna">
            <h3 className="tray-sub" data-entra="no">
              Experiencia
            </h3>
            <ol className="tray-linea">
              {experiencia.map((h, i) => (
                <li key={h.titulo} data-entra="no" style={{ "--i": i } as CSSProperties}>
                  <p className="tray-periodo">{h.periodo}</p>
                  <h4>{h.titulo}</h4>
                  <p className="tray-lugar">{h.lugar}</p>
                  {h.detalle.length > 0 && (
                    <ul className="tray-detalle">
                      {h.detalle.map((d) => (
                        <li key={d}>{d}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ol>

            <h3 className="tray-sub" data-entra="no">
              Formación
            </h3>
            <ol className="tray-linea">
              {formacion.map((h, i) => (
                <li key={h.titulo} data-entra="no" style={{ "--i": i } as CSSProperties}>
                  <p className="tray-periodo">{h.periodo}</p>
                  <h4>{h.titulo}</h4>
                  <p className="tray-lugar">{h.lugar}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="tray-columna">
            <h3 className="tray-sub" data-entra="no">
              Cómo trabajo
            </h3>
            <ul className="tray-competencias">
              {competencias.map((c, i) => (
                <li key={c.titulo} data-entra="no" style={{ "--i": i } as CSSProperties}>
                  <h4>{c.titulo}</h4>
                  <p>{c.texto}</p>
                </li>
              ))}
            </ul>

            <h3 className="tray-sub" data-entra="no">
              Idiomas
            </h3>
            <ul className="tray-idiomas" data-entra="no">
              {idiomas.map((l) => (
                <li key={l.lengua}>
                  <span>{l.lengua}</span>
                  <span className="tray-nivel">{l.nivel}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
