import { useEffect, useRef, useState } from "react";
import { perfil } from "../datos/perfil";
import { trabajos } from "../datos/trabajos";
import type { Trabajo } from "../datos/trabajos";
import { Icono } from "./Icono";
import {
  useProfundidad,
  useRevelarCampana,
  useSalidaPortada,
  useVideoEnVista,
} from "../ganchos/useCampana";
import "./Campana.css";

type Ventana = "presentacion" | "precios" | null;
const MEDIA = `${import.meta.env.BASE_URL}media/`;
const principios = [
  ["01", "Claridad", "Interfaces que se entienden desde el primer momento."],
  ["02", "Criterio", "Datos validados antes de convertirse en decisiones."],
  ["03", "Propósito", "Tecnología que responde a una necesidad real."],
];

const [destacado, ...resto] = trabajos;

export function Campana() {
  useRevelarCampana();
  const { video, zona: hero, reducido } = useVideoEnVista<HTMLElement>();
  const {
    video: videoTinta,
    zona: panelTinta,
    reducido: tintaReducida,
  } = useVideoEnVista<HTMLDivElement>();
  useSalidaPortada(hero);
  useProfundidad();
  const [ventana, setVentana] = useState<Ventana>(null);
  const [videoListo, setVideoListo] = useState(false);
  const dialogo = useRef<HTMLDialogElement>(null);
  const activador = useRef<HTMLElement | null>(null);
  const [landing, setLanding] = useState<Trabajo | null>(null);
  const dialogoLanding = useRef<HTMLDialogElement>(null);

  function abrir(tipo: Exclude<Ventana, null>) {
    activador.current = document.activeElement as HTMLElement;
    setVentana(tipo);
  }
  function cerrar() {
    dialogo.current?.close();
  }
  function abrirLanding(trabajo: Trabajo) {
    activador.current = document.activeElement as HTMLElement;
    setLanding(trabajo);
  }
  function cerrarLanding() {
    dialogoLanding.current?.close();
  }

  useEffect(() => {
    if (!landing) return;
    const dialog = dialogoLanding.current;
    const overflowAnterior = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflowAnterior;
    };
  }, [landing]);

  useEffect(() => {
    if (!ventana) return;
    const dialog = dialogo.current;
    const overflowAnterior = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflowAnterior;
    };
  }, [ventana]);

  return (
    <>
      <a className="saltar" href="#contenido">
        Saltar al contenido
      </a>
      <main id="contenido" tabIndex={-1}>
        <section
          ref={hero}
          className="campana-hero"
          id="top"
          aria-labelledby="titulo-hero"
        >
          <img
            className="hero-poster"
            src={`${MEDIA}flujo-poster.jpg`}
            alt=""
            fetchPriority="high"
          />
          <video
            ref={video}
            className={`hero-video ${videoListo && !reducido ? "video-listo" : ""}`}
            poster={`${MEDIA}flujo-poster.jpg`}
            autoPlay={!reducido}
            muted
            loop
            playsInline
            preload={reducido ? "none" : "metadata"}
            aria-hidden="true"
            onPlaying={() => setVideoListo(true)}
            onError={() => setVideoListo(false)}
            src={`${MEDIA}flujo-loop.mp4`}
          />
          <div className="hero-velo" aria-hidden="true" />
          <header className="campana-header">
            <a
              className="campana-marca"
              href="#top"
              aria-label={`${perfil.nombreCorto}, inicio`}
            >
              <span className="logo-jb" aria-hidden="true">
                jb<span>.</span>
              </span>
              <span className="marca-descriptor">
                Johan Balanta<span>Ingeniería de software</span>
              </span>
            </a>
            <nav className="campana-nav" aria-label="Navegación principal">
              <button onClick={() => abrir("presentacion")}>
                Presentación
              </button>
              <a href="#trabajos">Trabajos</a>
              <button onClick={() => abrir("precios")}>
                Precios <Icono nombre="diagonal" />
              </button>
            </nav>
          </header>
          <div className="hero-contenido">
            <p className="rotulo" data-aparicion>
              Ideas claras. Sistemas con intención.
            </p>
            <h1 className="section-title" id="titulo-hero" data-aparicion>
              Tu idea toma
              <br />
              <em>forma.</em>
            </h1>
            <p className="hero-copy" data-aparicion>
              Diseño y desarrollo experiencias digitales
              <br className="salto-desktop" /> que convierten lo complejo en
              algo natural.
            </p>
            <a className="accion accion-lima" href="#contacto" data-aparicion>
              Construyamos tu idea <Icono nombre="diagonal" />
            </a>
          </div>
          <div className="hero-pie rotulo">
            <span>PORTAFOLIO / 2026</span>
            <a href="#enfoque">
              SOFTWARE CON PROPÓSITO <span aria-hidden="true">↓</span>
            </a>
          </div>
        </section>

        <section
          className="campana-editorial margen"
          id="enfoque"
          aria-labelledby="titulo-editorial"
        >
          <div className="editorial-intro">
            <p className="rotulo" data-aparicion>
              01 / Ingeniería con intención
            </p>
            <h2 className="section-title" id="titulo-editorial" data-aparicion>
              Menos fricción.
              <br />
              <em>Más intención.</em>
            </h2>
            <div className="editorial-copy" data-aparicion>
              <p>
                Un buen sistema se siente simple. Detrás hay decisiones
                cuidadas: cómo se captura un dato, cómo se valida y cómo lo vive
                una persona.
              </p>
              <button
                className="enlace-abierto"
                onClick={() => abrir("presentacion")}
              >
                Conoce mi enfoque <Icono nombre="diagonal" />
              </button>
            </div>
          </div>
          <div className="editorial-geometria">
            <div
              className="plano"
              ref={panelTinta}
              data-aparicion
              role="img"
              aria-label="Tinta negra expandiéndose en agua: lo complejo encontrando su forma"
            >
              <div className="plano-cota rotulo">
                <span>FIG. 01</span>
                <span>DISEÑAR DESDE DENTRO</span>
              </div>
              <div className="plano-marco">
                <video
                  ref={videoTinta}
                  className="plano-video"
                  poster={`${MEDIA}tinta-poster.jpg`}
                  src={`${MEDIA}tinta-loop.mp4`}
                  autoPlay={!tintaReducida}
                  muted
                  loop
                  playsInline
                  preload="none"
                  aria-hidden="true"
                />
              </div>
              <div className="plano-pie rotulo">
                <span>CLARIDAD / CRITERIO / PROPÓSITO</span>
                <span>↗</span>
              </div>
            </div>
            <div className="filas-principios">
              {principios.map(([numero, nombre, texto]) => (
                <div className="fila-principio" key={numero} data-aparicion>
                  <span className="rotulo">{numero}</span>
                  <h3>{nombre}</h3>
                  <p>{texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          className="campana-trabajos margen"
          id="trabajos"
          aria-labelledby="titulo-trabajos"
        >
          <div className="trabajos-cabecera">
            <p className="rotulo" data-aparicion>
              02 / Trabajo seleccionado
            </p>
            <span className="rotulo" data-aparicion>
              {trabajos.length} PROYECTOS
            </span>
          </div>
          <h2 className="section-title" id="titulo-trabajos" data-aparicion>
            El trabajo
            <br />
            <em>habla por sí solo.</em>
          </h2>

          <article className="trabajo-destacado" data-aparicion>
            <figure className="trabajo-galeria">
              {destacado.capturas?.map((captura, i) => (
                <img
                  key={captura.src}
                  src={captura.src}
                  alt={captura.alt}
                  loading="lazy"
                  className={i === 0 ? "captura-principal" : "captura-apoyo"}
                />
              ))}
              <figcaption className="rotulo">
                {destacado.nombre} · {destacado.contexto}
              </figcaption>
            </figure>
            <div className="trabajo-cuerpo">
              <h3>{destacado.nombre}</h3>
              <p className="trabajo-resumen">{destacado.resumen}</p>
              <p className="trabajo-descripcion">{destacado.descripcion}</p>
              <dl className="trabajo-ficha">
                <div>
                  <dt className="rotulo">Rol</dt>
                  <dd>{destacado.rol}</dd>
                </div>
                <div>
                  <dt className="rotulo">Periodo</dt>
                  <dd>{destacado.periodo}</dd>
                </div>
              </dl>
              <ul className="trabajo-stack" aria-label="Tecnologías">
                {destacado.stack.map((pieza) => (
                  <li key={pieza}>{pieza}</li>
                ))}
              </ul>
              {destacado.landing && (
                <button
                  className="enlace-abierto ver-landing"
                  onClick={() => abrirLanding(destacado)}
                >
                  {destacado.landing.etiqueta}
                  <span className="visualmente-oculto">
                    {" "}
                    de {destacado.nombre}
                  </span>
                  <Icono nombre="diagonal" />
                </button>
              )}
            </div>
          </article>

          <ol className="trabajos-tarjetas">
            {resto.map((trabajo, i) => (
              <li key={trabajo.id} data-aparicion>
                <article>
                  {trabajo.capturas?.[0] && (
                    <img
                      className="tarjeta-imagen"
                      src={trabajo.capturas[0].src}
                      alt={trabajo.capturas[0].alt}
                      loading="lazy"
                    />
                  )}
                  <div className="tarjeta-cabecera">
                    <span className="rotulo trabajo-indice">0{i + 2}</span>
                    <span className="rotulo trabajo-contexto">
                      {trabajo.contexto} · {trabajo.periodo}
                    </span>
                  </div>
                  <h3>{trabajo.nombre}</h3>
                  <p className="trabajo-resumen">{trabajo.resumen}</p>
                  <p className="trabajo-descripcion">{trabajo.descripcion}</p>
                  <ul className="trabajo-stack" aria-label="Tecnologías">
                    {trabajo.stack.map((pieza) => (
                      <li key={pieza}>{pieza}</li>
                    ))}
                  </ul>
                  <div className="tarjeta-acciones">
                    {trabajo.landing && (
                      <button
                        className="enlace-abierto ver-landing"
                        onClick={() => abrirLanding(trabajo)}
                      >
                        {trabajo.landing.etiqueta}
                        <span className="visualmente-oculto">
                          {" "}
                          de {trabajo.nombre}
                        </span>
                        <Icono nombre="diagonal" />
                      </button>
                    )}
                    {trabajo.repositorio && (
                      <a
                        className="enlace-abierto tarjeta-enlace"
                        href={trabajo.repositorio}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Ver el código
                        <span className="visualmente-oculto">
                          {" "}
                          de {trabajo.nombre} en GitHub
                        </span>
                        <Icono nombre="diagonal" />
                      </a>
                    )}
                  </div>
                </article>
              </li>
            ))}
          </ol>
        </section>

        <section
          className="campana-cierre"
          id="contacto"
          aria-labelledby="titulo-cierre"
        >
          <div className="circulos-cierre" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <div className="cierre-contenido">
            <p className="rotulo" data-aparicion>
              03 / La siguiente idea
            </p>
            <h2 className="section-title" id="titulo-cierre" data-aparicion>
              Lo que imaginas
              <br />
              <em>empieza aquí.</em>
            </h2>
            <p className="cierre-copy" data-aparicion>
              Tú pones la idea. Yo, el criterio para construirla.
            </p>
            <div className="cierre-acciones" data-aparicion>
              <a
                className="accion accion-lima"
                href={`mailto:${perfil.correo}`}
              >
                Hablemos de tu proyecto <Icono nombre="diagonal" />
              </a>
              <button
                className="enlace-abierto"
                onClick={() => abrir("precios")}
              >
                Consultar precios <Icono nombre="diagonal" />
              </button>
            </div>
          </div>
          <footer className="campana-footer rotulo">
            <span>© {new Date().getFullYear()} JOHAN BALANTA</span>
            <span>CALI, COLOMBIA</span>
            <a href="#top">VOLVER ARRIBA ↑</a>
          </footer>
        </section>
      </main>

      {landing && (
        <dialog
          ref={dialogoLanding}
          className="ventana-landing"
          aria-labelledby="titulo-landing"
          onClose={() => {
            setLanding(null);
            const previo = activador.current;
            requestAnimationFrame(() => previo?.focus());
          }}
          onClick={(event) => {
            // Pulsar fuera del recuadro cierra, igual que en la otra ventana.
            if (event.target === event.currentTarget) {
              const r = event.currentTarget.getBoundingClientRect();
              if (
                event.clientX < r.left ||
                event.clientX > r.right ||
                event.clientY < r.top ||
                event.clientY > r.bottom
              )
                cerrarLanding();
            }
          }}
        >
          <div className="landing-superior">
            <div>
              <span className="rotulo">Página completa</span>
              <h2 id="titulo-landing">{landing.nombre}</h2>
            </div>
            <button
              className="cerrar-ventana"
              aria-label="Cerrar"
              onClick={cerrarLanding}
              autoFocus
            >
              <Icono nombre="cerrar" />
            </button>
          </div>
          <div className="landing-lienzo">
            {landing.landing && (
              <img src={landing.landing.src} alt={landing.landing.alt} />
            )}
          </div>
        </dialog>
      )}

      <dialog
        ref={dialogo}
        className="ventana-campana"
        aria-labelledby="titulo-ventana"
        onClose={() => {
          setVentana(null);
          const previo = activador.current;
          requestAnimationFrame(() => previo?.focus());
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            const r = event.currentTarget.getBoundingClientRect();
            if (
              event.clientX < r.left ||
              event.clientX > r.right ||
              event.clientY < r.top ||
              event.clientY > r.bottom
            )
              cerrar();
          }
        }}
      >
        <div className="ventana-superior">
          <span className="rotulo">
            {ventana === "presentacion"
              ? "DETRÁS DEL CÓDIGO"
              : "CADA IDEA, SU ALCANCE"}
          </span>
          <button
            className="cerrar-ventana"
            aria-label="Cerrar ventana"
            onClick={cerrar}
            autoFocus
          >
            <Icono nombre="cerrar" />
          </button>
        </div>
        {ventana === "presentacion" ? (
          <>
            <h2 id="titulo-ventana">
              Hola, soy Johan.
              <br />
              <em>Construyo con intención.</em>
            </h2>
            <p className="ventana-descripcion">
              {perfil.nombre}. {perfil.rol} en {perfil.ubicacion}.
            </p>
            <p className="ventana-descripcion">{perfil.tesis}</p>
            <div className="ventana-fila">
              <span>Backend</span>
              <span>Python · FastAPI</span>
            </div>
            <div className="ventana-fila">
              <span>Frontend</span>
              <span>React · TypeScript</span>
            </div>
            <div className="ventana-fila">
              <span>Disponibilidad</span>
              <span>Prácticas y proyectos por contrato</span>
            </div>
          </>
        ) : (
          <>
            <h2 id="titulo-ventana">
              Una inversión
              <br />
              <em>a la medida de tu idea.</em>
            </h2>
            <p className="ventana-descripcion">
              El precio depende del alcance, las integraciones y los tiempos de
              cada proyecto. Las tarifas se publicarán aquí próximamente.
            </p>
            <div className="ventana-fila">
              <span>Desarrollo web</span>
              <span>Por definir</span>
            </div>
            <div className="ventana-fila">
              <span>Software a medida</span>
              <span>Por definir</span>
            </div>
            <div className="ventana-fila">
              <span>Automatización</span>
              <span>Por definir</span>
            </div>
          </>
        )}
        <a className="accion accion-tinta" href={`mailto:${perfil.correo}`}>
          Conversemos <Icono nombre="diagonal" />
        </a>
      </dialog>
    </>
  );
}
