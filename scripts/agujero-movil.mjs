/**
 * Los fotogramas del agujero negro para el celular.
 *
 *   node scripts/agujero-movil.mjs
 *
 * Lee `public/imagenes/agujero/` (1280 × 720) y escribe en
 * `public/imagenes/agujero-movil/` el centro de cada uno en vertical, a
 * 360 × 640. En un celular en vertical solo se ve esa franja, porque el
 * agujero está centrado; así los 52 ocupan unos 48 MB en memoria en vez de
 * 190 y se pueden tener todos listos antes de llegar, sin descargar ni
 * descomprimir nada en pleno scroll. Son formas planas con brillos suaves:
 * a esta resolución se ven igual.
 *
 * Si cambian los fotogramas del agujero, vuelve a correr esto.
 */
import { chromium } from "playwright";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";

const ORIGEN = "public/imagenes/agujero";
const DESTINO = "public/imagenes/agujero-movil";
const ANCHO = 360;
const ALTO = 640;

mkdirSync(DESTINO, { recursive: true });
const archivos = readdirSync(ORIGEN).filter((f) => f.endsWith(".jpg")).sort();
const navegador = await chromium.launch();
const pagina = await navegador.newPage();
let total = 0;
for (const nombre of archivos) {
  const datos = readFileSync(`${ORIGEN}/${nombre}`).toString("base64");
  const salida = await pagina.evaluate(
    async ({ datos, ancho, alto }) => {
      const img = new Image();
      img.src = `data:image/jpeg;base64,${datos}`;
      await img.decode();
      // El centro en vertical, a toda la altura del original.
      const corteAlto = img.naturalHeight;
      const corteAncho = Math.round((corteAlto * ancho) / alto);
      const x = Math.round((img.naturalWidth - corteAncho) / 2);
      const lienzo = document.createElement("canvas");
      lienzo.width = ancho;
      lienzo.height = alto;
      const ctx = lienzo.getContext("2d");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, x, 0, corteAncho, corteAlto, 0, 0, ancho, alto);
      return lienzo.toDataURL("image/jpeg", 0.82).split(",")[1];
    },
    { datos, ancho: ANCHO, alto: ALTO },
  );
  const buffer = Buffer.from(salida, "base64");
  writeFileSync(`${DESTINO}/${nombre}`, buffer);
  total += buffer.length;
}
await navegador.close();
console.log(`${archivos.length} fotogramas en ${DESTINO}: ${Math.round(total / 1024)} KB`);
