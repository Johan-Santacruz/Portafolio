import type { CSSProperties } from "react";
import { Retrato } from "./Retrato";
import { Cabecera } from "./Cabecera";
import { Herramientas } from "./Herramientas";
import { Proyectos } from "./Proyectos";
import { Trayectoria } from "./Trayectoria";
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
            {/* Línea de comandos mínima, sin caja: la orden, el nombre que se
                teclea con el scroll y el rol como comentario. */}
            <div className="hero-cli">
              <Orden texto="whoami" ini={0.55} fin={0.6} />
              <h1 id="titulo-hero" className="cli-nombre">
                <span className="cli-tecleo" style={{ "--ini": 0.61, "--fin": 0.76, "--letras": 15 } as CSSProperties}>
                  Johan Santacruz
                </span>
                <span className="cli-cursor" aria-hidden="true" />
              </h1>
              <p className="cli-rol">
                <span aria-hidden="true">// </span>
                Ingeniero de Sistemas
                <br />
                <span aria-hidden="true">// </span>
                Full-Stack · IA Engineer · Automatización
              </p>
            </div>
          </div>
        </section>

        <Herramientas />
        <Proyectos />
        <Trayectoria />
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
