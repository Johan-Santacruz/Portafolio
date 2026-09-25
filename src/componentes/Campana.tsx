import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { perfil } from "../datos/perfil";
import { esCelular } from "../retrato/telefono";
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
  // Cada letra lleva su estado (data-e: «e» escrita, «c» la del cursor, sin
  // él por escribir), y al avanzar solo se tocan las que cambian: una o dos
  // por fotograma. Con un contador común (--k) del que dependían todas, cada
  // letra nueva recalculaba las casi 200, y al bajar deprisa con la rueda eso
  // pasaba en casi cada fotograma: en un portátil modesto se perdía uno de
  // cada seis.
  const escritas = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const capa = escritas.current;
    const portada = capa?.closest("[data-recorrido]");
    if (!capa || !portada) return;
    const spans = Array.from(capa.children) as HTMLElement[];
    const cursor = spans[total];
    const estado = (i: number, k: number) => (i < k ? "e" : i === k ? "c" : null);
    let k = -1;
    const escribir = (nuevo: number) => {
      const a = k < 0 ? 0 : Math.min(k, nuevo);
      const b = k < 0 ? total - 1 : Math.min(total - 1, Math.max(k, nuevo));
      for (let i = a; i <= b; i++) {
        const e = estado(i, nuevo);
        if (spans[i].getAttribute("data-e") === e) continue;
        if (e) spans[i].setAttribute("data-e", e);
        else spans[i].removeAttribute("data-e");
      }
      // Acabado el párrafo, el cursor se queda parpadeando detrás.
      cursor?.toggleAttribute("data-e", nuevo >= total);
      k = nuevo;
    };
    escribir(0);
    // Fuera de la pantalla, el cursor deja de parpadear (ver Campana.css).
    const vista = new IntersectionObserver(([e]) =>
      capa.toggleAttribute("data-lejos", !e.isIntersecting),
    );
    vista.observe(capa);
    const alAvanzar = (e: Event) => {
      const avance = (e as CustomEvent<number>).detail;
      const t = Math.min(1, Math.max(0, (avance - ini) / (fin - ini)));
      const nuevo = Math.ceil(t * total);
      if (nuevo !== k) escribir(nuevo);
    };
    portada.addEventListener("avance", alAvanzar);
    return () => {
      vista.disconnect();
      portada.removeEventListener("avance", alAvanzar);
    };
  }, [ini, fin, total]);
  // En el celular, entero y con un fundido: tecleado letra a letra, con el
  // scroll rápido del dedo cambiaba una letra en casi cada fotograma y las
  // casi 200 se recalculaban otra vez. El nombre, igual de en negrita.
  if (esCelular()) {
    return (
      <p
        className="cli-perfil cli-perfil-entero"
        style={{ "--ini": ini, "--fin": fin } as CSSProperties}
      >
        {desde < 0 ? (
          texto
        ) : (
          <>
            {texto.slice(0, desde)}
            <b>{texto.slice(desde, hasta)}</b>
            {texto.slice(hasta)}
          </>
        )}
        <span className="cli-cursor-entero" aria-hidden="true" />
      </p>
    );
  }
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
