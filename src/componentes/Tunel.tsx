import { useMemo } from "react";
import type { CSSProperties } from "react";
import { iconos, stack } from "../datos/stack";
import { useIdioma } from "../idioma/idioma";
import { textos } from "../idioma/textos";
import "./Tunel.css";

const ICONOS = `${import.meta.env.BASE_URL}iconos/`;

/**
 * Transición entre la portada y las herramientas: un túnel en 3D.
 *
 * La sección mide varias pantallas y su escena queda fija. La «cámara»
 * avanza durante todo el tiempo que la sección está a la vista —desde que
 * asoma por abajo hasta que se va por arriba—, así nunca hay un tramo quieto:
 * las placas de las herramientas vienen desde el fondo y pasan a los lados,
 * con rayos de velocidad, y las últimas se cruzan con la sección siguiente.
 *
 * Todo sale de `--p` (0 a 1), que escribe este componente con el scroll; cada
 * placa calcula en CSS su profundidad y su opacidad. Con movimiento reducido
 * la sección no se muestra.
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
/** Las de la primera categoría son las que aterrizan en la sección. */
const aterrizan = stack[0].items;

/**
 * Capa del túnel: va dentro de la pantalla fija de Herramientas. No mide
 * nada: lee `--pt` (0 a 1) del contenedor, que escribe Herramientas.tsx.
 *
 * Además de las placas que pasan de largo, las de la primera categoría
 * (`.tunel-aterriza`) vienen las últimas y, en el tramo final, se desvían
 * hacia la casilla que les toca en la rejilla de la sección (`--tx`, `--ty`,
 * medidas por Herramientas.tsx) y se quedan ahí: las placas reales las
 * relevan en el mismo sitio.
 */
export function Tunel() {
  const { di } = useIdioma();
  // Dos vueltas de todas las herramientas, repartidas en espiral por el túnel.
  const placas = useMemo(() => {
    const azar = azarConSemilla(7);
    // Vuelta y media: con dos el túnel iba igual de lleno y costaba un tercio
    // más de placas en 3D.
    const lista = [...herramientas, ...herramientas.slice(0, 16)];
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
  // Las que aterrizan: al fondo del todo, así siguen llegando cuando las
  // demás ya pasaron; cada una por su lado del túnel.
  const finales = useMemo(() => {
    const azar = azarConSemilla(19);
    return aterrizan.map((nombre, i) => {
      const angulo = i * 2.39996 + 1.1 + azar() * 0.5;
      const radio = 0.55 + azar() * 0.45;
      return {
        nombre,
        logo: iconos[nombre],
        cx: Math.cos(angulo) * radio,
        cy: Math.sin(angulo) * radio * 0.8,
        z0: -4900 - i * 90,
        // Cuándo empieza a desviarse hacia su casilla (en --pt).
        desde: 0.76 + i * 0.01,
      };
    });
  }, []);

  return (
    <div className="tunel" aria-hidden="true">
      <div className="tunel-rayos" />
      <div className="tunel-escena">
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
        {finales.map((p, i) => (
          <span
            key={`fin-${i}`}
            className="tunel-placa tunel-aterriza"
            data-i={i}
            style={
              {
                "--cx": p.cx.toFixed(3),
                "--cy": p.cy.toFixed(3),
                "--z0": p.z0.toFixed(0),
                "--desde": p.desde.toFixed(3),
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
        <p className="tunel-orden">
          <span className="tunel-prompt">~ $</span>
          <span className="tunel-tecleo">{di(textos.ordenHerramientas)}</span>
        </p>
      </div>
    </div>
  );
}
