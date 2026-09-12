import type { JSX } from "react";

/**
 * Resalta los tramos entre **dobles asteriscos** con la tinta fuerte.
 * Es todo el "markdown" que necesita este portafolio; si algún día hace
 * falta más, cámbialo por una librería en vez de ampliar esta función.
 */
export function Prosa({
  texto,
  className,
}: {
  texto: string;
  className?: string;
}) {
  const piezas: (string | JSX.Element)[] = [];
  const patron = /\*\*(.+?)\*\*/g;
  let ultimo = 0;
  let coincidencia: RegExpExecArray | null;

  while ((coincidencia = patron.exec(texto)) !== null) {
    if (coincidencia.index > ultimo)
      piezas.push(texto.slice(ultimo, coincidencia.index));
    piezas.push(<strong key={coincidencia.index}>{coincidencia[1]}</strong>);
    ultimo = coincidencia.index + coincidencia[0].length;
  }
  if (ultimo < texto.length) piezas.push(texto.slice(ultimo));

  return <p className={className}>{piezas}</p>;
}
