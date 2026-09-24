/**
 * Los textos de la interfaz en los dos idiomas. Lo que es contenido (los
 * proyectos, el stack, la trayectoria, el perfil) vive en `src/datos/`; aquí
 * solo están los rótulos, los botones y las etiquetas que escriben los
 * componentes.
 *
 * Las órdenes de terminal («ls ./proyectos») también se traducen: son texto
 * que se lee, no comandos que se ejecuten.
 */
import type { Par } from "./idioma";

export const textos = {
  // --- Navegación ---------------------------------------------------------
  saltar: { es: "Saltar al contenido", en: "Skip to content" },
  apartados: { es: "Apartados", en: "Sections" },
  /** El botón de idioma: dice a qué idioma lleva, no en cuál estás. */
  cambiarIdioma: {
    es: "Ver el portafolio en inglés",
    en: "Ver el portafolio en español",
  },
  navegacion: [
    { id: "top", largo: { es: "Inicio", en: "Home" }, corto: { es: "Inicio", en: "Home" } },
    {
      id: "herramientas",
      largo: { es: "Herramientas", en: "Tools" },
      corto: { es: "Stack", en: "Stack" },
    },
    {
      id: "proyectos",
      largo: { es: "Proyectos", en: "Projects" },
      corto: { es: "Obra", en: "Work" },
    },
    {
      id: "trayectoria",
      largo: { es: "Trayectoria", en: "Career" },
      corto: { es: "Perfil", en: "Profile" },
    },
    { id: "contacto", largo: { es: "Contacto", en: "Contact" }, corto: { es: "Contacto", en: "Contact" } },
  ] satisfies { id: string; largo: Par; corto: Par }[],

  // --- Portada ------------------------------------------------------------
  rol1: { es: "Ingeniero de Sistemas", en: "Systems Engineer" },
  rol2: {
    es: "Full-Stack · IA Engineer · Automatización",
    en: "Full-Stack · AI Engineer · Automation",
  },
  retratoAria: {
    es: "Retrato de Johan Santacruz. Al pasar el cursor, mantener pulsado o enfocar con el teclado se revela su versión tecnológica; al bajar, la versión tecnológica aparece entera y gira de perfil.",
    en: "Portrait of Johan Santacruz. Hovering, pressing and holding, or focusing with the keyboard reveals his technological self; on scrolling down, that version appears in full and turns to profile.",
  },
  hud: {
    identidad: { es: "Identidad", en: "Identity" },
    hackathones: { es: "Hackathones", en: "Hackathons" },
    formacion: { es: "Formación", en: "Education" },
    formacionValor: {
      es: "Estudiante de Ingeniería de Sistemas",
      en: "Systems Engineering student",
    },
    proyectos: { es: "Proyectos", en: "Projects" },
    base: { es: "Base", en: "Based in" },
    estado: { es: "Estado", en: "Status" },
    estadoValor: {
      es: "Disponible para prácticas y proyectos",
      en: "Open to internships and projects",
    },
  },
  frase: {
    es: "Aprendo construyendo: cada proyecto empieza con un problema real y termina en algo que funciona.",
    en: "I learn by building: every project starts from a real problem and ends in something that works.",
  },

  // --- Herramientas -------------------------------------------------------
  ordenHerramientas: { es: "ls ./herramientas", en: "ls ./tools" },
  herramientasRotulo: { es: "Herramientas", en: "Tools" },
  herramientasTitulo: { es: "Con qué construyo", en: "What I build with" },
  criterioRotulo: { es: "Habilidades blandas", en: "Soft skills" },
  criterioTitulo: { es: "Cómo trabajo", en: "How I work" },

  // --- Proyectos ----------------------------------------------------------
  ordenProyectos: { es: "ls ./proyectos", en: "ls ./projects" },
  proyectosTitulo: { es: "Lo que he construido", en: "What I've built" },
  verProyecto: { es: ": ver el proyecto", en: ": open the project" },
  cerrar: { es: "Cerrar", en: "Close" },
  rol: { es: "Rol", en: "Role" },
  tecnologias: { es: "Tecnologías", en: "Technologies" },
  verCodigo: { es: "Ver el código", en: "View the code" },
  enGitHub: { es: " en GitHub", en: " on GitHub" },
  verSitio: { es: "Probarlo", en: "Try it" },

  // --- Reconocimientos ----------------------------------------------------
  reconocimientosRotulo: { es: "Reconocimientos", en: "Recognition" },
  reconocimientosTitulo: { es: "Lo que han dicho", en: "What others said" },
  /** Se lee en voz alta tras el titular: dice adónde lleva el enlace. */
  verPublicacion: { es: "Ver la publicación en", en: "See the post on" },

  // --- Trayectoria --------------------------------------------------------
  trayectoriaRotulo: { es: "Trayectoria", en: "Career" },
  trayectoriaTitulo: { es: "Dónde he estado", en: "Where I've been" },
  /** Encabezado del libro mayor: cuántos pases hay y en cuál va el lector. */
  trayectoriaRecorrido: { es: "Recorrido", en: "Journey" },
  trayectoriaPases: { es: "pases", en: "stops" },

  // --- Cierre -------------------------------------------------------------
  contactoRotulo: { es: "Contacto", en: "Contact" },
  cierreLinea1: { es: "¿Construimos", en: "Shall we build" },
  cierreLinea2: { es: "lo que sigue?", en: "what comes next?" },
  cierreCopia: {
    es: "Cuéntame tu idea: una web, un sistema con IA o un proceso que quieras automatizar. Te respondo el mismo día.",
    en: "Tell me your idea: a website, a system with AI, or a process you want automated. I reply the same day.",
  },
  escribeme: { es: "Escríbeme", en: "Email me" },
  copiado: { es: "Copiado", en: "Copied" },
  // El pie: la página es obra propia y está protegida por derechos de autor.
  derechos: { es: "Todos los derechos reservados", en: "All rights reserved" },
  obraPropia: { es: "Diseño y código originales", en: "Original design and code" },
  hojaDeVida: { es: "Hoja de vida", en: "Résumé" },
  descargarPdf: { es: "Descargar PDF", en: "Download PDF" },
  hojaPagina: {
    es: "Hoja de vida de Johan Balanta, página",
    en: "Johan Balanta's résumé, page",
  },
  hojaDe: { es: "de", en: "of" },
} as const;
