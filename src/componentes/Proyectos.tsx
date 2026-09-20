import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { trabajos } from "../datos/trabajos";
import type { Trabajo } from "../datos/trabajos";
import { iconos } from "../datos/stack";
import { Icono } from "./Icono";
import { vigilarCercania } from "../retrato/cercania";
import "./Proyectos.css";

const ICONOS = `${import.meta.env.BASE_URL}iconos/`;
const MEDIA = `${import.meta.env.BASE_URL}media/`;

/** Tecnologías de los trabajos que no están tal cual en `iconos`. */
const ICONOS_EXTRA: Record<string, string> = {
  "React + TypeScript": "react",
  "React + Vite": "react",
  "SQLite FTS5": "sqlite",
  OpenAI: "openai",
  Whisper: "openai",
  Telegram: "telegram",
  Jira: "jira",
  "Framer Motion": "framer",
};
const logo = (tecnologia: string) =>
  iconos[tecnologia] ?? ICONOS_EXTRA[tecnologia];

/**
 * Proyectos como una lista de nombres gigantes. Al bajar, el nombre que pasa
 * por el centro de la pantalla se enciende y su captura aparece detrás; los
 * demás se quedan apagados. A los lados, el contexto y el año.
 *
 * Cada fila recibe `--luz` (0 a 1) según lo cerca que está su centro del
 * centro de la pantalla; todo lo visual sale de ahí. Pulsar una fila abre la
 * ficha del proyecto en una ventana nativa. Los datos, de `datos/trabajos.ts`.
 */
