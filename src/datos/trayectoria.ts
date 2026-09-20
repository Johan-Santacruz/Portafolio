/**
 * El expediente: experiencia, investigación, formación e idiomas. Las
 * habilidades blandas viven con las técnicas, en `datos/stack.ts`. Cada
 * bloque es una parada del carril horizontal (ver `Trayectoria.tsx`). Sale de
 * la hoja de vida
 * (`public/documentos/hoja-de-vida-johan-balanta.pdf`): si cambias una,
 * cambia la otra.
 */

export interface Hito {
  /** Fechas, tal como se leen en la parada. */
  periodo: string;
  titulo: string;
  /** Empresa, universidad o publicación. */
  lugar: string;
  /** Lo que se hizo, en frases sueltas. Puede ir vacío. */
  detalle: string[];
  /** Un dato que resume el hito, en grande. */
  cifra?: { valor: string; pie: string };
}

export const experiencia: Hito[] = [
  {
    periodo: "feb 2026 — hoy",
    titulo: "Desarrollador RPA e integrador de APIs / IA",
    lugar: "Familia Insurances · Massachusetts, EE. UU. · Híbrido",
    detalle: [
      "Automatizaciones que le quitan trabajo manual a los procesos internos.",
      "APIs, servicios externos y modelos de IA metidos en los flujos de la empresa.",
      "Pruebas, validación y calidad de lo que sale a producción.",
    ],
    cifra: { valor: "EE. UU.", pie: "En remoto desde Cali" },
  },
];

export const investigacion: Hito[] = [
  {
    periodo: "2025 — hoy",
    titulo: "Grupo de investigación PADIA",
    lugar: "Universidad de San Buenaventura, Cali",
    detalle: [
      "Programación, inteligencia artificial y análisis de datos aplicados a problemas reales.",
    ],
  },
  {
    periodo: "2025",
    titulo: "Publicación IEEE · AMITIC",
    lugar: "«Evaluation of Dynamic Programming with Memoization and Greedy-First Search for Route Planning in Mobile Robots»",
    detalle: [
      "Planificación de rutas y optimización en robótica móvil, publicada en IEEE Xplore.",
    ],
    cifra: { valor: "IEEE", pie: "Revisión por pares" },
  },
];

export const formacion: Hito[] = [
  {
    periodo: "8.º semestre",
    titulo: "Ingeniería de Sistemas",
    lugar: "Universidad de San Buenaventura, Cali",
    detalle: [],
    cifra: { valor: "8.º", pie: "Semestre en curso" },
  },
  {
    periodo: "Bachillerato",
    titulo: "Técnico en Electricidad Industrial",
    lugar: "Institución Educativa Rafael Navia Varón",
    detalle: [],
  },
];

export const idiomas = [
  { lengua: "Español", nivel: "Nativo", barra: 1 },
  { lengua: "Inglés", nivel: "B1", barra: 0.55 },
] as const;
