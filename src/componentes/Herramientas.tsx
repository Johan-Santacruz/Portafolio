import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { iconos, stack } from "../datos/stack";
import "./Herramientas.css";

const ICONOS = `${import.meta.env.BASE_URL}iconos/`;

/**
 * Herramientas como una lista de palabras que pasa por un lector.
 *
 * La sección mide varias pantallas y su contenido queda fijo. Al bajar, la
 * columna de categorías sube: la que pasa por el centro (junto a la marca
 * lima) se enciende y las demás se quedan en contorno, apagándose hacia los
 * bordes. A la derecha solo están las herramientas de la categoría activa;
 * al cambiar, las anteriores salen en la dirección del scroll y las nuevas
 * se imprimen en cascada.
 *
 * Todo sale de `--p` (posición en la lista, continua de 0 a N−1) y de
 * `data-estado` en cada grupo, que escribe este componente con el scroll.
 * Los datos salen de `datos/stack.ts`.
 */

/** Tramos del recorrido que la lista se queda quieta al empezar y al acabar. */
const PAUSA_INICIO = 0.06;
const PAUSA_FINAL = 0.05;
/** Parte de cada tramo entre dos palabras en que la lista reposa. */
const REPOSO = 0.45;

/** Avance con reposo: se queda en cada entero y se desliza entre ellos. */
function conReposo(x: number) {
  const i = Math.floor(x);
  const f = x - i;
  const g = Math.min(1, Math.max(0, (f - REPOSO / 2) / (1 - REPOSO)));
  return i + g * g * (3 - 2 * g);
}

export function Herramientas() {
  const seccion = useRef<HTMLElement>(null);

  useEffect(() => {
    const raiz = seccion.current;
    if (!raiz) return;
    const grupos = Array.from(raiz.querySelectorAll<HTMLElement>(".herr-grupo"));
    const total = grupos.length;
    let activo = -1;
    let pendiente = false;

    const pintar = () => {
      pendiente = false;
      const caja = raiz.getBoundingClientRect();
      const largo = caja.height - window.innerHeight;
      const avance = largo > 0 ? Math.min(1, Math.max(0, -caja.top / largo)) : 0;
      const tramo = Math.min(
        1,
        Math.max(0, (avance - PAUSA_INICIO) / (1 - PAUSA_INICIO - PAUSA_FINAL)),
      );
      const p = conReposo(tramo * (total - 1));
      raiz.style.setProperty("--p", p.toFixed(4));
      const nuevo = Math.round(p);
      if (nuevo === activo) return;
      activo = nuevo;
      grupos.forEach((g, i) =>
        g.setAttribute(
          "data-estado",
          i < activo ? "antes" : i > activo ? "despues" : "activo",
        ),
      );
    };
    const alScroll = () => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(pintar);
    };
    pintar();
    window.addEventListener("scroll", alScroll, { passive: true });
    window.addEventListener("resize", alScroll);
    return () => {
      window.removeEventListener("scroll", alScroll);
      window.removeEventListener("resize", alScroll);
    };
  }, []);

  return (
    <section
      ref={seccion}
      className="herramientas"
      id="herramientas"
      aria-labelledby="titulo-herramientas"
      style={{ "--n": stack.length } as CSSProperties}
    >
      {stack.map((grupo, i) => (
        <span
          key={grupo.titulo}
          className="parada"
          style={{
            top: `calc(var(--n) * var(--por-categoria) * ${(
              PAUSA_INICIO +
              ((1 - PAUSA_INICIO - PAUSA_FINAL) * i) / (stack.length - 1)
            ).toFixed(4)})`,
          }}
          aria-hidden="true"
        />
      ))}
      <div className="herr-fijo">
        <header className="herr-cabecera">
          <p className="herr-rotulo">Herramientas</p>
          <h2 id="titulo-herramientas">Con qué construyo</h2>
        </header>

        {/* Decorativa: los nombres reales están en los h3 de cada grupo. */}
        <div className="herr-lector" aria-hidden="true">
          <span className="herr-marca" />
          <ul className="herr-palabras">
            {stack.map((grupo, i) => (
              <li
                key={grupo.titulo}
                style={{ "--i": i } as CSSProperties}
                data-texto={grupo.palabra ?? grupo.titulo}
              >
                {grupo.palabra ?? grupo.titulo}
              </li>
            ))}
          </ul>
        </div>

        <div className="herr-bandeja">
          {stack.map((grupo, g) => (
            <div
              className="herr-grupo"
              key={grupo.titulo}
              data-estado={g === 0 ? "activo" : "despues"}
            >
              <h3 className="herr-titulo">{grupo.titulo}</h3>
              <ul>
                {grupo.items.map((item, i) => (
                  <li
                    key={item}
                    className="herr-placa"
                    style={
                      {
                        "--i": i,
                        "--logo": iconos[item]
                          ? `url("${ICONOS}${iconos[item]}.svg")`
                          : "none",
                      } as CSSProperties
                    }
                  >
                    {iconos[item] && (
                      <span className="herr-logo" aria-hidden="true" />
                    )}
                    {item}
                  </li>
                ))}
              </ul>
              {/* Consola: la orden se teclea al activarse la categoría. */}
              <div className="herr-consola" aria-hidden="true">
                {grupo.consola.map((linea, l) => (
                  <p
                    key={l}
                    className={l === 0 ? "herr-orden" : "herr-salida"}
                    style={{ "--largo": [...linea].length } as CSSProperties}
                  >
                    <span>{linea}</span>
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Riel de progreso: una muesca por categoría. */}
        <div className="herr-riel" aria-hidden="true">
          {stack.map((grupo, i) => (
            <span key={grupo.titulo} style={{ "--i": i } as CSSProperties} />
          ))}
        </div>
      </div>
    </section>
  );
}
