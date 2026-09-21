/**
 * El portafolio en dos idiomas. La página nace en español; el botón de la
 * cabecera la pasa a inglés y la elección se recuerda.
 *
 * Todo lo que se lee está escrito dos veces, como un `Par`. Los componentes
 * piden `di(...)` y reciben la versión del idioma activo. Lo que no se
 * traduce (nombres propios, tecnologías, fechas) sigue siendo un `string`
 * normal, y `di` lo devuelve tal cual.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

export type Idioma = "es" | "en";

/** Un texto en los dos idiomas. */
export interface Par {
  es: string;
  en: string;
}

/** Un `Par`, o algo que no hace falta traducir. */
export type Decible = Par | string;

/** Dónde se recuerda la elección. La lee también el guion de `index.html`. */
export const LLAVE = "portafolio:idioma";

/** El idioma guardado, o español. En modo privado leer puede fallar. */
export function idiomaGuardado(): Idioma {
  try {
    const v = localStorage.getItem(LLAVE);
    if (v === "es" || v === "en") return v;
  } catch {
    /* sin almacenamiento: español */
  }
  return "es";
}

/** Cabecera de la pestaña: cambia con el idioma. */
const CABECERA: Record<Idioma, { titulo: string; descripcion: string }> = {
  es: {
    titulo: "Johan Balanta — Ideas que toman forma",
    descripcion:
      "Johan Balanta, ingeniero de software en Cali. Diseño y desarrollo de experiencias digitales, software a medida y automatización con intención.",
  },
  en: {
    titulo: "Johan Balanta — Ideas that take shape",
    descripcion:
      "Johan Balanta, software engineer in Cali, Colombia. Digital experiences, custom software and automation built with intent.",
  },
};

interface Valor {
  idioma: Idioma;
  cambiar: (i: Idioma) => void;
  di: (t: Decible) => string;
}

const Contexto = createContext<Valor>({
  idioma: "es",
  cambiar: () => {},
  di: (t) => (typeof t === "string" ? t : t.es),
});

export function ProveedorIdioma({ children }: { children: ReactNode }) {
  const [idioma, setIdioma] = useState<Idioma>(idiomaGuardado);

  const cambiar = useCallback((nuevo: Idioma) => {
    setIdioma(nuevo);
    try {
      localStorage.setItem(LLAVE, nuevo);
    } catch {
      /* sin almacenamiento: vale para esta visita */
    }
  }, []);

  // El idioma de la página importa para lectores de pantalla, para el
  // corrector del navegador y para quien la comparta.
  useEffect(() => {
    document.documentElement.lang = idioma;
    document.title = CABECERA[idioma].titulo;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", CABECERA[idioma].descripcion);
  }, [idioma]);

  const valor = useMemo<Valor>(
    () => ({
      idioma,
      cambiar,
      di: (t) => (typeof t === "string" ? t : t[idioma]),
    }),
    [idioma, cambiar],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useIdioma() {
  return useContext(Contexto);
}
