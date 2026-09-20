/**
 * La trayectoria como una pila de credenciales: cada sitio donde he estado dio
 * un pase, y los pases se van pasando con el scroll. Poco texto por pase: lo
 * que se lee de un vistazo en un gafete.
 *
 * Sale de la hoja de vida (`public/documentos/hoja-de-vida-johan-balanta.pdf`):
 * si cambia una, cambia la otra. Las habilidades blandas no están aquí: van
 * con las técnicas, en `datos/stack.ts`.
 */

export interface Pase {
  /** Lo que es: trabajo, investigación, publicación, hackatón, grado. */
  tipo: string;
  /** El año, en grande. */
  año: string;
  /** Dónde: el nombre que va en el pase, corto. */
  donde: string;
  /** Qué hice ahí, en una línea. */
  rol: string;
  /** El sitio, si hace falta situarlo. */
  lugar: string;
  /** Dos o tres frases cortas. Lo que no cabe en un gafete, sobra. */
  notas: string[];
  /** El sello: un dato que lo resume, si lo hay. */
  sello?: string;
  /** Código del pase, decorativo. */
  codigo: string;
}

export const pases: Pase[] = [
  {
    tipo: "Trabajo",
    año: "2026",
    donde: "Familia Insurances",
    rol: "Desarrollador RPA · APIs · IA",
    lugar: "Massachusetts, EE. UU. · Híbrido",
    notas: [
      "Automatizo procesos internos que antes eran manuales.",
      "Conecto APIs y modelos de IA a los flujos de la empresa.",
      "Pruebo y valido lo que sale a producción.",
    ],
    sello: "Actual",
    codigo: "TRB-2026-01",
  },
  {
    tipo: "Hackatón",
    año: "2026",
    donde: "SALA AI Summit",
    rol: "Predicción climática con redes neuronales líquidas",
    lugar: "Quito, Ecuador",
    notas: [
      "Modelo de series de tiempo para las Islas Galápagos.",
      "Cuarto lugar entre los proyectos del evento.",
    ],
    sello: "4.º",
    codigo: "HCK-2026-02",
  },
  {
    tipo: "Publicación",
    año: "2025",
    donde: "IEEE · AMITIC",
    rol: "Planificación de rutas en robótica móvil",
    lugar: "Publicado en IEEE Xplore",
    notas: [
      "Programación dinámica con memoización frente a búsqueda voraz.",
      "Escrito, sustentado y revisado por pares.",
    ],
    sello: "IEEE",
    codigo: "PUB-2025-03",
  },
  {
    tipo: "Investigación",
    año: "2025",
    donde: "Grupo PADIA",
    rol: "Programación, IA y análisis de datos",
    lugar: "Universidad de San Buenaventura, Cali",
    notas: ["Proyectos aplicados a problemas reales, no de laboratorio."],
    codigo: "INV-2025-04",
  },
  {
    tipo: "Grado",
    año: "En curso",
    donde: "Ingeniería de Sistemas",
    rol: "Universidad de San Buenaventura, Cali",
    lugar: "Antes: técnico en Electricidad Industrial",
    notas: ["Octavo semestre."],
    sello: "8.º",
    codigo: "EDU-2022-05",
  },
];

export const idiomas = [
  { lengua: "Español", nivel: "Nativo" },
  { lengua: "Inglés", nivel: "B1" },
] as const;
