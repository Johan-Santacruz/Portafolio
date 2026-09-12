import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

export function useRevelarCampana() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const elementos = Array.from(
      document.querySelectorAll<HTMLElement>("[data-aparicion]"),
    );
    let observer: IntersectionObserver | undefined;
    const configurar = () => {
      observer?.disconnect();
      if (media.matches || !("IntersectionObserver" in window)) {
        elementos.forEach((elemento) =>
          elemento.classList.remove("aparicion-pendiente"),
        );
        return;
      }
      observer = new IntersectionObserver(
        (entradas) => {
          entradas.forEach((entrada) => {
            if (entrada.isIntersecting) {
              entrada.target.classList.remove("aparicion-pendiente");
              observer?.unobserve(entrada.target);
            }
          });
        },
        { threshold: 0.08, rootMargin: "0px 0px -30px 0px" },
      );
      elementos.forEach((elemento) => {
        elemento.classList.add("aparicion-pendiente");
        observer?.observe(elemento);
      });
    };
    configurar();
    media.addEventListener("change", configurar);
    return () => {
      observer?.disconnect();
      media.removeEventListener("change", configurar);
      elementos.forEach((elemento) =>
        elemento.classList.remove("aparicion-pendiente"),
      );
    };
  }, []);
}

/**
 * Mantiene un vídeo decorativo reproduciéndose solo cuando está a la vista,
 * la pestaña está activa y el sistema no pide movimiento reducido.
 * Devuelve la referencia del vídeo y la de la zona que hay que vigilar.
 */
export function useVideoEnVista<T extends HTMLElement>() {
  const video = useRef<HTMLVideoElement>(null);
  const zona = useRef<T>(null);
  const [reducido, setReducido] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const elemento = video.current;
    const contenedor = zona.current;
    if (!elemento || !contenedor) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = contenedor.getBoundingClientRect().bottom > 0;

    // Safari con ahorro de energía (y algunos navegadores móviles) rechazan el
    // autoplay aunque el vídeo esté en silencio: si pasa, lo reintentamos con
    // el primer gesto de la persona. Hasta entonces se ve el póster.
    let reintentoPendiente = false;
    const reintentarConGesto = () => {
      if (reintentoPendiente) return;
      reintentoPendiente = true;
      const quitarGestos = () => {
        document.removeEventListener("pointerdown", intentar);
        document.removeEventListener("keydown", intentar);
        window.removeEventListener("scroll", intentar);
      };
      const intentar = () => {
        reintentoPendiente = false;
        quitarGestos();
        actualizar();
      };
      document.addEventListener("pointerdown", intentar, { once: true });
      document.addEventListener("keydown", intentar, { once: true });
      window.addEventListener("scroll", intentar, {
        once: true,
        passive: true,
      });
    };

    const actualizar = () => {
      setReducido(media.matches);
      if (media.matches || !visible || document.hidden) elemento.pause();
      else void elemento.play().catch(reintentarConGesto);
    };
    const observer = new IntersectionObserver(
      ([entrada]) => {
        visible = entrada.isIntersecting;
        actualizar();
      },
      { threshold: 0 },
    );
    observer.observe(contenedor);
    media.addEventListener("change", actualizar);
    document.addEventListener("visibilitychange", actualizar);
    actualizar();
    return () => {
      observer.disconnect();
      media.removeEventListener("change", actualizar);
      document.removeEventListener("visibilitychange", actualizar);
      elemento.pause();
    };
  }, []);
  return { video, zona, reducido };
}

/**
 * Escribe en `--salida` (0 a 1) cuánto se ha salido ya de la portada, para que
 * el inicio se despida al bajar: el vídeo se queda atrás, el texto sube y se
 * desvanece, y el fondo se funde a negro antes de que llegue la sección clara.
 * Con movimiento reducido se queda en 0 y no se escucha el scroll.
 */
export function useSalidaPortada(zona: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const elemento = zona.current;
    if (!elemento) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let pendiente = false;

    const calcular = () => {
      pendiente = false;
      const alto = elemento.offsetHeight || window.innerHeight;
      const avance = Math.min(1, Math.max(0, window.scrollY / alto));
      elemento.style.setProperty("--salida", avance.toFixed(4));
    };
    const alHacerScroll = () => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(calcular);
    };
    const configurar = () => {
      window.removeEventListener("scroll", alHacerScroll);
      window.removeEventListener("resize", alHacerScroll);
      if (media.matches) {
        elemento.style.setProperty("--salida", "0");
        return;
      }
      window.addEventListener("scroll", alHacerScroll, { passive: true });
      window.addEventListener("resize", alHacerScroll);
      calcular();
    };
    configurar();
    media.addEventListener("change", configurar);
    return () => {
      media.removeEventListener("change", configurar);
      window.removeEventListener("scroll", alHacerScroll);
      window.removeEventListener("resize", alHacerScroll);
    };
  }, [zona]);
}

/**
 * Da profundidad al recorrido: lo que se va por arriba retrocede (se aleja y
 * se apaga) y vuelve intacto si se sube. Escribe `--atras` (0 a 1) en cada
 * elemento marcado con `data-profundidad`.
 *
 * Es una función pura de la posición del scroll, así que ir y volver deja
 * siempre el mismo estado; no hay nada que "ya pasó".
 */
export function useProfundidad() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Cada bloque de contenido es un tablón de la rueda. La portada queda fuera:
    // ya tiene su propia despedida.
    const piezas = Array.from(
      document.querySelectorAll<HTMLElement>("[data-aparicion]"),
    ).filter((pieza) => !pieza.closest(".campana-hero"));
    if (!piezas.length) return;
    let pendiente = false;

    const calcular = () => {
      pendiente = false;
      const alto = window.innerHeight;
      // El giro se mide por el centro del bloque y ocurre en la franja alta de
      // la pantalla: si se espera al borde inferior, para cuando gira ya está
      // fuera de cuadro y no se ve nada.
      const recorrido = alto * 0.45 || 1;
      for (const pieza of piezas) {
        const caja = pieza.getBoundingClientRect();
        const centro = caja.top + caja.height / 2;
        const atras = Math.min(
          1,
          Math.max(0, (recorrido - centro) / recorrido),
        );
        // Fuera del giro el bloque se queda limpio: sin transform ni filter no
        // hay capa de composición y el texto se rasteriza nítido.
        if (atras > 0) {
          pieza.style.setProperty("--atras", atras.toFixed(4));
          pieza.classList.add("girando");
        } else {
          pieza.style.removeProperty("--atras");
          pieza.classList.remove("girando");
        }
      }
    };
    const alHacerScroll = () => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(calcular);
    };
    const configurar = () => {
      window.removeEventListener("scroll", alHacerScroll);
      window.removeEventListener("resize", alHacerScroll);
      if (media.matches) {
        for (const pieza of piezas) {
          pieza.style.removeProperty("--atras");
          pieza.classList.remove("girando");
        }
        return;
      }
      window.addEventListener("scroll", alHacerScroll, { passive: true });
      window.addEventListener("resize", alHacerScroll);
      calcular();
    };
    configurar();
    media.addEventListener("change", configurar);
    return () => {
      media.removeEventListener("change", configurar);
      window.removeEventListener("scroll", alHacerScroll);
      window.removeEventListener("resize", alHacerScroll);
      for (const pieza of piezas) pieza.classList.remove("girando");
    };
  }, []);
}
