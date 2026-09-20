import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { perfil } from "../datos/perfil";
import { Icono } from "./Icono";
import { SecuenciaFotogramas } from "../retrato/secuencia";
import { vigilarCercania } from "../retrato/cercania";
import "./Cierre.css";

const CIERRE = `${import.meta.env.BASE_URL}imagenes/cierre/`;
const CIERRE_MINI = `${import.meta.env.BASE_URL}imagenes/cierre-mini/`;
/** Fotogramas de `video3.mp4` (12 por segundo, 1600×900), con el fondo
 *  llevado a blanco. Ver README, "Cierre". */
const FOTOGRAMAS = 120;
const fotograma = (i: number) =>
  `${CIERRE}f${String(i).padStart(3, "0")}.jpg`;
const GITHUB = "https://github.com/Johan-Santacruz";

interface Trazo {
  d: string;
  retraso: number;
  lima: boolean;
}

/**
 * Pistas de circuito desde los bordes hacia la cara: tramo recto y luego a
 * 45°, como en una placa. Paran antes de llegar, en un anillo alrededor del
 * foco, para que la cara aparezca en el hueco que dejan.
 */
function trazar(ancho: number, alto: number, foco: { x: number; y: number }) {
  let s = 20260918;
  const azar = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const salidas = [
    ...[0.12, 0.3, 0.5, 0.7, 0.88].map((f) => ({ x: 0, y: alto * f })),
    ...[0.15, 0.4, 0.62, 0.85].map((f) => ({ x: ancho * f, y: 0 })),
    ...[0.2, 0.45, 0.7, 0.92].map((f) => ({ x: ancho * f, y: alto })),
    ...[0.25, 0.6].map((f) => ({ x: ancho, y: alto * f })),
  ];
  return salidas.map((a, i): Trazo => {
    // Punto final: en un anillo alrededor del foco, del lado de la salida.
    const ang = Math.atan2(a.y - foco.y, a.x - foco.x) + (azar() - 0.5) * 0.5;
    const radio = Math.min(ancho, alto) * (0.13 + azar() * 0.07);
    const fin = { x: foco.x + Math.cos(ang) * radio, y: foco.y + Math.sin(ang) * radio };
    const dx = fin.x - a.x;
    const dy = fin.y - a.y;
    // Recto por el eje largo hasta que quede justo la diagonal.
    const codo =
      Math.abs(dx) > Math.abs(dy)
        ? { x: a.x + Math.sign(dx) * (Math.abs(dx) - Math.abs(dy)), y: a.y }
        : { x: a.x, y: a.y + Math.sign(dy) * (Math.abs(dy) - Math.abs(dx)) };
    return {
      d: `M${a.x.toFixed(1)} ${a.y.toFixed(1)} L${codo.x.toFixed(1)} ${codo.y.toFixed(1)} L${fin.x.toFixed(1)} ${fin.y.toFixed(1)}`,
      retraso: azar() * 0.35,
      lima: i === 2 || i === 11,
    };
  });
}

/**
 * Cierre: la figura sale de la sombra a la luz mientras se baja.
 *
 * La sección mide varias pantallas y su contenido queda fijo. El avance del
 * scroll elige el fotograma de la secuencia (hacia delante o hacia atrás) y
 * escribe `--avance` (0 a 1), del que el CSS deriva la entrada del texto.
 * Los fotogramas se empiezan a cargar cuando la sección se acerca, no antes.
 */
