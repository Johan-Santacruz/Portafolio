/** Herramientas, agrupadas por capa. */

export interface GrupoStack {
  titulo: string;
  /** Versión corta para la palabra gigante, si el título no cabe. */
  palabra?: string;
  items: string[];
  /** Consola de la categoría: la orden y lo que responde. */
  consola: [string, string];
}

export const stack: GrupoStack[] = [
  {
    titulo: "Lenguajes",
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
    consola: ['$ python -c "print(\'hola, mundo\')"', "hola, mundo"],
  },
  {
    titulo: "Desarrollo web",
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
    consola: ["$ npm run dev", "➜  Local:   http://localhost:5173/"],
  },
  {
    titulo: "Inteligencia artificial y datos",
    palabra: "IA y datos",
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
    consola: [">>> modelo.fit(X_train, y_train, epochs=20)", "Epoch 20/20 ━━━━━━━━━━━━━━ listo"],
  },
  {
    titulo: "Bases de datos",
    items: ["SQL", "PostgreSQL", "SQLite", "MongoDB"],
    consola: ["SELECT nombre FROM proyectos;", "SENDA · Oculus Auditor · Nimbus · AgentX"],
  },
  {
    titulo: "Automatización",
    items: ["n8n", "Rocketbot"],
    consola: ["› n8n: ejecutar flujo", "✓ flujo completado"],
  },
  {
    titulo: "Control de versiones",
    items: ["Git"],
    consola: ["$ git log --oneline -1", "57c1cdd Portafolio: landing con video"],
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
