import type { CSSProperties } from "react";
import { principios } from "../datos/enfoque";
import { Icono } from "./Icono";
import "./Enfoque.css";
export function Enfoque() {
  return (
    <section
      className="seccion enfoque"
      id="enfoque"
      aria-labelledby="titulo-enfoque"
    >
      <div className="etiqueta-seccion mono" data-revelar="">
        <span>02 — Enfoque</span>
      </div>
      <div className="cabecera-seccion" data-revelar="">
        <h2 id="titulo-enfoque">Cómo construyo</h2>
        <p>
          Tres principios que aplico
          <br />
          en cada proyecto.
        </p>
      </div>
      <div className="rejilla-enfoque">
        {principios.map((principio, i) => (
          <div
            key={principio.titulo}
            className="principio"
            data-revelar=""
            style={{ "--retraso": `${i * 120}ms` } as CSSProperties}
          >
            <div className="principio-superior">
              <Icono nombre={(["escudo", "codigo", "capas"] as const)[i]} />
              <span className="mono">0{i + 1}</span>
            </div>
            <h3>{principio.titulo}</h3>
            <p>{principio.texto}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
