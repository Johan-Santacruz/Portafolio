/** Herramientas, agrupadas por capa. Cuatro grupos caben en una fila. */

export interface GrupoStack {
  titulo: string;
  items: string[];
}

export const stack: GrupoStack[] = [
  {
    titulo: "Backend",
    items: [
      "Python 3.12",
      "FastAPI",
      "Pydantic",
      "SQLite · PostgreSQL",
      "pytest",
    ],
  },
  {
    titulo: "Frontend",
    items: ["React 18", "TypeScript", "Vite", "Zustand", "PWA"],
  },
  {
    titulo: "Infraestructura",
    items: ["Docker Compose", "Caddy", "Make", "Git", "Vercel · Railway"],
  },
  {
    titulo: "Datos e IA",
    items: [
      "OpenAI Structured Outputs",
      "Whisper",
      "BETO (NLP en español)",
      "FFmpeg",
      "AES-256-GCM",
    ],
  },
];
