/**
 * Rasteriza las páginas de la hoja de vida a JPEG, que es lo que se ve en la
 * ventana del cierre (un PDF embebido no se muestra bien en móvil).
 *
 *   node scripts/hoja-de-vida.mjs
 *
 * Lee `public/documentos/hoja-de-vida-johan-balanta.pdf` y escribe
 * `hoja-de-vida-1.jpg`, `-2.jpg`… junto a él. Si cambia el número de páginas,
 * ajusta `HOJA_PAGINAS` en `src/componentes/Cierre.tsx`.
 */
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";

const PDF = "public/documentos/hoja-de-vida-johan-balanta.pdf";
const PDFJS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174";

const pdf = readFileSync(PDF).toString("base64");
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("about:blank");
await page.addScriptTag({ url: `${PDFJS}/pdf.min.js` });
const paginas = await page.evaluate(
  async ([b64, base]) => {
    const pdfjs = window.pdfjsLib;
    pdfjs.GlobalWorkerOptions.workerSrc = `${base}/pdf.worker.min.js`;
    const bin = atob(b64);
    const datos = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) datos[i] = bin.charCodeAt(i);
    const doc = await pdfjs.getDocument({ data: datos }).promise;
    const salida = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const p = await doc.getPage(n);
      // 1400 px de ancho: se lee bien en pantalla sin pesar de más.
      const escala = 1400 / p.getViewport({ scale: 1 }).width;
      const vp = p.getViewport({ scale: escala });
      const c = document.createElement("canvas");
      c.width = vp.width;
      c.height = vp.height;
      await p.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise;
      salida.push(c.toDataURL("image/jpeg", 0.72));
    }
    return salida;
  },
  [pdf, PDFJS],
);
paginas.forEach((d, i) =>
  writeFileSync(
    `public/documentos/hoja-de-vida-${i + 1}.jpg`,
    Buffer.from(d.split(",")[1], "base64"),
  ),
);
console.log(`páginas escritas: ${paginas.length}`);
await browser.close();
