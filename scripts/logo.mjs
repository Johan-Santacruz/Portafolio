/**
 * Prepara la marca a partir del logo original.
 *
 *   node scripts/logo.mjs ~/Downloads/Logo.png
 *
 * Escribe tres archivos en `public/`:
 *   logo.png        360 px de ancho, para la pantalla de carga
 *   icono-180.png   para la pestaña y el icono de iOS
 *   icono-64.png    para la pestaña
 *
 * Hace dos cosas con el original: lo recorta a su contenido (el archivo que
 * salió del generador trae media imagen de margen blanco) y lo aplana a tres
 * tintas: el papel de la página, el azul del logo y el lima de la casa. El
 * original es un render con ruido y pesa 170 kB en PNG; aplanado pesa 14, y
 * eso importa porque es lo primero que se ve.
 *
 * Usa el Chromium de Playwright como lienzo: el proyecto ya lo tiene para los
 * tests y así no hace falta otra dependencia de imagen.
 */
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";

/** El papel, el azul del logo y el lima. En este orden: el 0 es el fondo. */
const TINTAS = [
  [253, 253, 254],
  [30, 42, 58],
  [199, 255, 74],
];

const origen = process.argv[2];
if (!origen) {
  console.error("Falta la ruta del logo: node scripts/logo.mjs <archivo.png>");
  process.exit(1);
}

const nav = await chromium.launch();
const pag = await nav.newPage();
const salida = await pag.evaluate(
  async ({ b64, tintas }) => {
    const img = new Image();
    img.src = "data:image/png;base64," + b64;
    await img.decode();

    const lienzo = document.createElement("canvas");
    lienzo.width = img.naturalWidth;
    lienzo.height = img.naturalHeight;
    const ctx = lienzo.getContext("2d");
    ctx.drawImage(img, 0, 0);

    // Cada píxel a la tinta más cercana, y de paso se mide el recorte: todo
    // lo que no acabe siendo fondo.
    const datos = ctx.getImageData(0, 0, lienzo.width, lienzo.height);
    const d = datos.data;
    let x0 = lienzo.width,
      y0 = lienzo.height,
      x1 = 0,
      y1 = 0;
    for (let p = 0; p < d.length; p += 4) {
      let cerca = 0;
      let mejor = Infinity;
      for (let t = 0; t < tintas.length; t++) {
        const [r, g, b] = tintas[t];
        const v = (d[p] - r) ** 2 + (d[p + 1] - g) ** 2 + (d[p + 2] - b) ** 2;
        if (v < mejor) {
          mejor = v;
          cerca = t;
        }
      }
      d[p] = tintas[cerca][0];
      d[p + 1] = tintas[cerca][1];
      d[p + 2] = tintas[cerca][2];
      d[p + 3] = 255;
      if (cerca !== 0) {
        const i = (p / 4) % lienzo.width;
        const j = Math.floor(p / 4 / lienzo.width);
        if (i < x0) x0 = i;
        if (i > x1) x1 = i;
        if (j < y0) y0 = j;
        if (j > y1) y1 = j;
      }
    }
    ctx.putImageData(datos, 0, 0);
    const w = x1 - x0 + 1;
    const h = y1 - y0 + 1;

    const papel = `rgb(${tintas[0].join(",")})`;
    /** La marca: ancho fijo, alto el que salga, un pelo de aire. */
    const tira = (ancho, margen) => {
      const e = (ancho * (1 - margen * 2)) / w;
      const o = document.createElement("canvas");
      o.width = ancho;
      o.height = Math.round(h * e + ancho * margen * 2);
      const k = o.getContext("2d");
      k.fillStyle = papel;
      k.fillRect(0, 0, o.width, o.height);
      k.imageSmoothingQuality = "high";
      k.drawImage(lienzo, x0, y0, w, h, ancho * margen, (o.height - h * e) / 2, w * e, h * e);
      return o.toDataURL("image/png");
    };
    /** Los iconos: cuadrados, con más margen para que respiren de pequeños. */
    const cuadrado = (lado, margen) => {
      const o = document.createElement("canvas");
      o.width = o.height = lado;
      const k = o.getContext("2d");
      k.fillStyle = papel;
      k.fillRect(0, 0, lado, lado);
      const util = lado * (1 - margen * 2);
      const e = Math.min(util / w, util / h);
      k.imageSmoothingQuality = "high";
      k.drawImage(lienzo, x0, y0, w, h, (lado - w * e) / 2, (lado - h * e) / 2, w * e, h * e);
      return o.toDataURL("image/png");
    };

    return {
      recorte: `${w}x${h}`,
      archivos: {
        "logo.png": tira(360, 0.01),
        "icono-180.png": cuadrado(180, 0.12),
        "icono-64.png": cuadrado(64, 0.1),
      },
    };
  },
  { b64: readFileSync(origen).toString("base64"), tintas: TINTAS },
);
await nav.close();

console.log(`Recorte: ${salida.recorte}`);
for (const [nombre, url] of Object.entries(salida.archivos)) {
  const buf = Buffer.from(url.split(",")[1], "base64");
  writeFileSync(`public/${nombre}`, buf);
  console.log(`  public/${nombre}  ${(buf.length / 1024).toFixed(1)} kB`);
}
