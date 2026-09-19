import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { iconos, stack } from "../datos/stack";
import { Tunel } from "./Tunel";
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
    // Mide --tunel en px (svh no se puede leer desde CSS).
    const sonda = raiz.querySelector<HTMLElement>(".herr-sonda");
    const fijo = raiz.querySelector<HTMLElement>(".herr-fijo");
    const palabras = raiz.querySelector<HTMLElement>(".herr-palabras");
    const marca = raiz.querySelector<HTMLElement>(".herr-marca");
    const destino = raiz.querySelector<HTMLElement>(".herr-destino");

    // El destino («LENGUAJES» al fondo del túnel) acaba exactamente donde está
    // la primera palabra del lector: se mide esa posición y desde dónde sale
    // (el centro de la pantalla). Se mide con las placas sin transformar
    // (en ninguna fase llevan transform).
    const colocarDestino = () => {
      if (!fijo || !palabras || !marca || !destino) return;
      const f = fijo.getBoundingClientRect();
      const ul = palabras.getBoundingClientRect();
      const m = marca.getBoundingClientRect();
      const estilo = getComputedStyle(palabras);
      destino.style.fontSize = getComputedStyle(palabras.parentElement!).fontSize;
      const x = ul.left - f.left + parseFloat(estilo.paddingLeft) + 10;
      const y = m.top + m.height / 2 - f.top;
      destino.style.left = `${x}px`;
      destino.style.top = `${y}px`;
      const w = destino.offsetWidth;
      destino.style.setProperty("--sx", `${f.width / 2 - (x + w / 2)}px`);
      destino.style.setProperty("--sy", `${f.height / 2 - y}px`);
      // Casilla de cada placa del primer grupo, respecto al centro de la
      // pantalla: ahí aterrizan las placas del túnel (ver Tunel.css).
      const reales = grupos[0]?.querySelectorAll<HTMLElement>(".herr-placa") ?? [];
      raiz.querySelectorAll<HTMLElement>(".tunel-aterriza").forEach((placa, i) => {
        const real = reales[i];
        if (!real) return;
        const r = real.getBoundingClientRect();
        placa.style.setProperty("--tx", `${r.left + r.width / 2 - (f.left + f.width / 2)}px`);
        placa.style.setProperty("--ty", `${r.top + r.height / 2 - (f.top + f.height / 2)}px`);
      });
    };
    const total = grupos.length;
    let activo = -1;
    let pendiente = false;
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Fase de las placas del primer grupo: «tunel» mientras vuelan, «aterrizado»
    // recién llegadas (relevo sin transición) y «lector» en cuanto se mueve
    // la lista; al volver a subir al túnel se reinicia.
    let fase = "";
    let movido = false;
    const ponerFase = (nueva: string) => {
      if (nueva === fase) return;
      fase = nueva;
      raiz.setAttribute("data-fase", nueva);
    };

    const limitar = (v: number) => Math.min(1, Math.max(0, v));
    // Curva suave (arranca y frena despacio).
    const suave = (v: number) => v * v * (3 - 2 * v);

    // Velocidad del túnel (0 a 1): sube de golpe al bajar rápido y se
    // apaga sola en unos cientos de ms cuando el scroll se detiene.
    let vel = 0;
    let ultimoPt = 0;
    let ultimoT = performance.now();
    let rafVel = 0;
    const apagarVel = () => {
      vel *= 0.88;
      if (vel < 0.01) {
        vel = 0;
        rafVel = 0;
      } else rafVel = requestAnimationFrame(apagarVel);
      raiz.style.setProperty("--vel", vel.toFixed(3));
    };
    const pintar = () => {
      pendiente = false;
      const caja = raiz.getBoundingClientRect();
      const alto = window.innerHeight;
      // Primero el túnel: arranca en cuanto la sección asoma por abajo y
      // termina tras recorrer su tramo fijo (--tunel).
      const tunel = sonda?.offsetTop ?? 0;
      const pt = limitar((alto - caja.top) / (alto + tunel));
      raiz.style.setProperty("--pt", pt.toFixed(4));
      const ahora = performance.now();
      const dt = Math.max(16, ahora - ultimoT);
      // Solo cuenta mientras el túnel está en juego.
      if (pt > 0 && pt < 1) {
        const inst = (Math.abs(pt - ultimoPt) / dt) * 1000; // túneles por segundo
        vel = Math.max(vel, limitar(inst / 0.9));
        raiz.style.setProperty("--vel", vel.toFixed(3));
        if (!rafVel) rafVel = requestAnimationFrame(apagarVel);
      }
      ultimoPt = pt;
      ultimoT = ahora;
      // Al fondo del túnel, «LENGUAJES» crece desde el punto de fuga y se
      // desliza a su sitio; entonces aparece el resto de la sección.
      raiz.style.setProperty("--acerca", limitar((pt - 0.42) / 0.4).toFixed(4));
      raiz.style.setProperty("--asienta", suave(limitar((pt - 0.8) / 0.12)).toFixed(4));
      raiz.style.setProperty("--llegada", suave(limitar((pt - 0.9) / 0.08)).toFixed(4));
      // Después, el lector recorre las categorías con el resto del scroll.
      const largo = caja.height - alto - tunel;
      const avance = largo > 0 ? limitar((-caja.top - tunel) / largo) : 0;
      const tramo = Math.min(
        1,
        Math.max(0, (avance - PAUSA_INICIO) / (1 - PAUSA_INICIO - PAUSA_FINAL)),
      );
      const p = conReposo(tramo * (total - 1));
      raiz.style.setProperty("--p", p.toFixed(4));
      const nuevo = Math.round(p);
      if (nuevo > 0) movido = true;
      if (pt < 1) movido = false;
      ponerFase(reducido ? "lector" : pt < 1 ? "tunel" : movido ? "lector" : "aterrizado");
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
    const alRedimensionar = () => {
      colocarDestino();
      alScroll();
    };
    colocarDestino();
    document.fonts?.ready.then(colocarDestino);
    pintar();
    window.addEventListener("scroll", alScroll, { passive: true });
    window.addEventListener("resize", alRedimensionar);
    return () => {
      cancelAnimationFrame(rafVel);
      window.removeEventListener("scroll", alScroll);
      window.removeEventListener("resize", alRedimensionar);
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
      <span className="herr-sonda" aria-hidden="true" />
      <div className="herr-fijo">
        <Tunel />
        <span className="herr-destino" aria-hidden="true">
          {stack[0].palabra ?? stack[0].titulo}
        </span>
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
