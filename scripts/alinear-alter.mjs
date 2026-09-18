/**
 * Alinea un alter ego generado fuera (por ejemplo con IA, image-to-image) con
 * `normal.jpg`, para que las dos capas coincidan píxel a píxel en la portada.
 *
 * Se apoya en los ojos: das las coordenadas de las dos pupilas en cada imagen
 * y el script escala y desplaza el alter ego hasta que sus pupilas caen justo
 * sobre las de la foto normal. Escribe public/imagenes/retrato/alter.jpg y,
 * para comprobarlo, una mezcla al 50 % de las dos capas en alter-mezcla.jpg.
 *
 * Uso:
 *   node scripts/alinear-alter.mjs ruta/al/alter.png \
 *     --ojos-normal 743,379 897,380 \
 *     --ojos-alter 2562,1075 3002,1075
 *
 * Las coordenadas son píxeles de cada archivo (x,y de la pupila izquierda y
 * derecha). Para medirlas, abre la imagen en cualquier visor que muestre la
 * posición del cursor.
 */
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";

const [, , origen, ...resto] = process.argv;
const pares = (bandera) => {
  const i = resto.indexOf(bandera);
  if (i < 0) return null;
  return [resto[i + 1], resto[i + 2]].map((p) => p.split(",").map(Number));
};
const ojosNormal = pares("--ojos-normal");
const ojosAlter = pares("--ojos-alter");
if (!origen || !ojosNormal || !ojosAlter) {
  console.error(
    "Uso: node scripts/alinear-alter.mjs alter.png --ojos-normal x,y x,y --ojos-alter x,y x,y",
  );
  process.exit(1);
}

const carpeta = path.resolve("public/imagenes/retrato");
const dato = (archivo) => {
  const ext = path.extname(archivo).slice(1).toLowerCase().replace("jpg", "jpeg");
  return `data:image/${ext};base64,${readFileSync(archivo).toString("base64")}`;
};
const srcNormal = dato(path.join(carpeta, "normal.jpg"));
const srcAlter = dato(origen);

// Escala: relación entre distancias interpupilares. Traslación: que el punto
// medio de los ojos del alter caiga sobre el de la foto normal.
const dist = ([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const medio = ([a, b]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const escala = dist(ojosNormal) / dist(ojosAlter);
const [cxN, cyN] = medio(ojosNormal);
const [cxA, cyA] = medio(ojosAlter);
const tx = cxN - cxA * escala;
const ty = cyN - cyA * escala;

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ deviceScaleFactor: 1 });
await pagina.setContent(`<img id="n" src="${srcNormal}"><img id="a" src="${srcAlter}">`);
await pagina.waitForFunction(() => Array.from(document.images).every((i) => i.complete && i.naturalWidth));
const { W, H, fondo } = await pagina.evaluate(() => {
  const n = document.getElementById("n");
  const c = document.createElement("canvas");
  c.width = n.naturalWidth;
  c.height = n.naturalHeight;
  const x = c.getContext("2d");
  x.drawImage(n, 0, 0);
  const [r, g, b] = x.getImageData(4, 4, 1, 1).data;
  return { W: n.naturalWidth, H: n.naturalHeight, fondo: `rgb(${r},${g},${b})` };
});
await pagina.setViewportSize({ width: W, height: H });
await pagina.setContent(`
  <style>body{margin:0} canvas{display:block}</style>
  <canvas id="c" width="${W}" height="${H}"></canvas>
  <img id="n" src="${srcNormal}" hidden><img id="a" src="${srcAlter}" hidden>`);
await pagina.waitForFunction(() => Array.from(document.images).every((i) => i.complete && i.naturalWidth));

const pintar = (mezcla) =>
  pagina.evaluate(
    ([escala, tx, ty, fondo, mezcla]) => {
      const c = document.getElementById("c");
      const x = c.getContext("2d");
      const a = document.getElementById("a");
      const n = document.getElementById("n");
      // El fondo es el de la foto normal, por si el alter no cubre algún borde.
      x.globalAlpha = 1;
      x.fillStyle = fondo;
      x.fillRect(0, 0, c.width, c.height);
      x.drawImage(a, tx, ty, a.naturalWidth * escala, a.naturalHeight * escala);
      if (mezcla) {
        x.globalAlpha = 0.5;
        x.drawImage(n, 0, 0);
      }
    },
    [escala, tx, ty, fondo, mezcla],
  );

await pintar(false);
await pagina.locator("#c").screenshot({ path: path.join(carpeta, "alter.jpg"), type: "jpeg", quality: 88 });
await pintar(true);
await pagina.locator("#c").screenshot({ path: path.join(carpeta, "alter-mezcla.jpg"), type: "jpeg", quality: 80 });
await navegador.close();
console.log(`✓ alter.jpg (${W}×${H}) — escala ${escala.toFixed(4)}, desplazamiento ${tx.toFixed(1)}, ${ty.toFixed(1)}`);
console.log("✓ alter-mezcla.jpg — comprueba que los ojos coinciden; bórralo después");
