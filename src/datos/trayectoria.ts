/**
 * La trayectoria como una pila de credenciales: cada sitio donde he estado dio
 * un pase, y los pases se van pasando con el scroll. Poco texto por pase: lo
 * que se lee de un vistazo en un gafete.
 *
 * Sale de la hoja de vida (`public/documentos/hoja-de-vida-johan-balanta.pdf`):
 * si cambia una, cambia la otra. Las habilidades blandas no están aquí: van
 * con las técnicas, en `datos/stack.ts`.
 */
import type { Par } from "../idioma/idioma";

export interface Pase {
  /** Lo que es: trabajo, investigación, publicación, hackatón, grado. */
  tipo: Par;
  /** El año, en grande. */
  año: Par;
  /** Dónde: el nombre que va en el pase, corto. Nombre propio, no se traduce. */
  donde: string;
  /** Qué hice ahí, en una línea. */
  rol: Par;
  /** El sitio, si hace falta situarlo. */
  lugar: Par;
  /** Dos o tres frases cortas. Lo que no cabe en un gafete, sobra. */
  notas: Par[];
  /** El sello: un dato que lo resume, si lo hay. */
  sello?: Par;
  /** Código del pase, decorativo. Estable: es la clave de React. */
  codigo: string;
}

export const pases: Pase[] = [
  {
    tipo: { es: "Trabajo", en: "Work" },
    año: { es: "2026", en: "2026" },
    donde: "Familia Insurances",
    rol: { es: "Desarrollador RPA · APIs · IA", en: "RPA · APIs · AI developer" },
    lugar: {
      es: "Massachusetts, EE. UU. · Híbrido",
      en: "Massachusetts, USA · Hybrid",
    },
    notas: [
      {
        es: "Automatizo procesos internos que antes eran manuales.",
        en: "I automate internal processes that used to be manual.",
      },
      {
        es: "Conecto APIs y modelos de IA a los flujos de la empresa.",
        en: "I connect APIs and AI models to the company's workflows.",
      },
      {
        es: "Pruebo y valido lo que sale a producción.",
        en: "I test and validate what ships to production.",
      },
    ],
    sello: { es: "Actual", en: "Current" },
    codigo: "TRB-2026-01",
  },
  {
    tipo: { es: "Hackatón", en: "Hackathon" },
    año: { es: "2026", en: "2026" },
    donde: "SALA AI Summit",
    rol: {
      es: "Predicción climática con redes neuronales líquidas",
      en: "Weather prediction with liquid neural networks",
    },
    lugar: { es: "Quito, Ecuador", en: "Quito, Ecuador" },
    notas: [
      {
        es: "Modelo de series de tiempo para las Islas Galápagos.",
        en: "Time-series model for the Galápagos Islands.",
      },
      {
        es: "Cuarto lugar entre los proyectos del evento.",
        en: "Fourth place among the projects at the event.",
      },
    ],
    sello: { es: "4.º", en: "4th" },
    codigo: "HCK-2026-02",
  },
  {
    tipo: { es: "Publicación", en: "Publication" },
    año: { es: "2025", en: "2025" },
    donde: "IEEE · AMITIC",
    rol: {
      es: "Planificación de rutas en robótica móvil",
      en: "Path planning for mobile robotics",
    },
    lugar: { es: "Publicado en IEEE Xplore", en: "Published on IEEE Xplore" },
    notas: [
      {
        es: "Programación dinámica con memoización frente a búsqueda voraz.",
        en: "Dynamic programming with memoisation against greedy search.",
      },
      {
        es: "Escrito, sustentado y revisado por pares.",
        en: "Written, defended and peer reviewed.",
      },
    ],
    sello: { es: "IEEE", en: "IEEE" },
    codigo: "PUB-2025-03",
  },
  {
    tipo: { es: "Investigación", en: "Research" },
    año: { es: "2025", en: "2025" },
    donde: "Grupo PADIA",
    rol: {
      es: "Programación, IA y análisis de datos",
      en: "Programming, AI and data analysis",
    },
    lugar: {
      es: "Universidad de San Buenaventura, Cali",
      en: "Universidad de San Buenaventura, Cali",
    },
    notas: [
      {
        es: "Proyectos aplicados a problemas reales, no de laboratorio.",
        en: "Projects applied to real problems, not lab exercises.",
      },
    ],
    codigo: "INV-2025-04",
  },
  {
    tipo: { es: "Grado", en: "Degree" },
    año: { es: "En curso", en: "Ongoing" },
    donde: "Ingeniería de Sistemas",
    rol: {
      es: "Universidad de San Buenaventura, Cali",
      en: "Universidad de San Buenaventura, Cali",
    },
    lugar: {
      es: "Antes: técnico en Electricidad Industrial",
      en: "Before: technician in Industrial Electricity",
    },
    notas: [{ es: "Octavo semestre.", en: "Eighth semester." }],
    sello: { es: "8.º", en: "8th" },
    codigo: "EDU-2022-05",
  },
];

export const idiomas = [
  { lengua: { es: "Español", en: "Spanish" }, nivel: { es: "Nativo", en: "Native" } },
  { lengua: { es: "Inglés", en: "English" }, nivel: { es: "B1", en: "B1" } },
] satisfies { lengua: Par; nivel: Par }[];
