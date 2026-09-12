/** La tira de datos bajo la portada. Cuatro entradas caben en una fila. */

export interface Indicador {
  etiqueta: string;
  valor: string;
  nota: string;
}

export const indicadores: Indicador[] = [
  {
    etiqueta: "Enfoque",
    valor: "FastAPI + React",
    nota: "Backend tipado, frontend tablet-first",
  },
  {
    etiqueta: "Dominio",
    valor: "Datos sensibles",
    nota: "Cifrado por registro, trazas de auditoría",
  },
  {
    etiqueta: "Proyectos",
    valor: "4",
    nota: "Tesis, hackathon, RPA en producción",
  },
  {
    etiqueta: "Disponible",
    valor: "2026",
    nota: "Prácticas y proyectos por contrato",
  },
];
