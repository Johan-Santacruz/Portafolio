import { useEffect, useRef, useState } from "react";
import "./Cabecera.css";

/** `corto` es lo que se lee en pantallas estrechas, donde no caben cinco
 *  nombres largos; el nombre completo sigue siendo el accesible. */
const APARTADOS = [
  { id: "top", nombre: "Inicio", corto: "Inicio" },
  { id: "herramientas", nombre: "Herramientas", corto: "Stack" },
  { id: "proyectos", nombre: "Proyectos", corto: "Obra" },
  { id: "trayectoria", nombre: "Trayectoria", corto: "Perfil" },
  { id: "contacto", nombre: "Contacto", corto: "Contacto" },
];

/**
 * Cabecera flotante: una píldora de acero con los apartados. El activo lleva
 * un indicador lima que se desliza hasta él; se decide con el scroll (el
 * último apartado cuyo borde superior ha pasado el 40 % de la pantalla).
 */
export function Cabecera() {
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
  }, [activo]);

  return (
    <header className="cabecera">
      <nav aria-label="Apartados">
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
            aria-label={a.nombre}
            aria-current={i === activo ? "location" : undefined}
          >
            <span className="cab-largo" aria-hidden="true">
              {a.nombre}
            </span>
            <span className="cab-corto" aria-hidden="true">
              {a.corto}
            </span>
          </a>
        ))}
      </nav>
    </header>
  );
}
