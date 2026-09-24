import { useEffect, useRef, useState } from "react";
import { MotorRetrato } from "../retrato/motor";
import { SecuenciaFotogramas } from "../retrato/secuencia";
import { esCelular } from "../retrato/telefono";
import { vigilarCercania } from "../retrato/cercania";
import { trabajos } from "../datos/trabajos";
import { useIdioma } from "../idioma/idioma";
import type { Decible } from "../idioma/idioma";
import { textos } from "../idioma/textos";
import "./Retrato.css";

const RETRATO = `${import.meta.env.BASE_URL}imagenes/retrato/`;
/**
 * Punto de la foto que se conserva al recortar (como `object-position`).
 * La foto, el canvas y la secuencia lo comparten: si no, las capas no
 * coincidirían. Súbelo o bájalo según dónde quede la cara en tu foto.
 */
const FOCO = { x: 0.5, y: 0.42 };
const COLORES = { acento: "#c7ff4a", papel: "#f4f0e7" };
/**
 * Secuencia de fotogramas del vídeo, ya recortados al encuadre de la foto
 * (ver README, "Retrato interactivo"). Se reproduce con el scroll.
 */
const FOTOGRAMAS = 121;
const ANCHO_FOTOGRAMA = 1280;
const ALTO_FOTOGRAMA = 720;
const fotograma = (i: number) =>
  `${RETRATO}secuencia/f${String(i).padStart(3, "0")}.jpg`;
/**
 * HUD de datos bajo la máscara: guardado para más adelante, apagado por ahora.
 * Ponlo en `true` para volver a mostrarlo.
 */
const MOSTRAR_HUD = false;
const hackathones = trabajos.filter((t) =>
  /hackat(h)?on/i.test(t.contexto.es),
).length;
/**
 * Datos escondidos en la capa del alter ego: solo se ven bajo la máscara del
 * cursor. Cada uno lleva su posición (en % del retrato) y el lado hacia el
 * que apunta su línea.
 */
const HUD: {
  x: number;
  y: number;
  lado: "izq" | "der";
  etiqueta: Decible;
  valor: Decible;
  grande?: boolean;
}[] = [
  {
    x: 8,
    y: 20,
    lado: "der",
    etiqueta: textos.hud.identidad,
    valor: "Johan Santacruz",
  },
  {
    x: 72,
    y: 22,
    lado: "izq",
    etiqueta: textos.hud.hackathones,
    valor: String(hackathones).padStart(2, "0"),
    grande: true,
  },
  {
    x: 8,
    y: 40,
    lado: "der",
    etiqueta: textos.hud.formacion,
    valor: textos.hud.formacionValor,
  },
  {
    x: 72,
    y: 42,
    lado: "izq",
    etiqueta: textos.hud.proyectos,
    valor: String(trabajos.length).padStart(2, "0"),
    grande: true,
  },
  { x: 8, y: 60, lado: "der", etiqueta: textos.hud.base, valor: "Cali, Colombia" },
  {
    x: 72,
    y: 62,
    lado: "izq",
    etiqueta: textos.hud.estado,
    valor: textos.hud.estadoValor,
  },
];

/** Parte del recorrido dedicada a revelar el alter ego; el resto, al vídeo. */
const TRAMO_REVELADO = 0.3;
/** Tramo (del recorrido) en que la secuencia se funde sobre el alter ego. */
const TRAMO_FUNDIDO = 0.04;

/**
 * Retrato con dos identidades: la foto normal y, debajo, su alter ego
 * tecnológico, que aparece bajo el puntero. La máscara vive en
 * `retrato/motor.ts`; aquí van el DOM, los gestos, los estados y el
 * recorrido con scroll.
 *
 * Gestos: ratón → hover; táctil → mantener pulsado o arrastrar en horizontal
 * (el desplazamiento vertical sigue siendo scroll); teclado → con el foco la
 * máscara orbita sola.
 *
 * Recorrido: el contenedor `[data-recorrido]` más cercano mide más que la
 * pantalla y su contenido va fijo. Al bajar, primero se revela todo el alter
 * ego (círculo que crece desde el puntero) y después avanza la secuencia de
 * fotogramas; al final se queda en el último.
 */
