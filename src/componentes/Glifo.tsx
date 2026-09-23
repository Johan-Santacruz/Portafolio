import type { CSSProperties, ReactNode } from "react";

/**
 * Un esquema pequeño por habilidad blanda: no un icono cualquiera, sino un
 * diagrama que enseña lo que dice la palabra. Resolutivo parte un problema
 * en ramas hasta que cada hoja se puede comprobar; responsable llega a la
 * fecha justo; adaptativo rodea el obstáculo; y así.
 *
 * Todo es trazo, en el lienzo de 160 × 90, con `pathLength` 1: así el CSS
 * dibuja cada línea igual, sea cual sea su largo, y las encadena con --j
 * (el orden dentro del esquema). La pieza en lima (`acento`) se dibuja al
 * final: es la conclusión del diagrama.
 */

/** Cada trazo lleva su orden de dibujo. */
const t = (j: number) => ({ "--j": j }) as CSSProperties;

const ESQUEMAS: Record<string, ReactNode> = {
  // Parte el problema hasta que cada hoja se puede comprobar.
  resolutivo: (
    <>
      <rect x="6" y="36" width="24" height="18" pathLength={1} style={t(0)} />
      <path d="M30 45 H42 V22 H56 M42 45 V68 H56" pathLength={1} style={t(1)} />
      <rect x="56" y="14" width="18" height="16" pathLength={1} style={t(2)} />
      <rect x="56" y="60" width="18" height="16" pathLength={1} style={t(2)} />
      <path
        d="M74 22 H86 V12 H98 M86 22 V32 H98 M74 68 H86 V58 H98 M86 68 V78 H98"
        pathLength={1}
        style={t(3)}
      />
      <rect x="98" y="7" width="12" height="10" pathLength={1} style={t(4)} />
      <rect x="98" y="27" width="12" height="10" pathLength={1} style={t(4)} />
      <rect x="98" y="53" width="12" height="10" pathLength={1} style={t(4)} />
      <rect x="98" y="73" width="12" height="10" pathLength={1} style={t(4)} />
      <path
        className="acento"
        d="M120 12 l4 4 l9 -9 M120 32 l4 4 l9 -9 M120 58 l4 4 l9 -9 M120 78 l4 4 l9 -9"
        pathLength={1}
        style={t(5)}
      />
    </>
  ),
  // Lo prometido para una fecha sale en esa fecha: la barra cae en la marca.
  responsable: (
    <>
      <path d="M6 64 H154" pathLength={1} style={t(0)} />
      <path
        d="M6 60 V68 M36 60 V68 M66 60 V68 M96 60 V68 M126 60 V68 M154 60 V68"
        pathLength={1}
        style={t(1)}
      />
      <path d="M6 46 H122" className="grueso" pathLength={1} style={t(2)} />
      <path
        className="acento"
        d="M126 22 V68 M126 22 H146 L140 29 L146 36 H126"
        pathLength={1}
        style={t(3)}
      />
    </>
  ),
  // Cambian los requisitos y el plan cambia: rodea lo que estorba.
  adaptativo: (
    <>
      <circle cx="12" cy="52" r="4" pathLength={1} style={t(0)} />
      <circle cx="148" cy="52" r="4" pathLength={1} style={t(0)} />
      <path d="M16 52 H144" className="tenue" pathLength={1} style={t(1)} />
      <rect x="68" y="40" width="24" height="24" pathLength={1} style={t(2)} />
      <path d="M68 40 L92 64 M92 40 L68 64" pathLength={1} style={t(3)} />
      <path
        className="acento"
        d="M16 52 C40 52 44 14 80 14 C116 14 120 52 144 52"
        pathLength={1}
        style={t(4)}
      />
    </>
  ),
  // Se entiende con gente de otras carreras: todos pasan por el centro.
  colaborativo: (
    <>
      <path
        d="M80 45 L24 45 M80 45 L50 12 M80 45 L110 12 M80 45 L136 45 M80 45 L110 78 M80 45 L50 78"
        pathLength={1}
        style={t(0)}
      />
      <path
        d="M24 45 L50 12 L110 12 L136 45 L110 78 L50 78 Z"
        className="tenue"
        pathLength={1}
        style={t(1)}
      />
      <circle cx="24" cy="45" r="5" pathLength={1} style={t(2)} />
      <circle cx="50" cy="12" r="5" pathLength={1} style={t(2)} />
      <circle cx="110" cy="12" r="5" pathLength={1} style={t(2)} />
      <circle cx="136" cy="45" r="5" pathLength={1} style={t(2)} />
      <circle cx="110" cy="78" r="5" pathLength={1} style={t(2)} />
      <circle cx="50" cy="78" r="5" pathLength={1} style={t(2)} />
      <circle className="acento" cx="80" cy="45" r="9" pathLength={1} style={t(3)} />
    </>
  ),
  // Aprende lo que el proyecto pide: sube escalón a escalón y sigue.
  autodidacta: (
    <>
      <path d="M6 84 H154" className="tenue" pathLength={1} style={t(0)} />
      <path
        d="M6 78 H28 V64 H50 V52 H72 V40 H94 V30 H116 V20"
        pathLength={1}
        style={t(1)}
      />
      <path
        className="acento"
        d="M116 20 H152 M144 12 L152 20 L144 28"
        pathLength={1}
        style={t(2)}
      />
    </>
  ),
  // Deja el código donde el siguiente lo encuentre: todo en su rama.
  ordenado: (
    <>
      <path d="M14 8 V82" pathLength={1} style={t(0)} />
      <path d="M14 16 H26 M14 32 H26 M14 48 H26 M14 64 H26 M14 80 H26" pathLength={1} style={t(1)} />
      <path d="M32 16 H104 M32 32 H86 M32 64 H96 M32 80 H70" pathLength={1} style={t(2)} />
      <path d="M32 48 H132" className="acento grueso" pathLength={1} style={t(3)} />
    </>
  ),
  // Sustenta lo que construye: habla, y se le oye.
  comunicativo: (
    <>
      <path d="M8 12 H94 V56 H40 L28 72 V56 H8 Z" pathLength={1} style={t(0)} />
      <path d="M20 26 H82 M20 40 H66" pathLength={1} style={t(1)} />
      <path
        className="acento"
        d="M106 24 Q114 34 106 44 M118 16 Q130 34 118 52 M130 8 Q146 34 130 60"
        pathLength={1}
        style={t(2)}
      />
    </>
  ),
  // Publica con revisión por pares: el documento, bajo la lupa, aprobado.
  riguroso: (
    <>
      <path d="M12 6 H66 L80 20 V84 H12 Z M66 6 V20 H80" pathLength={1} style={t(0)} />
      <path d="M22 34 H70 M22 46 H70 M22 58 H58 M22 70 H64" pathLength={1} style={t(1)} />
      <circle cx="110" cy="44" r="20" pathLength={1} style={t(2)} />
      <path d="M124 58 L146 80" className="grueso" pathLength={1} style={t(3)} />
      <path className="acento" d="M101 44 l6 6 l12 -12" pathLength={1} style={t(4)} />
    </>
  ),
};

export function Glifo({ id }: { id: string }) {
  const esquema = ESQUEMAS[id];
  if (!esquema) return null;
  return (
    <svg className="herr-glifo" viewBox="0 0 160 90" aria-hidden="true" focusable="false">
      {esquema}
    </svg>
  );
}
