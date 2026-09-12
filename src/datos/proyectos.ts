/**
 * La bitácora. Cada proyecto es una entrada con su tira de metadatos.
 *
 * `parrafos` acepta texto plano; lo que envuelvas entre **dobles asteriscos**
 * se resalta en el color de tinta fuerte (ver `src/componentes/Prosa.tsx`).
 * `destacado` es el bloque con la barra naranja: úsalo para el dato más
 * contundente del proyecto, uno por entrada.
 */

export type Estado = "activo" | "entregado" | "archivo";

export interface Proyecto {
  id: string;
  nombre: string;
  subtitulo: string;
  estado: Estado;
  estadoTexto: string;
  periodo: string;
  rol: string;
  contexto: string;
  parrafos: string[];
  destacado?: string;
  parrafosFinales?: string[];
  tecnologias: string[];
  enlaces?: { etiqueta: string; url: string }[];
}

export const proyectos: Proyecto[] = [
  {
    id: "senda",
    nombre: "SENDA",
    subtitulo: "Análisis inteligente de video para testimonios",
    estado: "activo",
    estadoTexto: "En desarrollo",
    periodo: "2026 — actual",
    rol: "Autor · full-stack",
    contexto: "Trabajo de grado",
    parrafos: [
      "Convierte un testimonio grabado en **segmentos navegables, hechos contrastados y rutas institucionales verificables**. Backend único en FastAPI, frontend en React con TypeScript, clasificación con BETO y búsqueda de texto completo sobre SQLite FTS5.",
    ],
    destacado:
      "El video, las transcripciones, los hechos, los consentimientos y la auditoría se cifran con AES-256-GCM y claves derivadas por registro. Los videos se cifran por bloques para que el backend siga sirviendo peticiones Range — se puede saltar a la mitad del video sin descifrarlo entero.",
    parrafosFinales: [
      "La demostración incluida es completamente sintética: ningún testimonio real toca el sistema durante el desarrollo.",
    ],
    tecnologias: [
      "FastAPI",
      "React + TS",
      "AES-256-GCM",
      "SQLite FTS5",
      "BETO",
      "FFmpeg",
      "Docker Compose",
      "Caddy",
    ],
    enlaces: [
      { etiqueta: "Repositorio [pendiente]", url: "#" },
      { etiqueta: "Documento de tesis [pendiente]", url: "#" },
    ],
  },
  {
    id: "clara",
    nombre: "CLARA",
    subtitulo: "Captura por Lenguaje Asistido con Reconocimiento y Análisis",
    estado: "entregado",
    estadoTexto: "Entregado",
    periodo: "22–26 jul 2026",
    rol: "Equipo · reto 4",
    contexto: "Hackathon Colsubsidio × 30X",
    parrafos: [
      "El operario de una bodega se identifica con el rostro o un PIN, **dicta lo que contó** —«quedan nueve cajas de harina»— y CLARA lo vuelve un registro estructurado, lo valida contra el catálogo y el histórico, y al cierre genera un acta firmada lista para el ERP.",
    ],
    destacado:
      "En el inventario real del reto (48 bodegas, 1.405 referencias) encontramos 79 saldos físicamente imposibles, 252 referencias sin código y 47.588 unidades fantasma. Ninguno era un error de conteo: eran errores de transcripción en la cadena papel → digitación → revisión. CLARA elimina la cadena.",
    parrafosFinales: [
      "Siete reglas de validación (V1–V7) corren antes de escribir. Si algo no cuadra, Clara pregunta; nada ambiguo se guarda sin confirmación humana explícita.",
    ],
    tecnologias: [
      "React 18 + Vite (PWA)",
      "Zustand",
      "FastAPI",
      "gpt-4o-mini",
      "Whisper",
      "face-api.js",
      "Web Speech API es-CO",
      "WeasyPrint",
      "Telegram Bot API",
    ],
    enlaces: [
      { etiqueta: "Repositorio [pendiente]", url: "#" },
      { etiqueta: "Demo [pendiente]", url: "#" },
    ],
  },
  {
    id: "robots-zoho",
    nombre: "Robots sobre Zoho CRM",
    subtitulo: "Validación documental y normalización de datos a escala",
    estado: "activo",
    estadoTexto: "En producción",
    periodo: "2026 — actual",
    rol: "Automatización",
    contexto: "Operación de seguros",
    parrafos: [
      "Conjunto de bots en Python que sostienen tareas que nadie quiere hacer a mano: **validación de cartas y firmas enroladas, normalización de direcciones** (globalización, limpieza de números de apartamento) y generación de reportes sobre miles de contactos del CRM.",
      "Cada bot deja su reporte de cambios: lo que tocó, lo que omitió y por qué. Un cambio masivo sin bitácora es un cambio que nadie puede revertir.",
    ],
    tecnologias: [
      "Python",
      "Zoho CRM API",
      "pytest",
      "CSV / reportes",
      "pandas",
    ],
  },
  {
    id: "pav-mood",
    nombre: "PavéMood",
    subtitulo: "Sitio y catálogo para una marca de postres",
    estado: "archivo",
    estadoTexto: "Archivo",
    periodo: "No publicado",
    rol: "Desarrollo web",
    contexto: "Cliente",
    parrafos: [
      "Sitio web desarrollado para **PavéMood** con HTML, CSS y JavaScript. Los detalles del caso de estudio estarán disponibles próximamente.",
    ],
    tecnologias: ["HTML / CSS", "JavaScript"],
  },
];
