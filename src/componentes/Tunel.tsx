import { useEffect, useMemo, useRef } from "react";
import type { CSSProperties } from "react";
import { iconos, stack } from "../datos/stack";
import "./Tunel.css";

const ICONOS = `${import.meta.env.BASE_URL}iconos/`;

/**
 * Transición entre la portada y las herramientas: un túnel en 3D.
 *
 * La sección mide varias pantallas y su escena queda fija. Al bajar, la
 * «cámara» avanza: las placas de las herramientas vienen desde el fondo y
 * pasan a los lados, con rayos de velocidad. Al final aparece el recuento y
 * la escena se abre a la sección de herramientas.
 *
 * Todo sale de `--p` (0 a 1), que escribe este componente con el scroll; cada
 * placa calcula en CSS su profundidad y su opacidad. Con movimiento reducido
 * no hay túnel: solo el recuento.
 */

// Aleatorio con semilla: el mismo túnel en cada visita.
function azarConSemilla(semilla: number) {
  let s = semilla;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const herramientas = stack.flatMap((g) => g.items);

export function Tunel() {
  const seccion = useRef<HTMLElement>(null);

  // Dos vueltas de todas las herramientas, repartidas en espiral por el túnel.
  const placas = useMemo(() => {
    const azar = azarConSemilla(7);
    const lista = [...herramientas, ...herramientas];
    return lista.map((nombre, i) => {
      const angulo = i * 2.39996 + azar() * 0.4; // ángulo áureo: sin huecos
      const radio = 0.62 + azar() * 0.5;
      return {
        nombre,
        logo: iconos[nombre],
        cx: Math.cos(angulo) * radio, // fracción de medio ancho
        cy: Math.sin(angulo) * radio * 0.8,
        z0: -4200 + (i / lista.length) * 4000 + azar() * 120,
      };
    });
  }, []);

  useEffect(() => {
    const raiz = seccion.current;
    if (!raiz) return;
    let pendiente = false;
    const medir = () => {
      pendiente = false;
      const caja = raiz.getBoundingClientRect();
      const largo = caja.height - window.innerHeight;
      const p = largo > 0 ? Math.min(1, Math.max(0, -caja.top / largo)) : 0;
      raiz.style.setProperty("--p", p.toFixed(4));
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

  const total = herramientas.length;

  return (
    <section ref={seccion} className="tunel" aria-label={`${total} herramientas`}>
      <span className="parada" style={{ top: "calc(var(--recorrido) * 0.98)" }} aria-hidden="true" />
      <div className="tunel-fijo">
        <div className="tunel-rayos" aria-hidden="true" />
        <div className="tunel-escena" aria-hidden="true">
          {placas.map((p, i) => (
            <span
              key={i}
              className="tunel-placa"
              style={
                {
                  "--cx": p.cx.toFixed(3),
                  "--cy": p.cy.toFixed(3),
                  "--z0": p.z0.toFixed(0),
                  "--logo": p.logo ? `url("${ICONOS}${p.logo}.svg")` : "none",
                } as CSSProperties
              }
            >
              {p.logo && <i />}
              {p.nombre}
            </span>
          ))}
        </div>

        <div className="tunel-centro">
          <p className="tunel-orden" aria-hidden="true">
            <span className="tunel-prompt">~ $</span>
            <span className="tunel-tecleo">ls ./herramientas</span>
          </p>
          <p className="tunel-cuenta">
            <strong>{total}</strong>
            <span>herramientas · {stack.length} capas</span>
          </p>
        </div>
      </div>
    </section>
  );
}
