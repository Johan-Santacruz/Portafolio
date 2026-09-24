/**
 * Pantalla de carga. El marcado vive en `index.html` para que se vea antes de
 * que llegue el JavaScript; aquí solo se precarga lo que hace falta para que
 * la portada funcione al primer scroll y se retira la pantalla.
 *
 * Solo espera la foto inicial. Los efectos y las secuencias se preparan
 * progresivamente, sin bloquear el desplazamiento ni esperar a las fuentes.
 */
const BASE = import.meta.env.BASE_URL;
const RETRATO = `${BASE}imagenes/retrato/`;

/** Lo mínimo para que la portada no se vea rota al empezar a bajar. */
function recursos() {
  return [`${RETRATO}normal.jpg`];
}

const cargarImagen = (src: string) =>
  new Promise<void>((listo) => {
    const img = new Image();
    img.decoding = "async";
    const acabar = () => listo();
    img.onload = acabar;
    img.onerror = acabar;
    img.src = src;
  });

export function pantallaDeCarga() {
  const caja = document.getElementById("carga");
  if (!caja) return;
  const barra = document.getElementById("carga-barra");
  const numero = document.getElementById("carga-num");

  const lista = recursos();
  // Las tipografías cuentan como un paso más: sin ellas el texto salta.
  const total = lista.length + 1;
  let hechos = 0;
  const paso = () => {
    hechos++;
    const pct = Math.round((hechos / total) * 100);
    if (barra) barra.style.width = `${pct}%`;
    if (numero) numero.textContent = String(pct);
  };

  // Las tipografías no bloquean: van con `display: swap`, así que el texto se
  // ve igual mientras llegan.
  (document.fonts?.ready ?? Promise.resolve()).then(paso);
  const todo = Promise.all(lista.map((src) => cargarImagen(src).then(paso)));
  // Solo espera la foto visible, sin duración mínima artificial. El resto
  // de la portada se carga progresivamente y nunca bloquea la navegación.
  const techo = new Promise<void>((listo) => window.setTimeout(listo, 1000));

  Promise.race([todo, techo]).then(() => {
    if (barra) barra.style.width = "100%";
    if (numero) numero.textContent = "100";
    caja.setAttribute("data-listo", "");
    window.setTimeout(() => caja.remove(), 500);
  });
}
