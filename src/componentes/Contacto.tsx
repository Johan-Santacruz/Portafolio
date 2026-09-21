import { perfil } from "../datos/perfil";
import { useIdioma } from "../idioma/idioma";
import { Icono } from "./Icono";
import "./Contacto.css";
export function Contacto() {
  const { di } = useIdioma();
  const enlaces = perfil.enlaces.filter(
    (enlace) => enlace.url !== "#" && !enlace.etiqueta.es.includes("[pendiente]"),
  );
  return (
    <section
      className="contacto"
      id="contacto"
      aria-labelledby="titulo-contacto"
    >
      <div className="contacto-superior mono" data-revelar="">
        <span>04 — Contacto</span>
        <span>
          <i className="punto" /> Abierto a oportunidades
        </span>
      </div>
      <div className="contacto-rejilla" data-revelar="">
        <div>
          <h2 id="titulo-contacto">{di(perfil.invitacion.titulo)}</h2>
          <p>{di(perfil.invitacion.texto)}</p>
        </div>
      </div>
      <div className="contacto-inferior" data-revelar="">
        <a className="correo" href={`mailto:${perfil.correo}`}>
          {perfil.correo}
          <Icono nombre="diagonal" />
        </a>
        <div className="perfiles">
          {enlaces.map((enlace) => (
            <a
              key={enlace.etiqueta.es}
              href={enlace.url}
              target="_blank"
              rel="noreferrer"
            >
              {di(enlace.etiqueta)}
              <Icono nombre="diagonal" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
