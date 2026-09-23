/**
 * Baja la imagen de cada publicación de «Lo que han dicho» y la deja lista
 * para la página.
 *
 *   node scripts/reconocimientos.mjs
 *
 * Escribe un JPEG cuadrado por reconocimiento en
 * `public/imagenes/reconocimientos/`. El nombre del archivo es el `id` del
 * reconocimiento en `src/datos/reconocimientos.ts`: si añades uno allí,
 * añádelo también en la lista de abajo y vuelve a correr esto.
 *
 * Por qué se guardan en el repositorio y no se enlazan directamente: las
 * direcciones de las imágenes de Instagram y LinkedIn llevan firma y caducan,
 * así que enlazarlas deja la página con huecos a las pocas semanas. Instagram
 * además no entrega la vista previa a `curl`, solo a un navegador de verdad;
 * por eso esto usa el Chromium que ya trae Playwright.
 *
 * Las fotos son de quien las publicó (la universidad y el semillero). Van con
 * su medio a la vista y enlazadas a la publicación original.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const SALIDA = "public/imagenes/reconocimientos";
/** Lado del cuadrado que se guarda. Se ve a menos de la mitad; el resto es
 *  para pantallas de mucha densidad. */
const LADO = 400;

const FUENTES = [
  ["usb-hackathon", "https://www.instagram.com/p/DZvCJSRil7O/"],
  ["padia-sala", "https://www.instagram.com/p/DVjoC5QjwEE/"],
  [
    "usb-sala",
    "https://es.linkedin.com/posts/johan-santacruz-366a641aa_activity-7437654534367105026-D2sP",
  ],
  [
    "johan-regional",
    "https://es.linkedin.com/posts/johan-santacruz-366a641aa_datic-padia-hackathoncolombia-activity-7455740372376449024-XhAP",
  ],
  [
    "padia-taller",
    "https://es.linkedin.com/posts/sofia-valencia-solano-66022a345_matem%C3%A1ticas-semilleropadia-educaci%C3%B3nconsentido-activity-7371688396055928833-gQzk",
  ],
];

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36";

mkdirSync(SALIDA, { recursive: true });
const nav = await chromium.launch();
const ctx = await nav.newContext({ userAgent: UA });

for (const [id, url] of FUENTES) {
  const pag = await ctx.newPage();
  try {
    await pag.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    // La vista previa la escribe el guion de la página, no viene en el HTML.
    await pag.waitForTimeout(2500);
    const origen = await pag.evaluate(
      () => document.querySelector('meta[property="og:image"]')?.content || null,
    );
    if (!origen) {
      console.log(`  ${id}: la publicación no entrega vista previa`);
      await pag.close();
      continue;
    }
    const resp = await ctx.request.get(origen);
    const b64 = (await resp.body()).toString("base64");
    // Recorte cuadrado por el centro: las tres vienen en vertical o en
    // cuadrado, y en una fila horizontal un recorte apaisado corta cabezas.
    const jpeg = await pag.evaluate(
      async ({ b64, lado }) => {
        const img = new Image();
        img.src = "data:image/jpeg;base64," + b64;
        await img.decode();
        const corte = Math.min(img.naturalWidth, img.naturalHeight);
        const o = document.createElement("canvas");
        o.width = o.height = lado;
        const k = o.getContext("2d");
        k.imageSmoothingQuality = "high";
        k.drawImage(
          img,
          (img.naturalWidth - corte) / 2,
          (img.naturalHeight - corte) / 2,
          corte,
          corte,
          0,
          0,
          lado,
          lado,
        );
        return o.toDataURL("image/jpeg", 0.82);
      },
      { b64, lado: LADO },
    );
    const buf = Buffer.from(jpeg.split(",")[1], "base64");
    writeFileSync(`${SALIDA}/${id}.jpg`, buf);
    console.log(`  ${SALIDA}/${id}.jpg  ${(buf.length / 1024).toFixed(1)} kB`);
  } catch (e) {
    console.log(`  ${id}: ${e.message.slice(0, 90)}`);
  }
  await pag.close();
}

await nav.close();
