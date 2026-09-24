import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { perfil } from "../datos/perfil";
import { useIdioma } from "../idioma/idioma";
import { textos } from "../idioma/textos";
import { Retrato } from "./Retrato";
import { Cabecera } from "./Cabecera";
import { Herramientas } from "./Herramientas";
import { Proyectos } from "./Proyectos";
import { Trayectoria } from "./Trayectoria";
import { Cierre } from "./Cierre";
import "./Campana.css";

export function Campana() {
  const { di } = useIdioma();
  return (
    <>
      <a className="saltar" href="#contenido">
        {di(textos.saltar)}
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
            {/* Línea de comandos mínima, sin caja: la orden, lo que responde
                (el perfil de la hoja de vida, tecleado con el scroll) y el rol
                como comentario. El nombre completo es el título de la página
                para quien no la ve; a la vista va dentro del perfil. */}
            <div className="hero-cli">
              <Orden texto="whoami" ini={0.55} fin={0.6} />
              <h1 id="titulo-hero" className="solo-lector">
                {perfil.nombre}
              </h1>
              <Salida
                texto={di(perfil.presentacion)}
                enfasis={di(perfil.presentacionEnfasis)}
                ini={0.62}
                fin={0.8}
              />
              <p className="cli-rol">
                <span aria-hidden="true">// </span>
                {di(textos.rol1)}
                <br />
                <span aria-hidden="true">// </span>
                {di(textos.rol2)}
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

/**
 * Lo que responde una orden: un párrafo que se teclea letra a letra entre
 * `ini` y `fin` del recorrido. Cada letra va en su propio span, así el
 * párrafo ya está repartido en líneas desde el principio y no salta mientras
 * se escribe; las que faltan son transparentes y la primera de ellas hace de
 * cursor, un bloque lima. Al acabar queda el cursor parpadeando al final.
 * Los lectores de pantalla leen el texto entero, no letra a letra.
 */
function Salida({
  texto,
  enfasis,
  ini,
  fin,
}: {
  texto: string;
  enfasis?: string;
  ini: number;
  fin: number;
}) {
  const letras = Array.from(texto);
  const desde = enfasis ? texto.indexOf(enfasis) : -1;
  const hasta = desde < 0 ? -1 : desde + (enfasis?.length ?? 0);
  const total = letras.length;
  // Cuántas letras van escritas (--k), escrito solo cuando cambia. Si cada
  // letra lo calculara a partir de --avance, las casi 200 se recalculaban en
  // cada fotograma de la portada, y en un teléfono de gama media eso era
  // la mitad del tiempo de cada fotograma.
  const escritas = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const capa = escritas.current;
    const portada = capa?.closest("[data-recorrido]");
    if (!capa || !portada) return;
    let k = -1;
    const alAvanzar = (e: Event) => {
      const avance = (e as CustomEvent<number>).detail;
      const t = Math.min(1, Math.max(0, (avance - ini) / (fin - ini)));
      const nuevo = Math.ceil(t * total);
      if (nuevo === k) return;
      k = nuevo;
      capa.style.setProperty("--k", String(k));
    };
    portada.addEventListener("avance", alAvanzar);
    return () => portada.removeEventListener("avance", alAvanzar);
  }, [ini, fin, total]);
  return (
    <p
      className="cli-perfil"
      style={{ "--ini": ini, "--fin": fin, "--n": total } as CSSProperties}
    >
      <span className="solo-lector">{texto}</span>
      <span aria-hidden="true" ref={escritas}>
        {letras.map((letra, i) => (
          <span
            key={i}
            className={i >= desde && i < hasta ? "cli-fuerte" : undefined}
            style={{ "--i": i } as CSSProperties}
          >
            {letra}
          </span>
        ))}
        <span className="cli-cursor" />
      </span>
    </p>
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
