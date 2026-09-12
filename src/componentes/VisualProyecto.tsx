import { Icono } from "./Icono";
import "./VisualProyecto.css";
export function VisualProyecto({ id }: { id: string }) {
  return (
    <div className={`visual-proyecto visual-${id}`} aria-hidden="true">
      <span className="visual-nota mono">
        {id === "pav-mood"
          ? "Identidad visual · concepto"
          : "Arquitectura · vista conceptual"}
      </span>
      {id === "senda" && (
        <>
          <img
            className="visual-foto"
            src="/imagenes/senda.jpg"
            alt=""
            loading="lazy"
          />
          <div className="visual-senda-contenido">
            <div className="visual-marca">
              senda<span>↗</span>
            </div>
            <div className="onda">
              {Array.from({ length: 48 }, (_, i) => (
                <i
                  key={i}
                  style={{
                    height: `${12 + Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.22)) * 68}px`,
                  }}
                />
              ))}
            </div>
            <div className="visual-leyenda mono">
              <span>VIDEO → HECHOS → RUTAS</span>
              <Icono nombre="escudo" />
            </div>
          </div>
        </>
      )}
      {id === "clara" && (
        <div className="visual-clara-contenido">
          <span className="clara-estrella">✳</span>
          <div className="visual-marca">
            clara<span>_</span>
          </div>
          <div className="clara-captura">
            <span>“Quedan nueve cajas de harina”</span>
            <span className="clara-validado">
              <Icono nombre="check" /> Registro validado
            </span>
          </div>
        </div>
      )}
      {id === "robots-zoho" && (
        <div className="visual-robots-contenido">
          <div className="flujo-nodos">
            <span>
              <Icono nombre="capas" />
              CRM
            </span>
            <i />
            <span className="flujo-centro">
              <Icono nombre="codigo" />
              Python
            </span>
            <i />
            <span>
              <Icono nombre="check" />
              Validado
            </span>
          </div>
          <div className="visual-leyenda mono">
            <span>PROCESAR. VERIFICAR. REGISTRAR.</span>
            <span>↗</span>
          </div>
        </div>
      )}
      {id === "pav-mood" && (
        <div className="visual-pav-contenido">
          <img
            className="pav-foto"
            src="/imagenes/pavemood.jpg"
            alt=""
            loading="lazy"
          />
          <div className="visual-marca">
            pavé<span>—</span>
            <br />
            mood.
          </div>
          <span className="pav-nota mono">
            Una marca.
            <br />
            Su espacio digital.
          </span>
        </div>
      )}
    </div>
  );
}
