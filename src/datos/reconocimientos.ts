/**
 * Lo que han dicho otros. No son proyectos: son publicaciones de la
 * universidad y del semillero que dejan constancia de un logro, con fecha y
 * enlace. Van al final del capítulo de proyectos, como su respaldo.
 *
 * Cada una lleva el medio que la publicó, porque el valor está en quién lo
 * dice, no en el titular.
 */
import type { Par } from "../idioma/idioma";

export interface Reconocimiento {
  /** Estable y sin traducir: es la clave de React. */
  id: string;
  /** Quién lo publicó. Nombre propio, no se traduce. */
  medio: string;
  /** Dónde, para el icono y para decirlo en voz alta. */
  red: "instagram" | "linkedin";
  fecha: Par;
  /** Qué deja constancia, en una línea. */
  titulo: Par;
  url: string;
  /** La vista previa de la publicación, en `public/imagenes/reconocimientos/`.
   *  La baja y la recorta `scripts/reconocimientos.mjs`. */
  imagen: string;
  alt: Par;
}

export const reconocimientos: Reconocimiento[] = [
  {
    id: "usb-hackathon",
    medio: "Universidad de San Buenaventura Cali",
    red: "instagram",
    fecha: { es: "Junio 2026", en: "June 2026" },
    titulo: {
      es: "Ganadores de la Hackatón Colombia 5.0",
      en: "Winners of Hackathon Colombia 5.0",
    },
    url: "https://www.instagram.com/p/DZvCJSRil7O/",
    imagen: "usb-hackathon.jpg",
    alt: {
      es: "Johan Camilo Balanta con la placa de la Hackatón Colombia 5.0 en las manos",
      en: "Johan Camilo Balanta holding the Hackathon Colombia 5.0 award",
    },
  },
  {
    id: "padia-sala",
    medio: "Semillero PADIA",
    red: "instagram",
    fecha: { es: "Marzo 2026", en: "March 2026" },
    titulo: {
      es: "Selección para representar a la universidad en el SALA Summit of AI in Latam",
      en: "Selected to represent the university at the SALA Summit of AI in Latam",
    },
    url: "https://www.instagram.com/p/DVjoC5QjwEE/",
    imagen: "padia-sala.jpg",
    alt: {
      es: "Pieza del Semillero PADIA con su retrato junto al colibrí del SALA Summit",
      en: "Graphic from the PADIA research group with his portrait beside the SALA Summit hummingbird",
    },
  },
  {
    id: "usb-sala",
    medio: "Facultad de Ingeniería · USB Cali",
    red: "linkedin",
    fecha: { es: "2026", en: "2026" },
    titulo: {
      es: "La facultad destaca el paso por el SALA 2026, en Quito",
      en: "The faculty highlights the time at SALA 2026, in Quito",
    },
    url: "https://www.linkedin.com/feed/update/urn:li:activity:7437654534367105026/",
    imagen: "usb-sala.jpg",
    alt: {
      es: "Johan y una compañera en el auditorio del SALA 2026, con sus escarapelas en alto",
      en: "Johan and a teammate in the SALA 2026 auditorium, holding up their badges",
    },
  },
];
