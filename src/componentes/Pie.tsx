import { perfil } from "../datos/perfil";
import "./Pie.css";
export function Pie() {
  return (
    <footer className="pie" data-revelar="">
      <span>
        © {new Date().getFullYear()} {perfil.nombreCorto}
        <span className="pie-ubicacion"> · {perfil.ubicacion}</span>
      </span>
      <span className="mono">Hecho con intención.</span>
      <a href="#top">
        Volver arriba <span aria-hidden="true">↑</span>
      </a>
    </footer>
  );
}
