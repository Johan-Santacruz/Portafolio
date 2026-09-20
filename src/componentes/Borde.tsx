import type { CSSProperties } from "react";
import "./Borde.css";

/**
 * Costura entre dos secciones. La sección que llega se desliza por encima de
 * la anterior, y su borde superior es una línea lima por la que corre un
 * destello mientras la cubre; a su paso se teclea una orden, como en el
 * túnel. Lee `--borde-p` (0 a 1: de asomar por abajo a cubrir del todo) del
 * contenedor, que lo escribe cada sección con el scroll.
 */
export function Borde({
  orden,
  tono = "claro",
}: {
  orden: string;
  /** Sobre fondo claro u oscuro. */
  tono?: "claro" | "oscuro";
}) {
  return (
    <div className={`borde borde-${tono}`} aria-hidden="true">
      <span className="borde-luz" />
      <p
        className="borde-orden"
        style={{ "--letras": orden.length } as CSSProperties}
      >
        <span className="borde-prompt">~ $</span>
        <span className="borde-tecleo">{orden}</span>
      </p>
    </div>
  );
}
