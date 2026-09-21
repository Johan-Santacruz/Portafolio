/**
 * Pantalla de carga. El marcado vive en `index.html` para que se vea antes de
 * que llegue el JavaScript; aquí solo se precarga lo que hace falta para que
 * la portada funcione al primer scroll y se retira la pantalla.
 *
 * No se precarga la página entera (son varios megas de secuencias): solo las
 * dos capas del retrato, unos fotogramas repartidos del vídeo y las
 * tipografías. Lo demás sigue cargándose al acercarse cada sección.
 */
const BASE = import.meta.env.BASE_URL;
const RETRATO = `${BASE}imagenes/retrato/`;
/** Fotogramas del vídeo de la portada que se piden de entrada, repartidos. */
const REPARTO = [0, 15, 30, 45, 60, 75, 90, 105, 120];

/** Lo mínimo para que la portada no se vea rota al empezar a bajar. */
function recursos() {
  return [
    `${RETRATO}normal.jpg`,
    `${RETRATO}alter.jpg`,
    ...REPARTO.map(
      (i) => `${RETRATO}secuencia-mini/f${String(i).padStart(3, "0")}.jpg`,
    ),
  ];
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
  // Mientras carga no se desplaza la página.
  const scrollAntes = document.body.style.overflow;
  document.body.style.overflow = "hidden";

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

  const desde = performance.now();
  // Las tipografías no bloquean: van con `display: swap`, así que el texto se
  // ve igual mientras llegan.
  (document.fonts?.ready ?? Promise.resolve()).then(paso);
  const todo = Promise.all(lista.map((src) => cargarImagen(src).then(paso)));
  // Ni eterno (una red mala no debe dejar la página secuestrada) ni un
  // parpadeo (si todo estaba en caché, se ve al menos cuatro décimas).
  const techo = new Promise<void>((listo) => window.setTimeout(listo, 3000));
  const suelo = new Promise<void>((listo) => window.setTimeout(listo, 400));

  Promise.race([todo, techo])
    .then(() => suelo)
    .then(() => {
      const falta = Math.max(0, 400 - (performance.now() - desde));
      window.setTimeout(() => {
        if (barra) barra.style.width = "100%";
        if (numero) numero.textContent = "100";
        caja.setAttribute("data-listo", "");
        document.body.style.overflow = scrollAntes;
        window.setTimeout(() => caja.remove(), 500);
      }, falta);
    });
}
