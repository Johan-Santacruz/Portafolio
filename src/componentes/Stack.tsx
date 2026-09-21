import type { CSSProperties } from "react";
import { stack } from "../datos/stack";
import { useIdioma } from "../idioma/idioma";
import "./Stack.css";
export function Stack() {
  const { di } = useIdioma();
  return (
    <section className="seccion" id="stack" aria-labelledby="titulo-stack">
      <div className="etiqueta-seccion mono" data-revelar="">
        <span>03 — Herramientas</span>
      </div>
      <div className="cabecera-seccion" data-revelar="">
        <h2 id="titulo-stack">Stack de trabajo</h2>
        <p>
          Un stack elegido para construir,
          <br />
          validar y llevar a producción.
        </p>
      </div>
      <div className="rejilla-stack">
        {stack.map((grupo, i) => (
          <div
            className="grupo-stack"
            key={grupo.id}
            data-revelar=""
            style={{ "--retraso": `${i * 100}ms` } as CSSProperties}
          >
            <span className="stack-indice mono" aria-hidden="true">
              0{i + 1}
            </span>
            <h3>{di(grupo.titulo)}</h3>
            <ul>
              {grupo.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
