/** Los tres principios que abren la página, antes de los proyectos. */

export interface Principio {
  titulo: string;
  texto: string;
}

export const principios: Principio[] = [
  {
    titulo: "Validar antes de guardar",
    texto:
      "Una regla que corre al momento de la captura vale más que un reporte de inconsistencias al cierre de mes. Diseño el flujo para que lo ambiguo se pregunte, no se asuma.",
  },
  {
    titulo: "El modelo no decide",
    texto:
      "Uso modelos de lenguaje para estructurar lo que una persona dijo, nunca para elegir un identificador. El match contra el catálogo es código determinístico y revisable.",
  },
  {
    titulo: "Funciona sin señal",
    texto:
      "Parser local de respaldo, cola offline y sincronización posterior. Si el software solo sirve con buena conexión, no sirve en una bodega.",
  },
];
