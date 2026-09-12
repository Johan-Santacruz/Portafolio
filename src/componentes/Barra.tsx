import { useEffect, useRef, useState } from "react";
import { perfil } from "../datos/perfil";
import { useTema } from "../ganchos/useTema";
import { Icono } from "./Icono";
import "./Barra.css";
const SECCIONES = [
  { id: "proyectos", texto: "Proyectos" },
  { id: "enfoque", texto: "Enfoque" },
  { id: "stack", texto: "Stack" },
  { id: "contacto", texto: "Hablemos" },
];
export function Barra() {
  const { alternar } = useTema();
  const [abierto, setAbierto] = useState(false);
  const [activa, setActiva] = useState("");
  const botonMenu = useRef<HTMLButtonElement>(null);
  const navegacion = useRef<HTMLElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas)
          if (entrada.isIntersecting) setActiva(entrada.target.id);
      },
      { rootMargin: "-15% 0px -55% 0px", threshold: 0 },
    );
    for (const { id } of SECCIONES) {
      const elemento = document.getElementById(id);
      if (elemento) observer.observe(elemento);
    }
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!abierto) return;
    navegacion.current?.querySelector("a")?.focus();
    const cerrar = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAbierto(false);
        botonMenu.current?.focus();
      }
    };
    const escritorio = window.matchMedia("(min-width: 761px)");
    const alCambiar = () => {
      if (escritorio.matches) setAbierto(false);
    };
    document.addEventListener("keydown", cerrar);
    escritorio.addEventListener("change", alCambiar);
    return () => {
      document.removeEventListener("keydown", cerrar);
      escritorio.removeEventListener("change", alCambiar);
    };
  }, [abierto]);
  return (
    <header
      className="barra"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setAbierto(false);
      }}
    >
      <div className="envoltorio barra-interior">
        <a
          className="marca"
          href="#top"
          onClick={() => setAbierto(false)}
          aria-label={`${perfil.nombreCorto}, inicio`}
        >
          <span className="monograma" aria-hidden="true">
            jb<span>.</span>
          </span>
          <span className="marca-nombre">
            Johan Balanta<span>Ingeniero de software</span>
          </span>
        </a>
        <nav
          ref={navegacion}
          id="navegacion"
          className={`nav ${abierto ? "nav-abierta" : ""}`}
          aria-label="Navegación principal"
        >
          {SECCIONES.map((seccion) => (
            <a
              key={seccion.id}
              href={`#${seccion.id}`}
              aria-current={activa === seccion.id ? "location" : undefined}
              onClick={() => {
                setAbierto(false);
                setActiva(seccion.id);
              }}
            >
              {seccion.texto}
            </a>
          ))}
        </nav>
        <div className="barra-acciones">
          <button
            type="button"
            className="boton-icono boton-tema"
            onClick={alternar}
            aria-label="Cambiar tema"
            title="Cambiar tema"
          >
            <Icono nombre="sol" className="icono-sol" />
            <Icono nombre="luna" className="icono-luna" />
          </button>
          <button
            ref={botonMenu}
            type="button"
            className="boton-icono boton-menu"
            aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={abierto}
            aria-controls="navegacion"
            onClick={() => setAbierto(!abierto)}
          >
            <Icono nombre={abierto ? "cerrar" : "menu"} />
          </button>
        </div>
      </div>
    </header>
  );
}
