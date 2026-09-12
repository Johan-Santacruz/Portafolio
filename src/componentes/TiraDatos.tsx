import type { CSSProperties } from "react";
import { indicadores } from "../datos/indicadores";
import "./TiraDatos.css";

export function TiraDatos() {
  return (
    <dl className="tira">
      {indicadores.map((indicador, i) => (
        <div
          key={indicador.etiqueta}
          data-revelar=""
          style={{ "--retraso": `${i * 90}ms` } as CSSProperties}
        >
          <dt className="mono">{indicador.etiqueta}</dt>
          <dd>
            {indicador.valor}
            <small>{indicador.nota}</small>
          </dd>
        </div>
      ))}
    </dl>
  );
}
