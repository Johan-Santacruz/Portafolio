import type { CSSProperties } from "react";
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
          {[0, 0.3, 1].map((f) => (
            <span
              key={f}
              className="parada"
              style={{ top: `calc(var(--recorrido) * ${f})` }}
              aria-hidden="true"
            />
          ))}
          <div className="hero-fijo">
            <div className="hero-retrato">
              <Retrato />
            </div>
            {/* Entra por el lado libre cuando la figura ya se ha ido al otro
                (ver --avance en el CSS). */}
            {/* Terminal: al bajar se abre y teclea tres órdenes; sus salidas
                son el nombre, el rol y las áreas. Cada línea tiene su tramo
                del recorrido (--ini, --fin) y todo sale de --avance. */}
            <div className="hero-terminal">
              <div className="term-barra" aria-hidden="true">
                <span className="term-luces">
                  <i />
                  <i />
                  <i />
                </span>
                <span>johan@portafolio: ~</span>
              </div>
              <div className="term-cuerpo">
                <Orden texto="whoami" ini={0.56} fin={0.61} />
                <h1
                  id="titulo-hero"
                  className="term-salida term-nombre"
                  style={{ "--ini": 0.62 } as CSSProperties}
                >
                  Johan Santacruz
                </h1>
                <Orden texto="cat rol.txt" ini={0.65} fin={0.71} />
                <p
                  className="term-salida term-rol"
                  style={{ "--ini": 0.72 } as CSSProperties}
                >
                  Desarrollador Full-Stack
                  <br />
                  IA Engineer &amp; Automatización
                </p>
                <Orden texto="ls enfoque/" ini={0.75} fin={0.81} />
                <p
                  className="term-salida term-lista"
                  style={{ "--ini": 0.82 } as CSSProperties}
                >
                  <span>web/</span>
                  <span>ia/</span>
                  <span>automatizacion/</span>
                </p>
                <p
                  className="term-orden term-espera"
                  style={{ "--ini": 0.85 } as CSSProperties}
                  aria-hidden="true"
                >
                  <span className="term-prompt">~ $</span>
                  <span className="term-cursor" />
                </p>
              </div>
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

/** Una orden de la terminal que se teclea letra a letra entre `ini` y `fin`
 *  del recorrido de la portada. Es decorativa: la información está en las
 *  salidas. */
function Orden({ texto, ini, fin }: { texto: string; ini: number; fin: number }) {
  return (
    <p
      className="term-orden"
      style={{ "--ini": ini, "--fin": fin, "--letras": texto.length } as CSSProperties}
      aria-hidden="true"
    >
      <span className="term-prompt">~ $</span>
      <span className="term-tecleo">{texto}</span>
    </p>
  );
}
