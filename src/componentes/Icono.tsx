type Nombre =
  | "flecha"
  | "diagonal"
  | "sol"
  | "luna"
  | "menu"
  | "cerrar"
  | "check"
  | "codigo"
  | "capas"
  | "escudo";
const trazos: Record<Nombre, string> = {
  flecha: "M4 12h16m-6-6 6 6-6 6",
  diagonal: "M5 19 19 5M5 5h14v14",
  sol: "M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  luna: "M20 15.5A9 9 0 0 1 8.5 4 9 9 0 1 0 20 15.5Z",
  menu: "M4 8h16M4 16h16",
  cerrar: "m6 6 12 12M6 18 18 6",
  check: "m5 12 4 4L19 6",
  codigo: "m8 7-5 5 5 5m8-10 5 5-5 5M14 4l-4 16",
  capas: "m12 3 10 5-10 5L2 8l10-5ZM2 12l10 5 10-5M2 16l10 5 10-5",
  escudo: "m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Zm-4 9 3 3 5-6",
};
export function Icono({
  nombre,
  className = "",
}: {
  nombre: Nombre;
  className?: string;
}) {
  return (
    <svg
      className={`icono ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={trazos[nombre]} />
    </svg>
  );
}
