import { proyectos } from "../datos/proyectos";
import { EntradaProyecto } from "./EntradaProyecto";
import "./Bitacora.css";
export function Bitacora() {
  return (
    <section
      className="seccion"
      id="proyectos"
      aria-labelledby="titulo-proyectos"
    >
      <div className="etiqueta-seccion mono" data-revelar="">
        <span>01 — Proyectos</span>
      </div>
      <div className="cabecera-seccion" data-revelar="">
        <h2 id="titulo-proyectos">Trabajo seleccionado</h2>
        <p>
          Cuatro proyectos donde la validación del dato
          <br />
          fue el problema central.
        </p>
      </div>
      <div className="bitacora">
        {proyectos.map((proyecto, indice) => (
          <EntradaProyecto
            key={proyecto.id}
            proyecto={proyecto}
            indice={indice}
          />
        ))}
      </div>
    </section>
  );
}