export function Proyectos() {
  const seccion = useRef<HTMLElement>(null);
  const fondo = useRef<HTMLVideoElement>(null);
  const dialogo = useRef<HTMLDialogElement>(null);
  const activador = useRef<HTMLElement | null>(null);
  const [abierto, setAbierto] = useState<Trabajo | null>(null);

  useEffect(() => {
    const raiz = seccion.current;
    if (!raiz) return;
    const filas = Array.from(raiz.querySelectorAll<HTMLElement>(".proy-fila"));
    let pendiente = false;
    const medir = () => {
      pendiente = false;
      const alto = window.innerHeight;
      const centro = alto / 2;
      const caja = raiz.getBoundingClientRect();
      const limitar = (v: number) => Math.min(1, Math.max(0, v));
      // Cubierta: la sección se desliza sobre la anterior; de 0 al asomar por
      // abajo a 1 al llenar la pantalla (las estelas se encienden con ella).
      raiz.style.setProperty("--cubre", limitar(1 - caja.top / alto).toFixed(4));
      // Fin: la luz crece mientras el velo sube por la pantalla y llena todo
      // justo cuando Cierre asoma por abajo (tras la cola de la sección).
      const veloAlto = raiz.querySelector<HTMLElement>(".proy-velo")?.offsetHeight ?? alto;
      const cola = parseFloat(getComputedStyle(raiz).paddingBottom) || 0;
      raiz.style.setProperty(
        "--fin",
        limitar((alto + cola + veloAlto - caja.bottom) / Math.max(1, veloAlto)).toFixed(4),
      );
      // Alcance: a qué distancia del centro una fila ya está apagada del todo.
      const alcance = alto * 0.22;
      for (const fila of filas) {
        const caja = fila.getBoundingClientRect();
        const d = Math.abs(caja.top + caja.height / 2 - centro);
        const luz = Math.max(0, 1 - d / alcance);
        fila.style.setProperty("--luz", luz.toFixed(3));
      }
    };
    // Solo se mide con la sección a la vista (ver cercania.ts).
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
      window.removeEventListener("scroll", alScroll);
      window.removeEventListener("resize", alScroll);
    };
  }, []);

  // El fondo solo se reproduce con la sección a la vista y si no se ha pedido
  // movimiento reducido.
  useEffect(() => {
    const raiz = seccion.current;
    const video = fondo.current;
    if (!raiz || !video) return;
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)");
    const observador = new IntersectionObserver(([entrada]) => {
      if (entrada.isIntersecting && !reducido.matches)
        void video.play().catch(() => {});
      else video.pause();
    });
    observador.observe(raiz);
    return () => observador.disconnect();
  }, []);

  useEffect(() => {
    if (!abierto) return;
    const ventana = dialogo.current;
    const anterior = document.body.style.overflow;
    ventana?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [abierto]);

  const abrir = (trabajo: Trabajo) => {
    activador.current = document.activeElement as HTMLElement;
    setAbierto(trabajo);
  };
  const cerrar = () => dialogo.current?.close();

  return (
    <section
      ref={seccion}
      className="proyectos"
      id="proyectos"
      aria-labelledby="titulo-proyectos"
    >
      {/* Estelas de luz lentas detrás de todo (de video5, aisladas sobre
          negro); se queda fija mientras se recorre la sección. */}
      <div className="proy-fondo" aria-hidden="true">
        <video
          ref={fondo}
          src={`${MEDIA}estelas.mp4`}
          poster={`${MEDIA}estelas-poster.jpg`}
          muted
          loop
          playsInline
          preload="metadata"
        />
      </div>

      <header className="proy-cabecera">
        <p className="proy-rotulo">
          <span aria-hidden="true">~ $ </span>ls ./proyectos
        </p>
        <h2 id="titulo-proyectos">Lo que he construido</h2>
      </header>

      <ol className="proy-lista">
        {trabajos.map((t) => (
          <li
            key={t.id}
            className="proy-fila"
            style={{ "--luz": 0 } as CSSProperties}
          >
            {t.capturas?.[0] && (
              <img
                className="proy-imagen"
                src={t.capturas[0].src}
                alt=""
                loading="lazy"
                decoding="async"
              />
            )}
            <span className="proy-lado proy-contexto">{t.contexto}</span>
            <button className="proy-nombre" onClick={() => abrir(t)}>
              {t.nombre}
              <span className="proy-oculto">: ver el proyecto</span>
            </button>
            <span className="proy-lado proy-periodo">{t.periodo}</span>
          </li>
        ))}
      </ol>

      {abierto && (
        <dialog
          ref={dialogo}
          className="proy-ventana"
          aria-labelledby="titulo-ventana-proyecto"
          onClose={() => {
            setAbierto(null);
            const previo = activador.current;
            requestAnimationFrame(() => previo?.focus());
          }}
          onClick={(evento) => {
            // Pulsar fuera del recuadro cierra.
            if (evento.target !== evento.currentTarget) return;
            const r = evento.currentTarget.getBoundingClientRect();
            const fuera =
              evento.clientX < r.left ||
              evento.clientX > r.right ||
              evento.clientY < r.top ||
              evento.clientY > r.bottom;
            if (fuera) cerrar();
          }}
        >
          <div className="proy-ventana-barra">
            <div>
              <span>
                {abierto.contexto} / {abierto.periodo}
              </span>
              <h2 id="titulo-ventana-proyecto">{abierto.nombre}</h2>
            </div>
            <button
              className="proy-cerrar"
              aria-label="Cerrar"
              onClick={cerrar}
              autoFocus
            >
              <Icono nombre="cerrar" />
            </button>
          </div>
          <div className="proy-ventana-cuerpo">
            <div className="proy-ficha">
              <p className="proy-resumen">{abierto.resumen}</p>
              <p className="proy-descripcion">{abierto.descripcion}</p>
              {!/por confirmar/i.test(abierto.rol) && (
                <p className="proy-rol">
                  <span>Rol</span>
                  {abierto.rol}
                </p>
              )}
              <ul className="proy-stack" aria-label="Tecnologías">
                {abierto.stack.map((tecnologia) => {
                  const archivo = logo(tecnologia);
                  return (
                    <li
                      key={tecnologia}
                      style={
                        archivo
                          ? ({
                              "--logo": `url("${ICONOS}${archivo}.svg")`,
                            } as CSSProperties)
                          : undefined
                      }
                    >
                      {archivo && (
                        <span className="proy-logo" aria-hidden="true" />
                      )}
                      {tecnologia}
                    </li>
                  );
                })}
              </ul>
              {abierto.repositorio && (
                <a
                  className="proy-codigo"
                  href={abierto.repositorio}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ver el código
                  <span className="proy-oculto"> en GitHub</span>
                  <Icono nombre="diagonal" />
                </a>
              )}
            </div>
            {abierto.landing && (
              <figure className="proy-landing">
                <img src={abierto.landing.src} alt={abierto.landing.alt} />
              </figure>
            )}
          </div>
        </dialog>
      )}
    {/* Al final, una luz crece desde abajo hasta llenar la pantalla de
          blanco; Cierre llega por encima con ese mismo blanco. */}
      <div className="proy-velo" aria-hidden="true">
        <span className="proy-luz" />
      </div>
    </section>
  );
}
