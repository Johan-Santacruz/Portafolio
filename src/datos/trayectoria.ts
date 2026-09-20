/**
 * Experiencia, formación y competencias. Sale de la hoja de vida
 * (`public/documentos/hoja-de-vida-johan-balanta.pdf`): si cambias una, cambia
 * la otra.
 */

export interface Hito {
  /** Fechas, tal como se leen en la línea de tiempo. */
  periodo: string;
  titulo: string;
  /** Empresa, universidad o publicación. */
  lugar: string;
  /** Lo que se hizo, en frases sueltas. Puede ir vacío. */
  detalle: string[];
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
  },
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
  },
];

export const formacion: Hito[] = [
  {
    periodo: "8.º semestre",
    titulo: "Ingeniería de Sistemas",
    lugar: "Universidad de San Buenaventura, Cali",
    detalle: [],
  },
  {
    periodo: "Bachillerato",
    titulo: "Técnico en Electricidad Industrial",
    lugar: "Institución Educativa Rafael Navia Varón",
    detalle: [],
  },
];

export interface Competencia {
  titulo: string;
  texto: string;
}

/** Habilidades blandas, dichas con lo que significan en el día a día. */
export const competencias: Competencia[] = [
  {
    titulo: "Resolver y analizar",
    texto:
      "Partir un problema grande hasta que queda una lista de cosas comprobables, y empezar por la que más riesgo quita.",
  },
  {
    titulo: "Equipos mezclados",
    texto:
      "Trabajar con gente de otras carreras en hackatones y en investigación, donde nadie sabe todo y hay que ponerse de acuerdo rápido.",
  },
  {
    titulo: "Aprender sobre la marcha",
    texto:
      "Entrar a una herramienta nueva por lo que hay que entregar, no por el tutorial completo, y dejarla documentada para el siguiente.",
  },
  {
    titulo: "Explicar lo técnico",
    texto:
      "Escribir y sustentar: informes de investigación, decisiones de arquitectura y demos ante jurados en cinco minutos.",
  },
  {
    titulo: "Investigar",
    texto:
      "Leer papers, reproducir resultados y publicar lo propio con el método que exige una revisión por pares.",
  },
];

export const idiomas = [
  { lengua: "Español", nivel: "Nativo" },
  { lengua: "Inglés", nivel: "B1" },
] as const;
