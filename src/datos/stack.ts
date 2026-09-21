/** Herramientas, agrupadas por capa. */
import type { Par } from "../idioma/idioma";

export interface GrupoStack {
  /** Estable y sin traducir: es la clave de React y del túnel. */
  id: string;
  titulo: Par;
  /** Versión corta para la palabra gigante, si el título no cabe. */
  palabra?: Par;
  items: string[];
  /** Consola de la categoría: la orden y lo que responde. */
  consola: [Par, Par];
  /**
   * Habilidades blandas. El grupo que las lleva no se pinta con placas: la
   * pantalla cambia de composición y las presenta en grande, una por línea.
   * Una palabra y una frase corta cada una; si hay que explicar más, sobra.
   */
  criterio?: { id: string; titulo: Par; texto: Par }[];
}

export const stack: GrupoStack[] = [
  {
    id: "lenguajes",
    titulo: { es: "Lenguajes", en: "Languages" },
    items: [
      "Python",
      "Java",
      "JavaScript",
      "TypeScript",
      "C",
      "C++",
      "Go",
      "PHP",
    ],
    consola: [
      { es: '$ python -c "print(\'hola, mundo\')"', en: '$ python -c "print(\'hello, world\')"' },
      { es: "hola, mundo", en: "hello, world" },
    ],
  },
  {
    id: "web",
    titulo: { es: "Desarrollo web", en: "Web development" },
    items: [
      "HTML",
      "CSS",
      "React",
      "Next.js",
      "Vite",
      "Node.js",
      "Express",
      "FastAPI",
      "Flask",
      "Django",
    ],
    consola: [
      { es: "$ npm run dev", en: "$ npm run dev" },
      { es: "➜  Local:   http://localhost:5173/", en: "➜  Local:   http://localhost:5173/" },
    ],
  },
  {
    id: "ia",
    titulo: { es: "Inteligencia artificial y datos", en: "Artificial intelligence and data" },
    palabra: { es: "IA y datos", en: "AI and data" },
    items: [
      "TensorFlow",
      "PyTorch",
      "Keras",
      "Scikit-learn",
      "NumPy",
      "Pandas",
      "Matplotlib",
      "Seaborn",
      "Jupyter",
    ],
    consola: [
      { es: ">>> modelo.fit(X_train, y_train, epochs=20)", en: ">>> model.fit(X_train, y_train, epochs=20)" },
      { es: "Epoch 20/20 ━━━━━━━━━━━━━━ listo", en: "Epoch 20/20 ━━━━━━━━━━━━━━ done" },
    ],
  },
  {
    id: "datos",
    titulo: { es: "Bases de datos", en: "Databases" },
    items: ["SQL", "PostgreSQL", "SQLite", "MongoDB"],
    consola: [
      { es: "SELECT nombre FROM proyectos;", en: "SELECT name FROM projects;" },
      { es: "SENDA · Oculus Auditor · Nimbus · AgentX", en: "SENDA · Oculus Auditor · Nimbus · AgentX" },
    ],
  },
  {
    id: "automatizacion",
    titulo: { es: "Automatización", en: "Automation" },
    items: ["n8n", "Rocketbot"],
    consola: [
      { es: "› n8n: ejecutar flujo", en: "› n8n: run workflow" },
      { es: "✓ flujo completado", en: "✓ workflow completed" },
    ],
  },
  {
    id: "versiones",
    titulo: { es: "Control de versiones", en: "Version control" },
    items: ["Git"],
    consola: [
      { es: "$ git log --oneline -1", en: "$ git log --oneline -1" },
      { es: "57c1cdd Portafolio: landing con video", en: "57c1cdd Portfolio: landing with video" },
    ],
  },
  {
    id: "criterio",
    titulo: { es: "Cómo trabajo", en: "How I work" },
    items: [],
    consola: [
      { es: "$ cat ~/.criterio", en: "$ cat ~/.criterio" },
      { es: "8 hábitos cargados", en: "8 habits loaded" },
    ],
    criterio: [
      {
        id: "resolutivo",
        titulo: { es: "Resolutivo", en: "Resourceful" },
        texto: {
          es: "Parto el problema hasta que se puede comprobar",
          en: "I split the problem until it can be verified",
        },
      },
      {
        id: "responsable",
        titulo: { es: "Responsable", en: "Reliable" },
        texto: {
          es: "Lo que prometo para una fecha, sale en esa fecha",
          en: "What I promise for a date ships on that date",
        },
      },
      {
        id: "adaptativo",
        titulo: { es: "Adaptativo", en: "Adaptable" },
        texto: {
          es: "Si cambian los requisitos, cambia el plan",
          en: "If the requirements change, the plan changes",
        },
      },
      {
        id: "colaborativo",
        titulo: { es: "Colaborativo", en: "Collaborative" },
        texto: {
          es: "Me entiendo con gente de otras carreras",
          en: "I work well with people from other fields",
        },
      },
      {
        id: "autodidacta",
        titulo: { es: "Autodidacta", en: "Self-taught" },
        texto: {
          es: "Aprendo lo que el proyecto pide, no el tutorial",
          en: "I learn what the project needs, not the tutorial",
        },
      },
      {
        id: "ordenado",
        titulo: { es: "Ordenado", en: "Organised" },
        texto: {
          es: "Dejo el código donde el siguiente lo encuentre",
          en: "I leave the code where the next person finds it",
        },
      },
      {
        id: "comunicativo",
        titulo: { es: "Comunicativo", en: "Articulate" },
        texto: {
          es: "Sustento lo que construyo ante quien sea",
          en: "I can defend what I build to anyone",
        },
      },
      {
        id: "riguroso",
        titulo: { es: "Riguroso", en: "Rigorous" },
        texto: {
          es: "Publico con revisión por pares",
          en: "I publish with peer review",
        },
      },
    ],
  },
];

/**
 * Logo de cada herramienta, en `public/iconos/`. Se pintan en un solo color
 * (como máscara), así que sirve cualquier SVG con fondo transparente. Vienen
 * de Simple Icons, salvo Rocketbot (de su web, pasado a una tinta),
 * Matplotlib (redibujado en una tinta) y SQL y Seaborn, que no tienen logo
 * oficial y usan un glifo genérico.
 */
export const iconos: Record<string, string> = {
  Python: "python",
  Java: "openjdk",
  JavaScript: "javascript",
  TypeScript: "typescript",
  C: "c",
  "C++": "cplusplus",
  Go: "go",
  PHP: "php",
  HTML: "html5",
  CSS: "css",
  React: "react",
  "Next.js": "nextdotjs",
  Vite: "vite",
  "Node.js": "nodedotjs",
  Express: "express",
  FastAPI: "fastapi",
  Flask: "flask",
  Django: "django",
  SQL: "sql",
  PostgreSQL: "postgresql",
  SQLite: "sqlite",
  MongoDB: "mongodb",
  TensorFlow: "tensorflow",
  PyTorch: "pytorch",
  Keras: "keras",
  "Scikit-learn": "scikitlearn",
  NumPy: "numpy",
  Pandas: "pandas",
  Matplotlib: "matplotlib",
  Seaborn: "seaborn",
  Jupyter: "jupyter",
  n8n: "n8n",
  Rocketbot: "rocketbot",
  Git: "git",
};
