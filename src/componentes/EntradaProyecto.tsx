import type { CSSProperties } from "react";
import type { Proyecto } from "../datos/proyectos";
import { Prosa } from "./Prosa";
import { VisualProyecto } from "./VisualProyecto";
import { Icono } from "./Icono";
import "./EntradaProyecto.css";
export function EntradaProyecto({
  proyecto,
  indice,
}: {
  proyecto: Proyecto;
  indice: number;
}) {
  const enlaces =
    proyecto.enlaces?.filter(
      (enlace) =>
        enlace.url !== "#" && !enlace.etiqueta.includes("[pendiente]"),
    ) ?? [];
  return (
    <article
      className="entrada"
      data-revelar=""
      style={{ "--retraso": `${(indice % 2) * 120}ms` } as CSSProperties}
    >
      <VisualProyecto id={proyecto.id} />
      <div className="entrada-contenido">
        <div className="entrada-meta mono">
          <span>
            {String(indice + 1).padStart(2, "0")} / {proyecto.contexto}
          </span>
          <span className={`estado estado-${proyecto.estado}`}>
            {proyecto.estadoTexto}
          </span>
        </div>
        <h3>{proyecto.nombre}</h3>
        <p className="subtitulo">{proyecto.subtitulo}</p>
        <ul className="tecnologias" aria-label="Tecnologías principales">
          {proyecto.tecnologias.slice(0, 4).map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <details className="detalle-proyecto">
          <summary>
            <span className="detalle-abrir">Explorar proyecto</span>
            <span className="detalle-cerrar">Cerrar detalles</span>
            <Icono nombre="diagonal" />
          </summary>
          <div className="cuerpo">
            <dl className="meta">
              <div>
                <dt>Periodo</dt>
                <dd>{proyecto.periodo}</dd>
              </div>
              <div>
                <dt>Mi rol</dt>
                <dd>{proyecto.rol}</dd>
              </div>
            </dl>
            {proyecto.parrafos.map((parrafo, i) => (
              <Prosa key={i} texto={parrafo} />
            ))}
            {proyecto.destacado && (
              <p className="destacado">{proyecto.destacado}</p>
            )}
            {proyecto.parrafosFinales?.map((parrafo, i) => (
              <Prosa key={i} texto={parrafo} />
            ))}
            <ul className="tecnologias" aria-label="Stack completo">
              {proyecto.tecnologias.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            {enlaces.length > 0 && (
              <div className="enlaces-proyecto">
                {enlaces.map((enlace) => (
                  <a
                    key={enlace.etiqueta}
                    href={enlace.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {enlace.etiqueta}
                    <Icono nombre="diagonal" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </details>
      </div>
    </article>
  );
}