export function Cierre() {
  const seccion = useRef<HTMLElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const fijo = useRef<HTMLDivElement>(null);
  const [copiado, setCopiado] = useState(false);
  const [medida, setMedida] = useState({ ancho: 1440, alto: 900 });

  // El foco es donde aparece la cara: dentro del vídeo, arriba y al centro.
  const trazos = useMemo(() => {
    const { ancho, alto } = medida;
    const estrecha = ancho <= 860;
    const foco = estrecha
      ? { x: ancho * 0.5, y: alto * 0.2 }
      : { x: ancho * 0.28 + ancho * 0.72 * 0.52, y: alto * 0.3 };
    return trazar(ancho, alto, foco);
  }, [medida]);

  useEffect(() => {
    const caja = fijo.current;
    if (!caja) return;
    const observador = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      setMedida({ ancho: Math.round(width), alto: Math.round(height) });
    });
    observador.observe(caja);
    return () => observador.disconnect();
  }, []);

  useEffect(() => {
    const raiz = seccion.current;
    const canvas = lienzo.current;
    if (!raiz || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let pintado = -1;
    let pedido = 0;
    let pendiente = false;

    const pintar = (quiero: number) => {
      // La mejor imagen disponible (exacta, vecina o mini mientras llega).
      const img = secuencia.mejor(quiero);
      const i = quiero;
      if (!img) return;
      // Sin más resolución que la del fotograma bueno (ver Retrato.tsx).
      const cubre = Math.max(canvas.clientWidth / 1600, canvas.clientHeight / 900);
      const dpr = Math.min(window.devicePixelRatio || 1, Math.max(1, 1 / cubre));
      const ancho = canvas.clientWidth;
      const alto = canvas.clientHeight;
      const w = Math.round(ancho * dpr);
      const h = Math.round(alto * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Como object-fit: cover, anclado arriba para no cortar la cabeza.
      const escala = Math.max(ancho / img.naturalWidth, alto / img.naturalHeight);
      const dw = img.naturalWidth * escala;
      const dh = img.naturalHeight * escala;
      ctx.drawImage(img, (ancho - dw) / 2, (alto - dh) * 0.2, dw, dh);
      pintado = i;
    };

    const secuencia = new SecuenciaFotogramas(
      FOTOGRAMAS,
      fotograma,
      (i) => {
        if (pintado < 0 || Math.abs(i - pedido) <= 2) pintar(pedido);
      },
      8,
      (i) => `${CIERRE_MINI}f${String(i).padStart(3, "0")}.jpg`,
    );
    const vigia = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting) return;
        vigia.disconnect();
        secuencia.empezar();
      },
      { rootMargin: "150% 0px" },
    );
    vigia.observe(raiz);

    const medir = () => {
      pendiente = false;
      const caja = raiz.getBoundingClientRect();
      const largo = caja.height - window.innerHeight;
      const avance = largo > 0 ? Math.min(1, Math.max(0, -caja.top / largo)) : 0;
      raiz.style.setProperty("--avance", avance.toFixed(4));
      // Llegada: de 0 cuando la sección asoma por abajo a 1 cuando toca arriba.
      const llegada = Math.min(1, Math.max(0, 1 - caja.top / window.innerHeight));
      raiz.style.setProperty("--llegada", llegada.toFixed(4));
      raiz.toggleAttribute("data-texto", avance > 0.6);
      // El vídeo ocupa el 80 % del recorrido; el resto, quieto al final.
      const t = Math.min(1, avance / 0.8);
      pedido = Math.round(t * (FOTOGRAMAS - 1));
      secuencia.pedir(pedido);
      if (pedido !== pintado) pintar(pedido);
    };
    // Solo se mide con la sección a la vista (ver cercania.ts).
    let cerca = true;
    const alScroll = () => {
      if (pendiente || !cerca) return;
      pendiente = true;
      requestAnimationFrame(medir);
    };
    const observador = new ResizeObserver(() => {
      if (pintado >= 0) pintar(pedido);
    });
    observador.observe(canvas);
    medir();
    const dejarDeVigilar = vigilarCercania(raiz, (c) => {
      cerca = c;
      medir();
    });
    window.addEventListener("scroll", alScroll, { passive: true });
    window.addEventListener("resize", alScroll);
    return () => {
      dejarDeVigilar();
      secuencia.detener();
      vigia.disconnect();
      observador.disconnect();
      window.removeEventListener("scroll", alScroll);
      window.removeEventListener("resize", alScroll);
    };
  }, []);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(perfil.correo);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 1800);
    } catch {
      // Sin permiso para el portapapeles: el enlace de correo sigue ahí.
    }
  };

  return (
    <section
      ref={seccion}
      className="cierre"
      id="contacto"
      aria-labelledby="titulo-cierre"
    >
      <div className="cierre-fijo" ref={fijo}>
        <canvas ref={lienzo} className="cierre-video" aria-hidden="true" />
        {/* Niebla: un velo que se retira y bancos de bruma que se disipan. */}
        <div className="cierre-niebla" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        {/* Pistas que convergen donde aparecerá la cara, mientras la sección
            llega; se apagan cuando la niebla se abre. */}
        <svg
          className="cierre-trazos"
          viewBox={`0 0 ${medida.ancho} ${medida.alto}`}
          aria-hidden="true"
        >
          {trazos.map((t, i) => (
            <g
              key={i}
              className={t.lima ? "cierre-trazo cierre-trazo-lima" : "cierre-trazo"}
              style={{ "--retraso": t.retraso } as CSSProperties}
            >
              <path d={t.d} pathLength={1} />
            </g>
          ))}
        </svg>

        <div className="cierre-texto">
          <p className="cierre-rotulo">Contacto</p>
          <h2 id="titulo-cierre">
            <span style={{ "--linea": 0 } as CSSProperties}>¿Construimos</span>
            <span style={{ "--linea": 1 } as CSSProperties}>lo que sigue?</span>
          </h2>
          <p className="cierre-copy">
            Cuéntame tu idea: una web, un sistema con IA o un proceso que quieras
            automatizar. Te respondo el mismo día.
          </p>
          <div className="cierre-acciones">
            <a className="cierre-correo" href={`mailto:${perfil.correo}`}>
              Escríbeme <Icono nombre="diagonal" />
            </a>
            <button className="cierre-copiar" onClick={copiar}>
              {copiado ? "Copiado" : perfil.correo}
            </button>
          </div>
          <a
            className="cierre-github"
            href={GITHUB}
            target="_blank"
            rel="noreferrer"
          >
            GitHub <Icono nombre="diagonal" />
          </a>
        </div>

        <footer className="cierre-pie">
          <span>© {new Date().getFullYear()} Johan Santacruz</span>
          <span>{perfil.ubicacion}</span>
        </footer>
      </div>
    </section>
  );
}
