import { useEffect, useRef, useState } from "react";
import { useIdioma } from "../idioma/idioma";
import { textos } from "../idioma/textos";
import "./Cabecera.css";

/** `corto` es lo que se lee en pantallas estrechas, donde no caben cinco
 *  nombres largos; el nombre completo sigue siendo el accesible. */
const APARTADOS = textos.navegacion;

/**
 * Cabecera flotante: una píldora de acero con los apartados. El activo lleva
 * un indicador lima que se desliza hasta él; se decide con el scroll (el
 * último apartado cuyo borde superior ha pasado el 40 % de la pantalla).
 */
export function Cabecera() {
  const { idioma, cambiar, di } = useIdioma();
  const [activo, setActivo] = useState(0);
  const enlaces = useRef<(HTMLAnchorElement | null)[]>([]);
  const [marca, setMarca] = useState({ x: 0, ancho: 0 });

  useEffect(() => {
    let pendiente = false;
    const medir = () => {
      pendiente = false;
      const limite = window.innerHeight * 0.4;
      let i = 0;
      APARTADOS.forEach((a, n) => {
        const el = document.getElementById(a.id);
        if (el && el.getBoundingClientRect().top <= limite) i = n;
      });
      setActivo(i);
    };
    const alScroll = () => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(medir);
    };
    medir();
    window.addEventListener("scroll", alScroll, { passive: true });
    window.addEventListener("resize", alScroll);
    return () => {
      window.removeEventListener("scroll", alScroll);
      window.removeEventListener("resize", alScroll);
    };
  }, []);

  // El indicador se coloca bajo el enlace activo (también al cambiar de tamaño).
  useEffect(() => {
    const colocar = () => {
      const el = enlaces.current[activo];
      if (el) setMarca({ x: el.offsetLeft, ancho: el.offsetWidth });
    };
    colocar();
    document.fonts?.ready.then(colocar);
    window.addEventListener("resize", colocar);
    return () => window.removeEventListener("resize", colocar);
    // El idioma cambia el ancho de los nombres: hay que volver a medir.
  }, [activo, idioma]);

  return (
    <header className="cabecera">
      <nav aria-label={di(textos.apartados)}>
        <span
          className="cabecera-marca"
          aria-hidden="true"
          style={{ transform: `translateX(${marca.x}px)`, width: marca.ancho }}
        />
        {APARTADOS.map((a, i) => (
          <a
            key={a.id}
            ref={(el) => {
              enlaces.current[i] = el;
            }}
            href={`#${a.id}`}
            aria-label={di(a.largo)}
            aria-current={i === activo ? "location" : undefined}
          >
            <span className="cab-largo" aria-hidden="true">
              {di(a.largo)}
            </span>
            <span className="cab-corto" aria-hidden="true">
              {di(a.corto)}
            </span>
          </a>
        ))}
        {/* Al final de la píldora y tras un filo: no es un apartado más, es
            un interruptor. Dice a qué idioma lleva, no en cuál estás. */}
        <button
          className="cabecera-idioma"
          type="button"
          lang={idioma === "es" ? "en" : "es"}
          aria-label={di(textos.cambiarIdioma)}
          onClick={() => cambiar(idioma === "es" ? "en" : "es")}
        >
          {idioma === "es" ? "EN" : "ES"}
        </button>
      </nav>
    </header>
  );
}
