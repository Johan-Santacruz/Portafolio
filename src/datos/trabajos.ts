/**
 * Los trabajos que se muestran en el portafolio.
 * El primero se presenta en grande, con capturas reales; los demás van como
 * filas. Para añadir uno nuevo basta con escribirlo aquí.
 */
import type { Par } from "../idioma/idioma";

export interface Captura {
  src: string;
  alt: Par;
}

export interface Landing {
  src: string;
  alt: Par;
  etiqueta: Par;
}

export interface Trabajo {
  id: string;
  /** Nombre propio: no se traduce. */
  nombre: string;
  resumen: Par;
  contexto: Par;
  /** Fechas: iguales en los dos idiomas salvo el guion. */
  periodo: string;
  rol: Par;
  descripcion: Par;
  /** Tecnologías: nombres propios. */
  stack: string[];
  repositorio?: string;
  /** Si está publicado y se puede probar. */
  sitio?: string;
  capturas?: Captura[];
  /** La página de entrada completa, para verla de arriba abajo. */
  landing?: Landing;
  /** Cuando el rol aún no está cerrado, la ficha no lo muestra. */
  rolPorConfirmar?: boolean;
}

export const trabajos: Trabajo[] = [
  {
    id: "senda",
    nombre: "SENDA",
    resumen: {
      es: "Un testimonio en video convertido en una ruta de atención",
      en: "A video testimony turned into a route to institutional support",
    },
    contexto: { es: "Trabajo de grado", en: "Final degree project" },
    periodo: "2025 — 2026",
    rol: { es: "Diseño y desarrollo completo", en: "Design and full development" },
    descripcion: {
      es: "Una persona desplazada cuenta su historia en video. SENDA la organiza en fragmentos, extrae los hechos, los contrasta con fuentes oficiales y propone rutas institucionales verificables. Nada se publica sin que una persona lo confirme: la ruta no se muestra mientras queden señales críticas sin revisar. Todo el material sensible se cifra por registro.",
      en: "A displaced person tells their story on video. SENDA breaks it into fragments, extracts the facts, checks them against official sources and proposes verifiable institutional routes. Nothing is published until a person confirms it: the route stays hidden while any critical flag is unreviewed. All sensitive material is encrypted record by record.",
    },
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
        alt: {
          es: "Portada de SENDA: un libro abierto que introduce el contexto del desplazamiento en Colombia",
          en: "SENDA's cover: an open book introducing the context of displacement in Colombia",
        },
      },
      {
        src: "/imagenes/trabajos/senda-senales.jpg",
        alt: {
          es: "Pantalla de señales: el sistema pide confirmar la clasificación antes de continuar",
          en: "Flags screen: the system asks for the classification to be confirmed before going on",
        },
      },
      {
        src: "/imagenes/trabajos/senda-ruta.jpg",
        alt: {
          es: "Pantalla de rutas institucionales, bloqueada mientras haya señales críticas sin confirmar",
          en: "Institutional routes screen, locked while critical flags remain unconfirmed",
        },
      },
    ],
    landing: {
      src: "/imagenes/landings/senda.jpg",
      alt: {
        es: "Recorrido completo de entrada de SENDA: el libro, una doble página interior, la pantalla de señales y el cierre",
        en: "SENDA's full landing page: the book, an inner spread, the flags screen and the closing section",
      },
      etiqueta: { es: "Ver el recorrido completo", en: "See the full walkthrough" },
    },
  },
  {
    id: "clara",
    nombre: "CLARA",
    resumen: {
      es: "Inventario de cocina dictado en voz alta y validado al instante",
      en: "Kitchen inventory dictated aloud and validated on the spot",
    },
    contexto: {
      es: "Hackathon Colsubsidio × 30X · Equipo SOCADE",
      en: "Colsubsidio × 30X hackathon · SOCADE team",
    },
    periodo: "2026",
    rol: { es: "Por confirmar", en: "To be confirmed" },
    rolPorConfirmar: true,
    descripcion: {
      es: "Colsubsidio entregó el inventario real de Piscilago: 48 bodegas y 1.405 referencias. Al revisarlo aparecieron 79 saldos negativos imposibles y 47.588 unidades que nunca existieron. No son errores de conteo, son errores de transcripción que nadie revisa hasta semanas después. CLARA quita esa cadena: quien cuenta lo dicta, la IA estructura la frase y un emparejador determinista resuelve el código de catálogo, nunca el modelo. Las reglas validan en el momento y, si algo no cuadra, pregunta antes de guardar. Funciona sin conexión y al cerrar firma el acta con SHA-256, lista para el ERP.",
      en: "Colsubsidio handed over the real inventory of Piscilago: 48 storerooms and 1,405 references. Reviewing it turned up 79 impossible negative balances and 47,588 units that never existed. These are not counting errors but transcription errors that nobody reviews until weeks later. CLARA removes that chain: whoever counts dictates it, the AI structures the sentence and a deterministic matcher resolves the catalogue code, never the model. Rules validate on the spot and, if something does not add up, it asks before saving. It works offline, and on closing it signs the record with SHA-256, ready for the ERP.",
    },
    stack: [
      "React + Vite",
      "FastAPI",
      "SQLite",
      "OpenAI",
      "Whisper",
      "ElevenLabs",
      "WeasyPrint",
    ],
    repositorio: "https://github.com/Fernando2205/CLARA",
    sitio: "https://somosclara.tech",
    capturas: [
      {
        src: "/imagenes/trabajos/clara-registro.jpg",
        alt: {
          es: "Pantalla de alta de CLARA: nombre, cédula, correo, un teclado para el PIN y la captura del rostro",
          en: "CLARA's sign-up screen: name, ID number, email, a keypad for the PIN and the face capture",
        },
      },
    ],
  },
  {
    id: "gobla",
    nombre: "Oculus Auditor",
    resumen: {
      es: "Detección de opacidad en contratos públicos del SECOP II",
      en: "Spotting opacity in public contracts on Colombia's SECOP II",
    },
    contexto: { es: "Hackathon · Bogotá", en: "Hackathon · Bogotá" },
    periodo: "2026",
    rol: { es: "Backend e integración de IA", en: "Backend and AI integration" },
    descripcion: {
      es: "Un agente revisa la contratación pública publicada en el SECOP II, puntúa señales de opacidad y levanta alertas con su evidencia. Los hallazgos salen como reporte y llegan por Telegram.",
      en: "An agent reviews the public procurement published on SECOP II, scores signals of opacity and raises alerts with their evidence. Findings come out as a report and arrive over Telegram.",
    },
    stack: ["FastAPI", "React", "SQLite", "OpenAI", "Telegram"],
    repositorio: "https://github.com/Johan-Santacruz/BogotaHackColombia5.0",
    capturas: [
      {
        src: "/imagenes/trabajos/oculus-inicio.jpg",
        alt: {
          es: "Portada de Oculus Auditor: «La corrupción en contratos públicos no debería ser invisible»",
          en: "Oculus Auditor's cover: \"Corruption in public contracts should not be invisible\"",
        },
      },
      {
        src: "/imagenes/trabajos/oculus-mapa.jpg",
        alt: {
          es: "Mapa de riesgo nacional por departamento dentro del panel de Oculus Auditor",
          en: "National risk map by department inside the Oculus Auditor dashboard",
        },
      },
    ],
    landing: {
      src: "/imagenes/landings/oculus.jpg",
      alt: {
        es: "Landing completa de Oculus Auditor, de la portada al cierre",
        en: "Oculus Auditor's full landing page, from the cover to the closing section",
      },
      etiqueta: { es: "Ver la landing completa", en: "See the full landing page" },
    },
  },
  {
    id: "nimbus",
    nombre: "Nimbus",
    resumen: {
      es: "Alerta temprana de lluvia para San Cristóbal, Galápagos",
      en: "Early rain warning for San Cristóbal, Galápagos",
    },
    contexto: {
      es: "SALA Hackathon · Galapagos Science Center",
      en: "SALA Hackathon · Galapagos Science Center",
    },
    periodo: "2026",
    rol: { es: "Por confirmar", en: "To be confirmed" },
    rolPorConfirmar: true,
    descripcion: {
      es: "Once años de registros de cuatro estaciones meteorológicas convertidos en pronósticos de precipitación a +1, +3 y +6 horas. La misma predicción se presenta de tres maneras según quién mira: métricas de modelo para el equipo de ML, datos en tiempo real para meteorología y alertas simples por Telegram para la comunidad.",
      en: "Eleven years of records from four weather stations turned into rainfall forecasts at +1, +3 and +6 hours. The same prediction is shown three ways depending on who is looking: model metrics for the ML team, live data for meteorologists and plain Telegram alerts for the community.",
    },
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
        alt: {
          es: "Portada de Nimbus: «Transform data into predictions that save», con el conteo de estaciones y años de datos",
          en: "Nimbus's cover: \"Transform data into predictions that save\", with the count of stations and years of data",
        },
      },
      {
        src: "/imagenes/trabajos/nimbus-roles.jpg",
        alt: {
          es: "Las tres interfaces de Nimbus: experto en ML, meteorólogo y comunidad de Galápagos",
          en: "Nimbus's three interfaces: ML expert, meteorologist and the Galápagos community",
        },
      },
    ],
    landing: {
      src: "/imagenes/landings/nimbus.jpg",
      alt: {
        es: "Landing completa de Nimbus, de la portada al pie",
        en: "Nimbus's full landing page, from the cover to the footer",
      },
      etiqueta: { es: "Ver la landing completa", en: "See the full landing page" },
    },
  },
  {
    id: "agenx",
    nombre: "AgentX",
    resumen: {
      es: "Recepción y clasificación automática de incidentes",
      en: "Automatic intake and triage of incidents",
    },
    contexto: { es: "Hackathon", en: "Hackathon" },
    periodo: "2026",
    rol: { es: "Backend e integraciones", en: "Backend and integrations" },
    descripcion: {
      es: "Los incidentes entran por varios canales, se clasifican y enriquecen con IA, y salen convertidos en tickets de Jira con las personas correctas notificadas.",
      en: "Incidents come in through several channels, get classified and enriched with AI, and come out as Jira tickets with the right people notified.",
    },
    stack: ["React + Vite", "Node.js", "Express", "SQLite", "Jira", "OpenAI"],
    repositorio: "https://github.com/Johan-Santacruz/AgenX-Hackathon",
    capturas: [
      {
        src: "/imagenes/trabajos/agentx-inicio.jpg",
        alt: {
          es: "Portada de AgentX: «The agent that resolves incidents»",
          en: "AgentX's cover: \"The agent that resolves incidents\"",
        },
      },
      {
        src: "/imagenes/trabajos/agentx-integraciones.jpg",
        alt: {
          es: "Integraciones de AgentX con Saleor, Jira, Gmail y una API REST",
          en: "AgentX's integrations with Saleor, Jira, Gmail and a REST API",
        },
      },
    ],
    landing: {
      src: "/imagenes/landings/agentx.jpg",
      alt: {
        es: "Landing completa de AgentX, de la portada a las integraciones",
        en: "AgentX's full landing page, from the cover to the integrations",
      },
      etiqueta: { es: "Ver la landing completa", en: "See the full landing page" },
    },
  },
  {
    id: "chatpyme",
    // Así se llama a sí misma en pantalla; ChatPyme es el nombre interno.
    nombre: "AgenteIA",
    resumen: {
      es: "Un ERP para mipymes que se maneja hablando con Fina",
      en: "An ERP for small businesses that you run by talking to Fina",
    },
    contexto: { es: "Proyecto en equipo", en: "Team project" },
    periodo: "2026",
    rol: { es: "Por confirmar", en: "To be confirmed" },
    rolPorConfirmar: true,
    descripcion: {
      es: "Una tienda de barrio no lleva inventario porque el software de inventario está hecho para otra empresa. Fina, la asistente, vive en Telegram y en un panel web: se le cuenta qué entró y qué salió, en el idioma de siempre, y ella lleva las cuentas. Detrás hay varios agentes con oficios distintos, uno para el inventario, otro para las finanzas, otro para las alertas, y uno que supervisa a los demás: antes de ejecutar algo que no tiene vuelta atrás se detiene y pide confirmación, y la acción queda en espera hasta que se aprueba, se rechaza o caduca. Los informes dicen qué rota, qué se vende solo y qué compra fue un error.",
      en: "A corner shop keeps no inventory because inventory software is built for a different kind of company. Fina, the assistant, lives on Telegram and in a web dashboard: you tell her what came in and what went out, in everyday words, and she keeps the books. Behind her are several agents with different jobs, one for inventory, one for finance, one for alerts, and one that supervises the rest: before running anything irreversible it stops and asks for confirmation, and the action waits until it is approved, rejected or expires. The reports say what turns over, what sells itself and which purchase was a mistake.",
    },
    stack: [
      "FastAPI",
      "Python",
      "PostgreSQL",
      "SQLAlchemy",
      "React",
      "OpenAI",
      "Telegram",
      "Docker",
    ],
    capturas: [
      {
        src: "/imagenes/trabajos/agenteia-portada.jpg",
        alt: {
          es: "Portada de AgenteIA: «Gestiona tu negocio con inteligencia», con el panel asomando debajo",
          en: "AgenteIA's home page: \"Run your business with intelligence\", with the dashboard peeking below",
        },
      },
    ],
    landing: {
      src: "/imagenes/landings/agenteia.jpg",
      alt: {
        es: "La portada de AgenteIA de arriba abajo: funciones, métricas, cómo funciona y Fina en Telegram",
        en: "AgenteIA's home page from top to bottom: features, metrics, how it works and Fina on Telegram",
      },
      etiqueta: { es: "Ver la portada completa", en: "See the full home page" },
    },
  },
  {
    id: "tritec",
    nombre: "Tritec",
    resumen: {
      es: "Practicar algoritmos con corrección automática en el navegador",
      en: "Practising algorithms with automatic grading in the browser",
    },
    contexto: { es: "Proyecto académico en equipo", en: "Team university project" },
    periodo: "2024 — 2026",
    rol: { es: "Por confirmar", en: "To be confirmed" },
    rolPorConfirmar: true,
    descripcion: {
      es: "Nueve problemas clásicos, de FizzBuzz y los palíndromos a la búsqueda binaria, los números romanos en los dos sentidos, las cantidades escritas en letras, la matriz en espiral, las torres de Hanói y el ordenamiento por mezcla. Cada uno abre su editor: lo que se escribe se ejecuta contra una batería de pruebas y responde si pasa. Una fábrica asocia cada problema con su clase de pruebas y su solución, así que añadir uno nuevo no toca los demás.",
      en: "Nine classic problems, from FizzBuzz and palindromes to binary search, Roman numerals both ways, amounts written out in words, the spiral matrix, the Towers of Hanoi and merge sort. Each one opens its editor: what you write runs against a battery of tests and reports whether it passes. A factory pairs every problem with its test class and its solver, so adding a new one leaves the rest alone.",
    },
    stack: ["Python", "Flask", "Jinja2", "JavaScript", "CSS"],
    repositorio: "https://github.com/Johan-Santacruz/Tritec",
    capturas: [
      {
        src: "/imagenes/trabajos/tritec-ejercicios.jpg",
        alt: {
          es: "Lista de ejercicios de Tritec, cada uno con su icono, su descripción y su dificultad en estrellas",
          en: "Tritec's exercise list, each with its icon, its description and its difficulty in stars",
        },
      },
    ],
    landing: {
      src: "/imagenes/landings/tritec.jpg",
      alt: {
        es: "La lista de ejercicios de Tritec de arriba abajo, con los nueve problemas",
        en: "Tritec's exercise list from top to bottom, with all nine problems",
      },
      etiqueta: { es: "Ver la lista completa", en: "See the full list" },
    },
  },
];
