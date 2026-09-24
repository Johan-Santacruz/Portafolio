import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { trabajos } from "../datos/trabajos";
import { reconocimientos } from "../datos/reconocimientos";
import type { Trabajo } from "../datos/trabajos";
import { iconos } from "../datos/stack";
import { useIdioma } from "../idioma/idioma";
import { textos } from "../idioma/textos";
import { Icono } from "./Icono";
import { vigilarCercania } from "../retrato/cercania";
import { esCelular } from "../retrato/telefono";
import "./Proyectos.css";

const ICONOS = `${import.meta.env.BASE_URL}iconos/`;
const RECONOCIMIENTOS = `${import.meta.env.BASE_URL}imagenes/reconocimientos/`;
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
  const { di } = useIdioma();
  const seccion = useRef<HTMLElement>(null);
  const fondo = useRef<HTMLVideoElement>(null);
  const dialogo = useRef<HTMLDialogElement>(null);
  const activador = useRef<HTMLElement | null>(null);
  const [abierto, setAbierto] = useState<Trabajo | null>(null);

  useEffect(() => {
    const raiz = seccion.current;
    if (!raiz) return;
    const filas = Array.from(raiz.querySelectorAll<HTMLElement>(".proy-fila"));
    // Los reconocimientos se encienden igual que los proyectos: con el
    // scroll, no solo al pasar el ratón. En un teléfono no hay ratón, y ahí
    // las vistas previas se quedaban siempre apagadas.
    const reconocidos = Array.from(
      raiz.querySelectorAll<HTMLElement>(".recon-lista li"),
    );
    let pendiente = false;
    const luces = new WeakMap<HTMLElement, string>();

    const medir = () => {
      pendiente = false;
      const alto = window.innerHeight;
      const centro = alto / 2;
      const caja = raiz.getBoundingClientRect();
      const limitar = (v: number) => Math.min(1, Math.max(0, v));
      // Cubierta: la sección se desliza sobre la anterior; de 0 al asomar por
      // abajo a 1 al llenar la pantalla (las estelas se encienden con ella).
      const cubre = limitar(1 - caja.top / alto);
      // Leer todas las cajas antes de tocar estilos: alternar lectura y
      // escritura por fila forzaba un recálculo por cada proyecto.
      const medidas = [...filas, ...reconocidos].map((fila, i) => {
        const cajaFila = fila.getBoundingClientRect();
        const alcance = alto * (i < filas.length ? 0.22 : 0.34);
        const d = Math.abs(cajaFila.top + cajaFila.height / 2 - centro);
        return { fila, luz: Math.max(0, 1 - d / alcance).toFixed(3) };
      });
      raiz.style.setProperty("--cubre", cubre.toFixed(4));
      // Mientras entra, el contenido se queda quieto en la pantalla y crece
      // desde el centro: parece que sale del fondo del agujero negro.
      raiz.toggleAttribute("data-emerge", cubre > 0 && cubre < 0.999);
      for (const { fila, luz } of medidas) {
        if (luces.get(fila) === luz) continue;
        luces.set(fila, luz);
        fila.style.setProperty("--luz", luz);
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
    // En el celular se queda en su imagen fija (el póster): descodificar
    // vídeo detrás de todo gastaba batería y fluidez sin aportar tanto.
    const celular = esCelular();
    const observador = new IntersectionObserver(([entrada]) => {
      if (entrada.isIntersecting && !reducido.matches && !celular) {
        if (!video.getAttribute("src")) video.src = `${MEDIA}estelas.mp4`;
        void video.play().catch(() => {});
      }
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
          poster={`${MEDIA}estelas-poster.jpg`}
          muted
          loop
          playsInline
          preload="none"
        />
      </div>

      {/* Emerge desde el fondo del agujero negro, en la misma pantalla: no
          hay que bajar para ver los proyectos. */}
      <div className="proy-emerge">
        <header className="proy-cabecera">
          <p className="proy-rotulo">
            <span aria-hidden="true">~ $ </span>
            {di(textos.ordenProyectos)}
          </p>
          <h2 id="titulo-proyectos">{di(textos.proyectosTitulo)}</h2>
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
            <span className="proy-lado proy-contexto">{di(t.contexto)}</span>
            <button className="proy-nombre" onClick={() => abrir(t)}>
              {t.nombre}
              <span className="proy-oculto">{di(textos.verProyecto)}</span>
            </button>
            <span className="proy-lado proy-periodo">{t.periodo}</span>
          </li>
        ))}
        </ol>

        {/* Lo que han dicho otros. No son proyectos: cierran el capítulo como
            su respaldo, con el medio delante porque ahí está el valor. */}
        <section className="proy-pie" aria-labelledby="titulo-reconocimientos">
          <header className="recon-cabecera">
            <p className="recon-rotulo">{di(textos.reconocimientosRotulo)}</p>
            <h3 id="titulo-reconocimientos">{di(textos.reconocimientosTitulo)}</h3>
          </header>
          <ul className="recon-lista">
            {reconocimientos.map((r) => {
              const red = r.red === "instagram" ? "Instagram" : "LinkedIn";
              return (
                <li key={r.id} style={{ "--luz": 0 } as CSSProperties}>
                  <a href={r.url} target="_blank" rel="noreferrer">
                    <img
                      className="recon-foto"
                      src={`${RECONOCIMIENTOS}${r.imagen}`}
                      alt={di(r.alt)}
                      loading="lazy"
                      decoding="async"
                      width="400"
                      height="400"
                    />
                    <span className="recon-medio">{r.medio}</span>
                    <span className="recon-titulo">{di(r.titulo)}</span>
                    <span className="recon-meta" aria-hidden="true">
                      <span>{red}</span>
                      <span>{di(r.fecha)}</span>
                    </span>
                    <span className="proy-oculto">{` · ${di(textos.verPublicacion)} ${red}, ${di(r.fecha)}`}</span>
                    <Icono nombre="diagonal" />
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

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
                {di(abierto.contexto)} / {abierto.periodo}
              </span>
              <h2 id="titulo-ventana-proyecto">{abierto.nombre}</h2>
            </div>
            <button
              className="proy-cerrar"
              aria-label={di(textos.cerrar)}
              onClick={cerrar}
              autoFocus
            >
              <Icono nombre="cerrar" />
            </button>
          </div>
          <div className="proy-ventana-cuerpo">
            <div className="proy-ficha">
              <p className="proy-resumen">{di(abierto.resumen)}</p>
              <p className="proy-descripcion">{di(abierto.descripcion)}</p>
              {!abierto.rolPorConfirmar && (
                <p className="proy-rol">
                  <span>{di(textos.rol)}</span>
                  {di(abierto.rol)}
                </p>
              )}
              <ul className="proy-stack" aria-label={di(textos.tecnologias)}>
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
              {(abierto.sitio || abierto.repositorio) && (
                <div className="proy-enlaces">
                  {abierto.sitio && (
                    <a href={abierto.sitio} target="_blank" rel="noreferrer">
                      {di(textos.verSitio)}
                      <Icono nombre="diagonal" />
                    </a>
                  )}
                  {abierto.repositorio && (
                    <a href={abierto.repositorio} target="_blank" rel="noreferrer">
                      {di(textos.verCodigo)}
                      <span className="proy-oculto">{di(textos.enGitHub)}</span>
                      <Icono nombre="diagonal" />
                    </a>
                  )}
                </div>
              )}
            </div>
            {abierto.landing && (
              <figure className="proy-landing">
                <img src={abierto.landing.src} alt={di(abierto.landing.alt)} />
              </figure>
            )}
          </div>
        </dialog>
      )}
    </section>
  );
}