export function Retrato() {
  const { di } = useIdioma();
  const marco = useRef<HTMLDivElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const lienzoSecuencia = useRef<HTMLCanvasElement>(null);
  const [activo, setActivo] = useState(false);
  const [listo, setListo] = useState(false);
  const [fase, setFase] = useState<"mascara" | "revelado" | "secuencia">(
    "mascara",
  );

  useEffect(() => {
    const zona = marco.current;
    const canvas = lienzo.current;
    const canvasSecuencia = lienzoSecuencia.current;
    if (!zona || !canvas || !canvasSecuencia) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const imagen = new Image();
    imagen.src = `${RETRATO}alter.jpg`;
    let m: MotorRetrato | null = null;
    // En el celular el alter ego llega con un fundido (ver medir).
    const celular = esCelular();
    let opacidadAlter = "";
    let cancelado = false;
    let temporizadorPulsacion = 0;
    let temporizadorInsinuar = 0;
    let tactil: { id: number; x: number; y: number; activo: boolean } | null =
      null;
    let enSecuencia = false;

    const local = (ev: PointerEvent) => {
      const caja = zona.getBoundingClientRect();
      return { x: ev.clientX - caja.left, y: ev.clientY - caja.top };
    };
    const crearMotor = () => {
      m?.destruir();
      m = new MotorRetrato(canvas, imagen, {
        reducido: media.matches,
        foco: FOCO,
        ...COLORES,
      });
      m.observar(setActivo);
    };

    const alEntrar = (ev: PointerEvent) => {
      if (ev.pointerType === "touch" || !m || enSecuencia) return;
      const { x, y } = local(ev);
      m.entrar(x, y, true);
    };
    const alMover = (ev: PointerEvent) => {
      if (!m || enSecuencia) return;
      const { x, y } = local(ev);
      if (ev.pointerType === "touch") {
        if (!tactil || tactil.id !== ev.pointerId) return;
        if (!tactil.activo) {
          // Arrastre horizontal claro: revela ya. Vertical: es scroll.
          const dx = Math.abs(x - tactil.x);
          const dy = Math.abs(y - tactil.y);
          if (dx > 10 && dx > dy * 1.4) activarTactil(ev, x, y);
          return;
        }
      }
      m.mover(x, y);
    };
    const alSalir = (ev: PointerEvent) => {
      if (ev.pointerType === "touch" || !m) return;
      m.salir();
    };

    const activarTactil = (ev: PointerEvent, x: number, y: number) => {
      if (!m || !tactil || enSecuencia) return;
      tactil.activo = true;
      zona.setPointerCapture(ev.pointerId);
      m.entrar(x, y, false);
    };
    const alPulsar = (ev: PointerEvent) => {
      if (ev.pointerType !== "touch" || !m || enSecuencia) return;
      const { x, y } = local(ev);
      tactil = { id: ev.pointerId, x, y, activo: false };
      clearTimeout(temporizadorPulsacion);
      // Mantener pulsado ~180 ms sin moverse también revela.
      temporizadorPulsacion = window.setTimeout(() => {
        if (tactil && !tactil.activo) activarTactil(ev, x, y);
      }, 180);
    };
    const alSoltar = (ev: PointerEvent) => {
      if (ev.pointerType !== "touch" || !m) return;
      clearTimeout(temporizadorPulsacion);
      if (tactil?.activo) m.salir();
      tactil = null;
    };
    // El revelado nunca bloquea el scroll: en horizontal ya no hay nada que
    // desplazar (touch-action: pan-y), y si el dedo va en vertical es que la
    // persona quiere bajar, así que el revelado se suelta. (Bloquearlo dejaba
    // la página trabada al apoyar el dedo un momento antes de deslizar.)
    const alTocarMover = (ev: TouchEvent) => {
      if (!tactil) return;
      const t = ev.touches[0];
      if (t) {
        const caja = zona.getBoundingClientRect();
        const dx = Math.abs(t.clientX - caja.left - tactil.x);
        const dy = Math.abs(t.clientY - caja.top - tactil.y);
        if (dy > 12 && dy > dx) {
          clearTimeout(temporizadorPulsacion);
          if (tactil.activo) m?.salir();
          tactil = null;
        }
      }
    };
    const alFoco = () => {
      if (!enSecuencia) m?.orbitar();
    };
    const alDesenfocar = () => m?.salir();

    // --- Secuencia de fotogramas -------------------------------------------
    let cuadroPintado = -1;
    let cuadroPedido = 0;
    let avanceSecuencia = 0;
    // Con qué avance se pintó el último: en vertical el recorte depende de
    // él, pero si no ha cambiado no hay nada que volver a dibujar.
    let avancePintado = -1;
    let opacidadPuesta = "";
    const ctxSecuencia = canvasSecuencia.getContext("2d");

    const pintarCuadro = (pedido: number) => {
      // La mejor imagen disponible (exacta, vecina o mini mientras llega).
      const img = secuencia.mejor(pedido);
      const i = pedido;
      if (!img || !ctxSecuencia) return false;
      // Sin más resolución que la del fotograma: más píxeles no añaden
      // detalle y cada uno hay que subirlo a la GPU en cada scroll.
      // Se mide con la escala real de «cover»: en vertical la imagen se
      // amplía por su altura y un píxel de origen ocupa más de uno de CSS.
      // (Con el tamaño del fotograma bueno, no el de la imagen que toque:
      // así el lienzo no cambia de tamaño al pasar de mini a bueno.)
      const cubre = Math.max(
        canvasSecuencia.clientWidth / ANCHO_FOTOGRAMA,
        canvasSecuencia.clientHeight / ALTO_FOTOGRAMA,
      );
      const dpr = Math.min(window.devicePixelRatio || 1, Math.max(1, 1 / cubre));
      const ancho = canvasSecuencia.clientWidth;
      const alto = canvasSecuencia.clientHeight;
      const w = Math.round(ancho * dpr);
      const h = Math.round(alto * dpr);
      if (canvasSecuencia.width !== w || canvasSecuencia.height !== h) {
        canvasSecuencia.width = w;
        canvasSecuencia.height = h;
      }
      ctxSecuencia.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Mismo recorte que la foto: cover con el punto focal compartido. En
      // pantallas verticales el recorte se desliza con la figura, que en el
      // vídeo acaba en el lado derecho: si no, se saldría de cuadro.
      const escala = Math.max(
        ancho / img.width,
        alto / img.height,
      );
      const dw = img.width * escala;
      const dh = img.height * escala;
      const vertical = ancho < alto;
      const focoX = vertical ? FOCO.x + 0.13 * avanceSecuencia : FOCO.x;
      ctxSecuencia.drawImage(
        img,
        (ancho - dw) * focoX,
        (alto - dh) * FOCO.y,
        dw,
        dh,
      );
      cuadroPintado = i;
      avancePintado = avanceSecuencia;
      return true;
    };
    const limpiarSecuencia = () => {
      if (cuadroPintado < 0 || !ctxSecuencia) return;
      ctxSecuencia.clearRect(
        0,
        0,
        canvasSecuencia.width,
        canvasSecuencia.height,
      );
      cuadroPintado = -1;
    };
    // Al llegar un fotograma más próximo al pedido que el pintado, se cambia.
    const secuencia = new SecuenciaFotogramas(
      FOTOGRAMAS,
      fotograma,
      (i) => {
        // Si llega algo para el fotograma pedido (o casi), se repinta.
        if (enSecuencia && Math.abs(i - cuadroPedido) <= 2)
          pintarCuadro(cuadroPedido);
      },
      8,
      (i) => `${RETRATO}secuencia-mini/f${String(i).padStart(3, "0")}.jpg`,
    );

    // --- Recorrido con scroll ------------------------------------------------
    const recorrido = zona.closest<HTMLElement>("[data-recorrido]");
    let pendiente = false;
    const medir = () => {
      pendiente = false;
      if (!recorrido || !m) return;
      const caja = recorrido.getBoundingClientRect();
      const largo = caja.height - window.innerHeight;
      const avance =
        largo > 0 ? Math.min(1, Math.max(0, -caja.top / largo)) : 0;
      const base = Math.min(1, avance / TRAMO_REVELADO);
      // El CSS de la portada deriva de aquí lo que aparece con el scroll.
      recorrido.style.setProperty("--avance", avance.toFixed(4));
      // Y lo avisa: quien solo necesita saber cuándo cambia algo (el párrafo
      // de la portada, letra a letra) no tiene que heredar --avance y
      // recalcularse en cada fotograma.
      recorrido.dispatchEvent(new CustomEvent("avance", { detail: avance }));
      if (celular) {
        // En el celular, un fundido: el alter ego se dibuja entero una vez y
        // el scroll solo cambia la opacidad del lienzo, que aplica la GPU sin
        // redibujar. El círculo que crece se repintaba entero en cada
        // fotograma y era lo que más pesaba de la portada en un gama media.
        // Arriba del todo (base 0) el lienzo vuelve a opacidad plena: ahí se
        // destapa con el dedo, como siempre.
        m.avanzar(base > 0 ? 1 : 0);
        const opacidad = base > 0 ? base.toFixed(3) : "1";
        if (opacidad !== opacidadAlter) {
          opacidadAlter = opacidad;
          canvas.style.opacity = opacidad;
        }
      } else m.avanzar(base);
      const antes = enSecuencia;
      enSecuencia = avance > TRAMO_REVELADO;
      if (enSecuencia) {
        if (!antes) m.salir();
        const p = (avance - TRAMO_REVELADO) / (1 - TRAMO_REVELADO);
        avanceSecuencia = p;
        cuadroPedido = Math.round(p * (FOTOGRAMAS - 1));
        secuencia.pedir(cuadroPedido);
        // En vertical el recorte cambia con el avance: se repinta siempre.
        // En vertical el recorte se mueve con el avance, así que también se
        // repinta si este cambia; si no, dibujar el mismo fotograma en cada
        // scroll (al final de la portada, con el avance ya en 1) costaba en
        // los teléfonos lentos justo cuando entra el túnel.
        if (
          cuadroPedido !== cuadroPintado ||
          (canvasSecuencia.clientWidth < canvasSecuencia.clientHeight &&
            Math.abs(avanceSecuencia - avancePintado) > 0.0005)
        )
          pintarCuadro(cuadroPedido);
        // El vídeo es más blando que la foto: entra con un fundido corto.
        const opacidad = Math.min(1, (avance - TRAMO_REVELADO) / TRAMO_FUNDIDO).toFixed(3);
        if (opacidad !== opacidadPuesta) {
          opacidadPuesta = opacidad;
          canvasSecuencia.style.opacity = opacidad;
        }
        setFase("secuencia");
      } else {
        limpiarSecuencia();
        setFase(base > 0 ? "revelado" : "mascara");
      }
    };
    // Solo se mide con la portada a la vista (ver cercania.ts).
    let cerca = true;
    let dejarDeVigilar = () => {};
    const alScroll = () => {
      if (pendiente || !cerca) return;
      pendiente = true;
      requestAnimationFrame(medir);
    };
    // Con otro tamaño el lienzo cambia y hay que volver a pintar aunque el
    // fotograma sea el mismo.
    const alRedimensionar = () => {
      cuadroPintado = -1;
      alScroll();
    };

    const arrancar = () => {
      if (cancelado) return;
      crearMotor();
      setListo(true);
      zona.addEventListener("pointerenter", alEntrar);
      zona.addEventListener("pointermove", alMover, { passive: true });
      zona.addEventListener("pointerleave", alSalir);
      zona.addEventListener("pointerdown", alPulsar);
      zona.addEventListener("pointerup", alSoltar);
      zona.addEventListener("pointercancel", alSoltar);
      zona.addEventListener("touchmove", alTocarMover, { passive: true });
      zona.addEventListener("focus", alFoco);
      zona.addEventListener("blur", alDesenfocar);
      window.addEventListener("scroll", alScroll, { passive: true });
      window.addEventListener("resize", alRedimensionar);
      medir();
      if (recorrido)
        dejarDeVigilar = vigilarCercania(recorrido, (c) => {
          cerca = c;
          medir();
          // Lejos, sus fotogramas sobran en memoria (ver secuencia.ts).
          if (!c) secuencia.soltar();
        });
      // Tras la entrada, una pasada sola por la cara enseña el gesto.
      temporizadorInsinuar = window.setTimeout(() => {
        if (!zona.matches(":hover") && !enSecuencia) m?.insinuar();
      }, 1400);
      // Los fotogramas, en cuanto la portada está lista: quien baja deprisa
      // tiene que encontrarlos ya en camino.
      secuencia.empezar();
    };

    if (imagen.complete && imagen.naturalWidth) arrancar();
    else imagen.addEventListener("load", arrancar, { once: true });

    const observador = new ResizeObserver(() => {
      m?.redimensionar();
      if (cuadroPintado >= 0) pintarCuadro(cuadroPedido);
    });
    observador.observe(canvas);
    // Si cambia la preferencia de movimiento, el motor se reinicia con ella.
    const alCambiarMovimiento = () => {
      if (m) {
        crearMotor();
        medir();
      }
    };
    media.addEventListener("change", alCambiarMovimiento);

    return () => {
      cancelado = true;
      dejarDeVigilar();
      secuencia.detener();
      clearTimeout(temporizadorPulsacion);
      clearTimeout(temporizadorInsinuar);
      observador.disconnect();
      media.removeEventListener("change", alCambiarMovimiento);
      zona.removeEventListener("pointerenter", alEntrar);
      zona.removeEventListener("pointermove", alMover);
      zona.removeEventListener("pointerleave", alSalir);
      zona.removeEventListener("pointerdown", alPulsar);
      zona.removeEventListener("pointerup", alSoltar);
      zona.removeEventListener("pointercancel", alSoltar);
      zona.removeEventListener("touchmove", alTocarMover);
      zona.removeEventListener("focus", alFoco);
      zona.removeEventListener("blur", alDesenfocar);
      window.removeEventListener("scroll", alScroll);
      window.removeEventListener("resize", alRedimensionar);
      m?.destruir();
      m = null;
    };
  }, []);

  return (
    <div
      ref={marco}
      className="retrato"
      data-activo={activo || undefined}
      data-listo={listo || undefined}
      data-fase={fase}
      tabIndex={0}
      role="img"
      aria-label={di(textos.retratoAria)}
    >
      <img
        className="retrato-normal"
        src={`${RETRATO}normal.jpg`}
        alt=""
        draggable={false}
        fetchPriority="high"
        style={{ objectPosition: `${FOCO.x * 100}% ${FOCO.y * 100}%` }}
      />
      <canvas ref={lienzo} className="retrato-alter" aria-hidden="true" />
      {/* HUD: datos que solo aparecen bajo la máscara del cursor. */}
      {MOSTRAR_HUD && (
        <div className="retrato-hud">
          {HUD.map((d, i) => (
            <p
              key={i}
              className={`hud-dato hud-${d.lado}${d.grande ? " hud-grande" : ""}`}
              style={{ left: `${d.x}%`, top: `${d.y}%` }}
            >
              <span className="hud-etiqueta">{di(d.etiqueta)}</span>
              <span className="hud-valor">{di(d.valor)}</span>
            </p>
          ))}
          <p className="hud-frase">{di(textos.frase)}</p>
        </div>
      )}
      <canvas
        ref={lienzoSecuencia}
        className="retrato-secuencia"
        aria-hidden="true"
      />
      {/* Intro: por detrás de la línea de escaneo asoma el cyborg, en una
          franja que baja con ella y se va al terminar. */}
      <img
        className="retrato-intro"
        src={`${RETRATO}alter.jpg`}
        alt=""
        aria-hidden="true"
        draggable={false}
        style={{ objectPosition: `${FOCO.x * 100}% ${FOCO.y * 100}%` }}
      />
      <span className="retrato-escaner" aria-hidden="true" />
    </div>
  );
}
