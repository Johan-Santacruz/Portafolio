import { Retrato } from "./Retrato";
import { Cabecera } from "./Cabecera";
import { Herramientas } from "./Herramientas";
import { Proyectos } from "./Proyectos";
import { Cierre } from "./Cierre";
import "./Campana.css";

export function Campana() {
  return (
    <>
      <a className="saltar" href="#contenido">
        Saltar al contenido
      </a>
      <Cabecera />
      <main id="contenido" tabIndex={-1}>
        {/* La portada es un recorrido: mide 350svh y su contenido queda
            fijo mientras se baja. El retrato lee ese avance (data-recorrido)
            para revelar el alter ego y avanzar la secuencia. */}
        <section
          className="campana-hero"
          id="top"
          aria-labelledby="titulo-hero"
          data-recorrido
        >
          <div className="hero-fijo">
            <div className="hero-retrato">
              <Retrato />
            </div>
            {/* Entra por el lado libre cuando la figura ya se ha ido al otro
                (ver --avance en el CSS). */}
            <div className="hero-texto">
              <h1 id="titulo-hero">
                Johan
                <br />
                Santacruz
              </h1>
              <p className="hero-rol">
                <span className="hero-rol-texto">
                  Desarrollador Full-Stack
                  <br />
                  IA Engineer &amp; Automatización
                </span>
                <span className="hero-rol-cursor" aria-hidden="true" />
              </p>
            </div>
          </div>
        </section>

        <Herramientas />
        <Proyectos />
        <Cierre />
      </main>
    </>
  );
}
