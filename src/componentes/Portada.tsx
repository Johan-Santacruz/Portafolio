import { perfil } from "../datos/perfil";
import { Icono } from "./Icono";
import "./Portada.css";

/**
 * Portada tipográfica: sin ilustración ni cursivas. El peso lo lleva el
 * titular; debajo, una sola acción principal y un enlace secundario.
 * Cada bloque entra escalonado al cargar (ver `aparecer` en el CSS).
 */
export function Portada() {
  return (
    <section className="portada" id="top" aria-labelledby="titulo-portada">
      <p className="portada-estado mono">
        <span>
          <i className="punto" /> Disponible para nuevos proyectos
        </span>
        <span>{perfil.ubicacion}</span>
      </p>
      <h1 id="titulo-portada">{perfil.titular}</h1>
      <div className="portada-inferior">
        <p className="tesis">{perfil.tesis}</p>
        <div className="portada-acciones">
          <a className="boton boton-primario" href="#proyectos">
            Ver proyectos <Icono nombre="flecha" />
          </a>
          <a className="enlace-texto" href="#contacto">
            Hablemos
          </a>
        </div>
      </div>
    </section>
  );
}
