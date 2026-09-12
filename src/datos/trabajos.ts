/**
 * Los trabajos que se muestran en el portafolio.
 * El primero se presenta en grande, con capturas reales; los demás van como
 * filas. Para añadir uno nuevo basta con escribirlo aquí.
 */

export interface Captura {
  src: string;
  alt: string;
}

export interface Landing {
  src: string;
  alt: string;
  etiqueta: string;
}

export interface Trabajo {
  id: string;
  nombre: string;
  resumen: string;
  contexto: string;
  periodo: string;
  rol: string;
  descripcion: string;
  stack: string[];
  repositorio?: string;
  capturas?: Captura[];
  /** La página de entrada completa, para verla de arriba abajo. */
  landing?: Landing;
}

export const trabajos: Trabajo[] = [
  {
    id: "senda",
    nombre: "SENDA",
    resumen: "Un testimonio en video convertido en una ruta de atención",
    contexto: "Trabajo de grado",
    periodo: "2025 — 2026",
    rol: "Diseño y desarrollo completo",
    descripcion:
      "Una persona desplazada cuenta su historia en video. SENDA la organiza en fragmentos, extrae los hechos, los contrasta con fuentes oficiales y propone rutas institucionales verificables. Nada se publica sin que una persona lo confirme: la ruta no se muestra mientras queden señales críticas sin revisar. Todo el material sensible se cifra por registro.",
    stack: [
      "FastAPI",
      "React + TypeScript",
      "BETO (NLP en español)",
      "Whisper",
      "AES-256-GCM",
      "SQLite FTS5",
    ],
    capturas: [
      {
        src: "/imagenes/trabajos/senda-libro.jpg",
        alt: "Portada de SENDA: un libro abierto que introduce el contexto del desplazamiento en Colombia",
      },
      {
        src: "/imagenes/trabajos/senda-senales.jpg",
        alt: "Pantalla de señales: el sistema pide confirmar la clasificación antes de continuar",
      },
      {
        src: "/imagenes/trabajos/senda-ruta.jpg",
        alt: "Pantalla de rutas institucionales, bloqueada mientras haya señales críticas sin confirmar",
      },
    ],
    landing: {
      src: "/imagenes/landings/senda.jpg",
      alt: "Recorrido completo de entrada de SENDA: el libro, una doble página interior, la pantalla de señales y el cierre",
      etiqueta: "Ver el recorrido completo",
    },
  },
  {
    id: "gobla",
    nombre: "Oculus Auditor",
    resumen: "Detección de opacidad en contratos públicos del SECOP II",
    contexto: "Hackathon · Bogotá",
    periodo: "2026",
    rol: "Backend e integración de IA",
    descripcion:
      "Un agente revisa la contratación pública publicada en el SECOP II, puntúa señales de opacidad y levanta alertas con su evidencia. Los hallazgos salen como reporte y llegan por Telegram.",
    stack: ["FastAPI", "React", "SQLite", "OpenAI", "Telegram"],
    repositorio: "https://github.com/Johan-Santacruz/BogotaHackColombia5.0",
    capturas: [
      {
        src: "/imagenes/trabajos/oculus-inicio.jpg",
        alt: "Portada de Oculus Auditor: «La corrupción en contratos públicos no debería ser invisible»",
      },
      {
        src: "/imagenes/trabajos/oculus-mapa.jpg",
        alt: "Mapa de riesgo nacional por departamento dentro del panel de Oculus Auditor",
      },
    ],
    landing: {
      src: "/imagenes/landings/oculus.jpg",
      alt: "Landing completa de Oculus Auditor, de la portada al cierre",
      etiqueta: "Ver la landing completa",
    },
  },
  {
    id: "nimbus",
    nombre: "Nimbus",
    resumen: "Alerta temprana de lluvia para San Cristóbal, Galápagos",
    contexto: "SALA Hackathon · Galapagos Science Center",
    periodo: "2026",
    rol: "Por confirmar",
    descripcion:
      "Once años de registros de cuatro estaciones meteorológicas convertidos en pronósticos de precipitación a +1, +3 y +6 horas. La misma predicción se presenta de tres maneras según quién mira: métricas de modelo para el equipo de ML, datos en tiempo real para meteorología y alertas simples por Telegram para la comunidad.",
    stack: [
      "PyTorch",
      "Python",
      "React + Vite",
      "Framer Motion",
      "Recharts",
      "Telegram",
    ],
    repositorio: "https://github.com/Karlyvelasquez/Nimbus",
    capturas: [
      {
        src: "/imagenes/trabajos/nimbus-inicio.jpg",
        alt: "Portada de Nimbus: «Transform data into predictions that save», con el conteo de estaciones y años de datos",
      },
      {
        src: "/imagenes/trabajos/nimbus-roles.jpg",
        alt: "Las tres interfaces de Nimbus: experto en ML, meteorólogo y comunidad de Galápagos",
      },
    ],
    landing: {
      src: "/imagenes/landings/nimbus.jpg",
      alt: "Landing completa de Nimbus, de la portada al pie",
      etiqueta: "Ver la landing completa",
    },
  },
  {
    id: "agenx",
    nombre: "AgentX",
    resumen: "Recepción y clasificación automática de incidentes",
    contexto: "Hackathon",
    periodo: "2026",
    rol: "Backend e integraciones",
    descripcion:
      "Los incidentes entran por varios canales, se clasifican y enriquecen con IA, y salen convertidos en tickets de Jira con las personas correctas notificadas.",
    stack: ["React + Vite", "Node.js", "Express", "SQLite", "Jira", "OpenAI"],
    repositorio: "https://github.com/Johan-Santacruz/AgenX-Hackathon",
    capturas: [
      {
        src: "/imagenes/trabajos/agentx-inicio.jpg",
        alt: "Portada de AgentX: «The agent that resolves incidents»",
      },
      {
        src: "/imagenes/trabajos/agentx-integraciones.jpg",
        alt: "Integraciones de AgentX con Saleor, Jira, Gmail y una API REST",
      },
    ],
    landing: {
      src: "/imagenes/landings/agentx.jpg",
      alt: "Landing completa de AgentX, de la portada a las integraciones",
      etiqueta: "Ver la landing completa",
    },
  },
];
