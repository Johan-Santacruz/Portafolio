import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { perfil } from "../datos/perfil";
import { useIdioma } from "../idioma/idioma";
import { textos } from "../idioma/textos";
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
/** Hoja de vida: el PDF para descargar y sus páginas para verlas aquí. */
const HOJA = `${import.meta.env.BASE_URL}documentos/`;
const HOJA_PDF = `${HOJA}hoja-de-vida-johan-balanta.pdf`;
const HOJA_PAGINAS = [1, 2];

/**
 * Cierre: la figura sale de la sombra a la luz mientras se baja.
 *
 * La sección mide varias pantallas y su contenido queda fijo. El avance del
 * scroll elige el fotograma de la secuencia (hacia delante o hacia atrás) y
 * escribe `--avance` (0 a 1), del que el CSS deriva la entrada del texto.
 * Los fotogramas se empiezan a cargar cuando la sección se acerca, no antes.
 */
export function Cierre() {
  const { di } = useIdioma();
  const seccion = useRef<HTMLElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const [copiado, setCopiado] = useState(false);
  const [hoja, setHoja] = useState(false);
  const ventanaHoja = useRef<HTMLDialogElement>(null);
  const abridorHoja = useRef<HTMLButtonElement>(null);
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
      const alto = window.innerHeight;
      const largo = caja.height - alto;
      // El avance arranca en cuanto la sección asoma por abajo, no cuando
      // queda pegada arriba: si no, la figura tardaba una pantalla entera en
      // empezar a salir de la niebla. A 0,5 la sección ya está pegada.
      const avance =
        largo > 0 ? Math.min(1, Math.max(0, (alto - caja.top) / (alto + largo))) : 0;
      raiz.style.setProperty("--avance", avance.toFixed(4));
      // Llegada: de 0 cuando la sección asoma por abajo a 1 cuando toca arriba.
      const llegada = Math.min(1, Math.max(0, 1 - caja.top / alto));
      raiz.style.setProperty("--llegada", llegada.toFixed(4));
      raiz.toggleAttribute("data-texto", avance > 0.62);
      // El vídeo ocupa el 85 % del recorrido; el resto, quieto al final.
      const t = Math.min(1, avance / 0.85);
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

  // La hoja de vida se abre en una ventana nativa, como las fichas de los
  // proyectos: se ve sin salir de la página y se puede descargar.
  useEffect(() => {
    if (!hoja) return;
    const anterior = document.body.style.overflow;
    ventanaHoja.current?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [hoja]);

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
      <div className="cierre-fijo">
        <canvas ref={lienzo} className="cierre-video" aria-hidden="true" />
        {/* Niebla: un velo que se retira y bancos de bruma que se disipan. */}
        <div className="cierre-niebla" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="cierre-texto">
          <p className="cierre-rotulo">{di(textos.contactoRotulo)}</p>
          <h2 id="titulo-cierre">
            <span style={{ "--linea": 0 } as CSSProperties}>
              {di(textos.cierreLinea1)}
            </span>
            <span style={{ "--linea": 1 } as CSSProperties}>
              {di(textos.cierreLinea2)}
            </span>
          </h2>
          <p className="cierre-copy">{di(textos.cierreCopia)}</p>
          <div className="cierre-acciones">
            <a className="cierre-correo" href={`mailto:${perfil.correo}`}>
              {di(textos.escribeme)} <Icono nombre="diagonal" />
            </a>
            <button className="cierre-copiar" onClick={copiar}>
              {copiado ? di(textos.copiado) : perfil.correo}
            </button>
          </div>
          <div className="cierre-enlaces">
            <button
              className="cierre-enlace"
              ref={abridorHoja}
              onClick={() => setHoja(true)}
            >
              {di(textos.hojaDeVida)} <Icono nombre="diagonal" />
            </button>
            <a
              className="cierre-enlace"
              href={GITHUB}
              target="_blank"
              rel="noreferrer"
            >
              GitHub <Icono nombre="diagonal" />
            </a>
          </div>
        </div>

        {hoja && (
          <dialog
            ref={ventanaHoja}
            className="hoja-ventana"
            aria-labelledby="titulo-hoja"
            onClose={() => {
              setHoja(false);
              requestAnimationFrame(() => abridorHoja.current?.focus());
            }}
          >
            <div className="hoja-barra">
              <h2 id="titulo-hoja">{di(textos.hojaDeVida)}</h2>
              <div className="hoja-acciones">
                <a className="hoja-descargar" href={HOJA_PDF} download>
                  {di(textos.descargarPdf)} <Icono nombre="diagonal" />
                </a>
                <button
                  className="hoja-cerrar"
                  aria-label={di(textos.cerrar)}
                  onClick={() => ventanaHoja.current?.close()}
                  autoFocus
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="hoja-paginas">
              {HOJA_PAGINAS.map((n) => (
                <img
                  key={n}
                  src={`${HOJA}hoja-de-vida-${n}.jpg`}
                  alt={`${di(textos.hojaPagina)} ${n} ${di(textos.hojaDe)} ${HOJA_PAGINAS.length}`}
                  loading={n === 1 ? "eager" : "lazy"}
                  decoding="async"
                />
              ))}
            </div>
          </dialog>
        )}

        <footer className="cierre-pie">
          <span>© {new Date().getFullYear()} Johan Santacruz</span>
          <span>{perfil.ubicacion}</span>
        </footer>
      </div>
    </section>
  );
}
