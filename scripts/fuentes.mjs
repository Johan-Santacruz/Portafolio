/**
 * Copia las tipografías de Google Fonts al proyecto.
 *
 *   node scripts/fuentes.mjs
 *
 * Escribe los .woff2 en `src/estilos/fuentes/` y sus @font-face en
 * `src/estilos/fuentes.css`. Vite les pone hash al compilar, así que van a
 * /assets/ con caché para siempre.
 *
 * Servidas desde el propio dominio, el navegador no tiene que abrir conexión
 * con fonts.googleapis.com ni con fonts.gstatic.com antes de pintar: en un
 * celular con 4G eso retrasaba la primera pintura. Tampoco se pueden pedir
 * sin bloquear (con `preload` y `onload`): la portada y las herramientas
 * guardan medidas del texto al montar, y si la tipografía llega después se
 * quedan con las de la de reserva.
 *
 * Solo los alfabetos latino y latino extendido: la página está en español e
 * inglés. Para cambiar de familia o de peso, edita FAMILIAS y vuelve a
 * ejecutarlo. Todas tienen licencia OFL, que permite servirlas uno mismo.
 */
import { mkdir, writeFile, readdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const FAMILIAS = [
  "Chakra+Petch:wght@500;600;700",
  "Instrument+Sans:ital,wdth,wght@0,75..100,400..700",
  "JetBrains+Mono:wght@500;700",
  "Saira+Extra+Condensed:wght@700",
];
const ALFABETOS = ["latin-ext", "latin"];
// Google decide el formato por el navegador que pide: con uno moderno, woff2.
const NAVEGADOR =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";

const carpeta = resolve("src/estilos/fuentes");
const url = `https://fonts.googleapis.com/css2?${FAMILIAS.map((f) => `family=${f}`).join("&")}&display=swap`;
const css = await (await fetch(url, { headers: { "User-Agent": NAVEGADOR } })).text();

// Cada bloque viene precedido de un comentario con su alfabeto: /* latin */
const bloques = [...css.matchAll(/\/\* ([\w-]+) \*\/\s*@font-face \{([^}]+)\}/g)]
  .filter(([, alfabeto]) => ALFABETOS.includes(alfabeto))
  .map(([, alfabeto, cuerpo]) => ({ alfabeto, cuerpo }));
if (!bloques.length) throw new Error("Google no devolvió ningún @font-face");

await rm(carpeta, { recursive: true, force: true });
await mkdir(carpeta, { recursive: true });

// Una familia variable trae el mismo archivo para varios pesos (o uno solo
// con un rango, «400 700»): se baja una vez y se nombra sin peso.
const archivos = new Map();
for (const b of bloques) {
  b.familia = b.cuerpo.match(/font-family: '([^']+)'/)[1];
  b.peso = b.cuerpo.match(/font-weight: ([^;]+);/)[1];
  b.origen = b.cuerpo.match(/url\(([^)]+)\)/)[1];
  const pesos = archivos.get(b.origen) ?? new Set();
  archivos.set(b.origen, pesos.add(b.peso));
}
const nombres = new Map();
for (const { familia, alfabeto, origen } of bloques) {
  if (nombres.has(origen)) continue;
  const pesos = [...archivos.get(origen)];
  const variable = pesos.length > 1 || pesos[0].includes(" ");
  const nombre = [familia.toLowerCase().replaceAll(" ", "-"), variable ? "" : pesos[0], alfabeto]
    .filter(Boolean)
    .join("-");
  nombres.set(origen, `${nombre}.woff2`);
  const datos = Buffer.from(await (await fetch(origen)).arrayBuffer());
  await writeFile(resolve(carpeta, `${nombre}.woff2`), datos);
}

let salida = `/* Generado por scripts/fuentes.mjs: no lo edites a mano. */\n`;
for (const { alfabeto, cuerpo, origen } of bloques) {
  const local = cuerpo.replace(/url\([^)]+\)/, `url("./fuentes/${nombres.get(origen)}")`);
  salida += `/* ${alfabeto} */\n@font-face {${local}}\n`;
}
await writeFile(resolve("src/estilos/fuentes.css"), salida);

for (const nombre of await readdir(carpeta)) console.log(nombre);
