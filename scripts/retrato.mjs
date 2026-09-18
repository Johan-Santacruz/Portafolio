/**
 * Genera las dos capas del retrato interactivo a partir de UNA sola foto:
 *
 *   public/imagenes/retrato/normal.jpg  → la foto, con su proporción original
 *   public/imagenes/retrato/alter.jpg   → la misma foto con el alter ego
 *                                          tecnológico, píxel a píxel alineada
 *
 * Uso:  node scripts/retrato.mjs ruta/a/tu-foto.jpg [--estilo circuitos] [--ancho 2000]
 *       node scripts/retrato.mjs ruta/a/tu-foto.jpg --opciones
 *
 * Estilos del alter ego (todos sobre fondo negro, un solo acento lima):
 *   circuitos  grado frío, luz lima, scanlines y trazas de circuito alrededor
 *   duotono    sombras negras y luces lima, con grano; el más limpio
 *   wireframe  escaneo 3D: líneas de contorno y vértices, como una malla
 *   ascii      la cara construida con caracteres y fragmentos de código
 *   holograma  proyección translúcida con desplazamiento de canales y cortes
 *
 * `--opciones` genera los cinco estilos en public/imagenes/retrato/opciones/
 * y una hoja de contacto (todas.jpg) para compararlos, sin tocar alter.jpg.
 *
 * Se conserva la proporción de la foto (la portada la recorta con
 * `object-fit: cover` según la pantalla) y se limita el lado largo a
 * `--ancho` píxeles. Si la foto tiene fondo blanco liso, se sustituye por
 * negro en el alter ego: la máscara se ve entonces como una ventana abierta.
 * Si generas el alter ego con otra herramienta, guárdalo como `alter.jpg`
 * con el mismo encuadre que `normal.jpg`.
 */
import { chromium } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

const [, , origen, ...resto] = process.argv;
if (!origen) {
  console.error(
    "Uso: node scripts/retrato.mjs ruta/a/tu-foto.jpg [--estilo circuitos|duotono|wireframe|ascii|holograma] [--ancho 2000] [--opciones]",
  );
  process.exit(1);
}
const valor = (bandera, porDefecto) =>
  resto.includes(bandera) ? resto[resto.indexOf(bandera) + 1] : porDefecto;
const LADO_MAXIMO = Number(valor("--ancho", 2000));
const ESTILOS = ["circuitos", "duotono", "wireframe", "ascii", "holograma"];
const estilo = valor("--estilo", "circuitos");
const soloOpciones = resto.includes("--opciones");
if (!ESTILOS.includes(estilo)) {
  console.error(`Estilo desconocido: ${estilo}. Opciones: ${ESTILOS.join(", ")}`);
  process.exit(1);
}
const ACENTO = "#c7ff4a";
const salida = path.resolve("public/imagenes/retrato");
mkdirSync(salida, { recursive: true });

const ext = path.extname(origen).slice(1).toLowerCase().replace("jpg", "jpeg");
const src = `data:image/${ext};base64,${readFileSync(origen).toString("base64")}`;

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ deviceScaleFactor: 1 });
pagina.on("pageerror", (e) => console.error("Error en la página:", e.message));
// Medidas de salida: la proporción de la foto, con el lado largo limitado.
await pagina.setContent(`<img id="medida" src="${src}">`);
await pagina.waitForFunction(() => document.images[0].complete);
const medida = await pagina.evaluate(() => {
  const { naturalWidth, naturalHeight } = document.images[0];
  return { w: naturalWidth, h: naturalHeight };
});
const escala = Math.min(1, LADO_MAXIMO / Math.max(medida.w, medida.h));
const ANCHO = Math.round(medida.w * escala);
const ALTO = Math.round(medida.h * escala);

const base = `
  <style>
    html, body { margin: 0; background: #000; }
    #marco { position: relative; width: ${ANCHO}px; height: ${ALTO}px; overflow: hidden; background: #050607; }
    #marco > * { position: absolute; inset: 0; }
    img, canvas.foto { width: 100%; height: 100%; object-fit: cover; display: block; }
  </style>`;

const paginaNormal = `${base}<div id="marco"><img src="${src}"></div>`;

/**
 * Utilidades compartidas por los estilos, ejecutadas en la página:
 *  - `azar` con semilla, para que la misma foto dé siempre el mismo resultado
 *  - `fuente`: la foto a tamaño de salida con el fondo blanco pasado a negro
 *  - `luma(x, y)` sobre la fuente
 */
const utilidades = `
  const W = ${ANCHO}, H = ${ALTO}, ACENTO = "${ACENTO}", SRC = ${JSON.stringify(src)};
  let semilla = 20260917;
  const azar = () => { semilla |= 0; semilla = (semilla + 0x6d2b79f5) | 0; let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const entre = (a, b) => a + azar() * (b - a);
  const cargar = (url) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = url; });
  const lienzo = (w = W, h = H) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };

  // La foto a tamaño de salida. Si el fondo es blanco liso, se funde a negro
  // con una rampa suave para no dejar halo.
  async function fuente() {
    const img = await cargar(SRC);
    const c = lienzo(); const x = c.getContext("2d");
    const s = Math.max(W / img.naturalWidth, H / img.naturalHeight);
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    x.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
    const d = x.getImageData(0, 0, W, H); const p = d.data;
    let claros = 0;
    for (let i = 0; i < p.length; i += 4 * 211) if (p[i] > 240 && p[i + 1] > 240 && p[i + 2] > 240) claros++;
    const fondoBlanco = claros > (p.length / (4 * 211)) * 0.25;
    if (fondoBlanco) {
      for (let i = 0; i < p.length; i += 4) {
        const l = (p[i] + p[i + 1] + p[i + 2]) / 3;
        const sat = Math.max(p[i], p[i + 1], p[i + 2]) - Math.min(p[i], p[i + 1], p[i + 2]);
        if (l > 226 && sat < 22) {
          const k = Math.min(1, (l - 226) / 22);
          p[i] *= 1 - k; p[i + 1] *= 1 - k; p[i + 2] *= 1 - k;
        }
      }
      x.putImageData(d, 0, 0);
    }
    return { canvas: c, datos: x.getImageData(0, 0, W, H).data };
  }
  const luma = (p, x, y) => { const i = (y * W + x) * 4; return (p[i] * 0.299 + p[i + 1] * 0.587 + p[i + 2] * 0.114) / 255; };
  const listo = () => { document.body.dataset.listo = "1"; };
`;

const estilos = {
  // Grado frío y oscuro, luz lima, scanlines, cortes de píxel en los bordes,
  // trazas de circuito que rodean la cara sin taparla y código en los márgenes.
  circuitos: `${base}
  <style>
    .foto { filter: grayscale(1) contrast(1.28) brightness(0.72); }
    .frio { background: #0d2026; mix-blend-mode: screen; opacity: .38; }
    .lima { background: radial-gradient(ellipse 60% 55% at 50% 45%, ${ACENTO} 0%, transparent 70%); mix-blend-mode: soft-light; opacity: .9; }
    .lineas { background: repeating-linear-gradient(0deg, rgba(0,0,0,.38) 0 1px, transparent 1px 4px); }
    .rejilla { background:
      linear-gradient(rgba(199,255,74,.07) 1px, transparent 1px) 0 0 / 100% 40px,
      linear-gradient(90deg, rgba(199,255,74,.07) 1px, transparent 1px) 0 0 / 40px 100%; }
    .vineta { background: radial-gradient(ellipse 70% 62% at 50% 45%, transparent 55%, rgba(0,0,0,.7) 100%); }
    .corte { overflow: hidden; }
    .corte img { filter: grayscale(1) contrast(1.4) brightness(.8) sepia(1) hue-rotate(50deg) saturate(2.6); }
    .codigo { font: 500 11px/1.9 ui-monospace, Menlo, monospace; color: ${ACENTO}; opacity: .34; letter-spacing: .04em; white-space: pre; }
    .codigo.izq { left: 22px; top: 60px; }
    .codigo.der { left: auto; right: 22px; top: auto; bottom: 60px; text-align: right; }
    svg { width: 100%; height: 100%; }
  </style>
  <div id="marco">
    <img class="foto" id="foto">
    <div class="frio"></div>
    <div class="lima"></div>
    <div id="cortes"></div>
    <div class="lineas"></div>
    <div class="rejilla"></div>
    <div class="vineta"></div>
    <svg id="circuitos" viewBox="0 0 ${ANCHO} ${ALTO}"></svg>
    <div class="codigo izq" id="codigoIzq"></div>
    <div class="codigo der" id="codigoDer"></div>
  </div>
  <script>
    ${utilidades}
    (async () => {
      const { canvas } = await fuente();
      const url = canvas.toDataURL("image/png");
      document.getElementById("foto").src = url;

      const cara = { x: W * 0.5, y: H * 0.45, rx: Math.min(W, H) * 0.3, ry: Math.min(W, H) * 0.42 };
      const enCara = (x, y) => ((x - cara.x) / cara.rx) ** 2 + ((y - cara.y) / cara.ry) ** 2 < 1;
      const svg = document.getElementById("circuitos");
      const ns = "http://www.w3.org/2000/svg";
      const el = (n, a) => { const e = document.createElementNS(ns, n); for (const k in a) e.setAttribute(k, a[k]); return e; };
      svg.appendChild(el("defs", {})).innerHTML =
        '<filter id="brillo" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
      const dirs = [0, 45, 90, 135, 180, 225, 270, 315].map((g) => [Math.cos((g * Math.PI) / 180), Math.sin((g * Math.PI) / 180)]);
      for (let i = 0; i < 40; i++) {
        let x = azar() < 0.5 ? entre(40, W * 0.3) : entre(W * 0.7, W - 40);
        let y = entre(60, H - 60);
        let d = "M" + x.toFixed(1) + " " + y.toFixed(1);
        let dir = dirs[Math.floor(azar() * 8)];
        const tramos = 2 + Math.floor(azar() * 4);
        let ok = false;
        for (let t = 0; t < tramos; t++) {
          const largo = entre(36, 150);
          const nx = x + dir[0] * largo, ny = y + dir[1] * largo;
          if (nx < 20 || nx > W - 20 || ny < 20 || ny > H - 20 || enCara(nx, ny)) break;
          x = nx; y = ny; ok = true;
          d += " L" + x.toFixed(1) + " " + y.toFixed(1);
          const giro = dirs[(dirs.indexOf(dir) + (azar() < 0.5 ? 1 : 7)) % 8];
          dir = azar() < 0.65 ? giro : dir;
        }
        if (!ok) continue;
        const g = el("g", { stroke: ACENTO, fill: "none", "stroke-width": azar() < 0.25 ? 1.8 : 1.1, opacity: entre(0.35, 0.85).toFixed(2), filter: azar() < 0.45 ? "url(#brillo)" : "" });
        g.appendChild(el("path", { d }));
        g.appendChild(azar() < 0.5
          ? el("circle", { cx: x, cy: y, r: entre(2.5, 4.5), fill: ACENTO, stroke: "none" })
          : el("rect", { x: x - 4, y: y - 4, width: 8, height: 8 }));
        svg.appendChild(g);
      }
      svg.appendChild(el("ellipse", { cx: cara.x, cy: cara.y, rx: cara.rx * 1.06, ry: cara.ry * 1.06, fill: "none", stroke: ACENTO, "stroke-width": 1, "stroke-dasharray": "3 10", opacity: .28 }));
      for (const [ex, ey] of [[cara.x - cara.rx * 1.2, cara.y - cara.ry * 1.18], [cara.x + cara.rx * 1.2, cara.y - cara.ry * 1.18], [cara.x - cara.rx * 1.2, cara.y + cara.ry * 1.18], [cara.x + cara.rx * 1.2, cara.y + cara.ry * 1.18]]) {
        const sx = ex < cara.x ? 1 : -1, sy = ey < cara.y ? 1 : -1;
        svg.appendChild(el("path", { d: "M" + (ex + sx * 22) + " " + ey + " L" + ex + " " + ey + " L" + ex + " " + (ey + sy * 22), stroke: ACENTO, fill: "none", "stroke-width": 1.5, opacity: .7 }));
      }
      const cortes = document.getElementById("cortes");
      for (let i = 0; i < 9; i++) {
        const y = entre(0, H), h = entre(3, 16), dx = entre(-26, 26);
        const lado = azar() < 0.5;
        const izq = lado ? 0 : W * 0.66, der = lado ? W * 0.34 : W;
        const c = document.createElement("div");
        c.className = "corte";
        c.style.clipPath = "inset(" + y + "px " + (W - der) + "px " + (H - y - h) + "px " + izq + "px)";
        c.style.transform = "translateX(" + dx + "px)";
        c.style.opacity = entre(0.55, 0.9);
        const img = document.createElement("img"); img.src = url; c.appendChild(img); cortes.appendChild(c);
      }
      const lineas = (n) => Array.from({ length: n }, () => {
        const hex = "0x" + Math.floor(azar() * 0xffff).toString(16).padStart(4, "0").toUpperCase();
        const frases = ["init.core()", "sync :: ok", "render(frame)", "await signal", "λ → state", "mask.update()", "id: 02", "mode: TECH", "spring(k, d)", "verify(data)", "// no errors", "commit ✓"];
        return hex + "  " + frases[Math.floor(azar() * frases.length)];
      }).join("\\n");
      document.getElementById("codigoIzq").textContent = lineas(14);
      document.getElementById("codigoDer").textContent = lineas(12);
      await new Promise((r) => setTimeout(r, 300));
      listo();
    })();
  </script>`,

  // Sombras negras, luces lima, grano fino. Sin adornos.
  duotono: `${base}
  <style>
    .foto { filter: grayscale(1) contrast(1.15) brightness(0.95); }
    .tinta { background: ${ACENTO}; mix-blend-mode: multiply; }
    .sombra { background: #000; mix-blend-mode: color-burn; opacity: .18; }
    .grano { opacity: .16; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E"); mix-blend-mode: overlay; }
    .lineas { background: repeating-linear-gradient(0deg, rgba(0,0,0,.22) 0 1px, transparent 1px 3px); }
  </style>
  <div id="marco">
    <img class="foto" id="foto">
    <div class="tinta"></div>
    <div class="sombra"></div>
    <div class="grano"></div>
    <div class="lineas"></div>
  </div>
  <script>
    ${utilidades}
    (async () => {
      const { canvas } = await fuente();
      document.getElementById("foto").src = canvas.toDataURL("image/png");
      await new Promise((r) => setTimeout(r, 300));
      listo();
    })();
  </script>`,

  // Escaneo 3D: curvas de nivel de la luz (como una malla), bordes finos y
  // vértices en los puntos de mayor detalle. Lima sobre negro.
  wireframe: `${base}
  <div id="marco"><canvas class="foto" id="salida" width="${ANCHO}" height="${ALTO}"></canvas></div>
  <script>
    ${utilidades}
    (async () => {
      const { datos: p } = await fuente();
      const salida = document.getElementById("salida"); const x = salida.getContext("2d");
      x.fillStyle = "#050607"; x.fillRect(0, 0, W, H);
      const out = x.getImageData(0, 0, W, H); const o = out.data;
      const [ar, ag, ab] = [0xc7, 0xff, 0x4a];
      // Luminancia suavizada (caja 3×3) para que las curvas no sean ruido.
      const L = new Float32Array(W * H);
      for (let y = 1; y < H - 1; y++) for (let xx = 1; xx < W - 1; xx++) {
        let s = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s += luma(p, xx + dx, y + dy);
        L[y * W + xx] = s / 9;
      }
      const NIVELES = 9;
      for (let y = 1; y < H - 1; y++) for (let xx = 1; xx < W - 1; xx++) {
        const i = y * W + xx;
        const l = L[i];
        if (l < 0.045) continue;
        // Curvas de nivel: cambio de banda de luz entre vecinos.
        const b = Math.floor(l * NIVELES);
        const contorno = b !== Math.floor(L[i + 1] * NIVELES) || b !== Math.floor(L[i + W] * NIVELES);
        // Bordes reales (Sobel) para pelo, ojos y silueta.
        const gx = L[i + 1] - L[i - 1], gy = L[i + W] - L[i - W];
        const g = Math.min(1, Math.hypot(gx, gy) * 6);
        const v = Math.max(contorno ? 0.5 + l * 0.35 : 0, g * 0.9);
        if (v <= 0.06) continue;
        const k = i * 4;
        o[k] = 5 + (ar - 5) * v; o[k + 1] = 6 + (ag - 6) * v; o[k + 2] = 7 + (ab - 7) * v;
      }
      x.putImageData(out, 0, 0);
      // Malla suave de fondo y vértices en los cruces con detalle.
      x.strokeStyle = "rgba(199,255,74,.07)"; x.lineWidth = 1;
      for (let gx = 0; gx <= W; gx += 36) { x.beginPath(); x.moveTo(gx + .5, 0); x.lineTo(gx + .5, H); x.stroke(); }
      for (let gy = 0; gy <= H; gy += 36) { x.beginPath(); x.moveTo(0, gy + .5); x.lineTo(W, gy + .5); x.stroke(); }
      x.fillStyle = ACENTO;
      for (let gy = 18; gy < H - 1; gy += 18) for (let gx = 18; gx < W - 1; gx += 18) {
        const i = gy * W + gx;
        const g = Math.hypot(L[i + 1] - L[i - 1], L[i + W] - L[i - W]);
        if (g > 0.05 && azar() < 0.55) { x.globalAlpha = Math.min(1, g * 8); x.fillRect(gx - 1, gy - 1, 2, 2); }
      }
      x.globalAlpha = 1;
      listo();
    })();
  </script>`,

  // La cara construida con caracteres: cuanto más oscura la zona, más denso
  // el carácter. El fondo negro queda vacío. Algunas celdas llevan código.
  ascii: `${base}
  <div id="marco"><canvas class="foto" id="salida" width="${ANCHO}" height="${ALTO}"></canvas></div>
  <script>
    ${utilidades}
    (async () => {
      const { datos: p } = await fuente();
      const salida = document.getElementById("salida"); const x = salida.getContext("2d");
      x.fillStyle = "#050607"; x.fillRect(0, 0, W, H);
      const CELDA = Math.max(8, Math.round(W / 190));
      const RAMPA = " .:-=+*#%@";
      x.font = "500 " + (CELDA * 1.15) + "px ui-monospace, Menlo, monospace";
      x.textBaseline = "top";
      const frases = ["init", "sync", "λ", "ok", "0x", "if", "=>", "//"];
      for (let cy = 0; cy < H; cy += CELDA) for (let cx = 0; cx < W; cx += CELDA) {
        let s = 0, n = 0;
        for (let dy = 0; dy < CELDA; dy += 2) for (let dx = 0; dx < CELDA; dx += 2) {
          if (cx + dx < W && cy + dy < H) { s += luma(p, cx + dx, cy + dy); n++; }
        }
        const l = s / n;
        if (l < 0.05) continue;
        // Brillo → carácter: el fondo (negro) queda vacío; la piel, media; el pelo, densa.
        const idx = Math.min(RAMPA.length - 1, Math.floor((1 - l) * RAMPA.length));
        const ch = azar() < 0.02 ? frases[Math.floor(azar() * frases.length)][0] : RAMPA[idx];
        if (ch === " ") continue;
        x.fillStyle = ACENTO;
        x.globalAlpha = 0.35 + l * 0.65;
        x.fillText(ch, cx, cy);
      }
      x.globalAlpha = 1;
      listo();
    })();
  </script>`,

  // Proyección translúcida: base gris oscura, dos copias desplazadas (lima y
  // blanca) fundidas en pantalla, scanlines gruesas y franjas movidas.
  holograma: `${base}
  <style>
    .foto { filter: grayscale(1) contrast(1.2) brightness(0.55); }
    .capa { mix-blend-mode: screen; }
    .capa.lima { filter: grayscale(1) brightness(1.1) sepia(1) hue-rotate(45deg) saturate(3); opacity: .55; transform: translateX(-7px); }
    .capa.blanca { filter: grayscale(1) brightness(.9); opacity: .35; transform: translateX(7px); }
    .lineas { background: repeating-linear-gradient(0deg, rgba(0,0,0,.5) 0 2px, transparent 2px 6px); }
    .barrido { background: linear-gradient(to bottom, transparent 0, rgba(199,255,74,.16) 48%, transparent 52%, transparent 100%); }
    .corte { overflow: hidden; }
    .corte img { filter: grayscale(1) brightness(.9) sepia(1) hue-rotate(45deg) saturate(3); }
    .vineta { background: radial-gradient(ellipse 65% 65% at 50% 45%, transparent 50%, rgba(0,0,0,.65) 100%); }
  </style>
  <div id="marco">
    <img class="foto" id="foto">
    <img class="capa lima" id="capaLima">
    <img class="capa blanca" id="capaBlanca">
    <div id="cortes"></div>
    <div class="lineas"></div>
    <div class="barrido"></div>
    <div class="vineta"></div>
  </div>
  <script>
    ${utilidades}
    (async () => {
      const { canvas } = await fuente();
      const url = canvas.toDataURL("image/png");
      for (const id of ["foto", "capaLima", "capaBlanca"]) document.getElementById(id).src = url;
      const cortes = document.getElementById("cortes");
      for (let i = 0; i < 7; i++) {
        const y = entre(H * 0.1, H * 0.9), h = entre(4, 22), dx = entre(-40, 40);
        const c = document.createElement("div");
        c.className = "corte";
        c.style.clipPath = "inset(" + y + "px 0 " + (H - y - h) + "px 0)";
        c.style.transform = "translateX(" + dx + "px)";
        c.style.opacity = entre(0.6, 0.95);
        const img = document.createElement("img"); img.src = url; c.appendChild(img); cortes.appendChild(c);
      }
      await new Promise((r) => setTimeout(r, 300));
      listo();
    })();
  </script>`,
};

async function renderizar(html, destino) {
  await pagina.setViewportSize({ width: ANCHO, height: ALTO });
  await pagina.setContent(html, { waitUntil: "load" });
  await pagina.waitForFunction(
    () =>
      Array.from(document.images).every((i) => i.complete) &&
      (!document.querySelector("script") || document.body.dataset.listo === "1"),
    null,
    { timeout: 60000 },
  );
  await pagina.locator("#marco").screenshot({ path: destino, type: "jpeg", quality: 86 });
}

if (soloOpciones) {
  const carpeta = path.join(salida, "opciones");
  mkdirSync(carpeta, { recursive: true });
  for (const nombre of ESTILOS) {
    await renderizar(estilos[nombre], path.join(carpeta, `${nombre}.jpg`));
    console.log(`✓ opciones/${nombre}.jpg`);
  }
  // Hoja de contacto: la foto normal y los cinco estilos, con rótulo.
  const celda = 640;
  const alto = Math.round((celda * ALTO) / ANCHO);
  const tarjetas = ["normal", ...ESTILOS]
    .map((n) => {
      const archivo = n === "normal" ? path.join(salida, "normal.jpg") : path.join(carpeta, `${n}.jpg`);
      const b64 = readFileSync(archivo).toString("base64");
      return `<figure><img src="data:image/jpeg;base64,${b64}"><figcaption>${n === "normal" ? "foto normal" : n}</figcaption></figure>`;
    })
    .join("");
  const hoja = `
    <style>
      body { margin: 0; background: #111; font: 500 15px/1 ui-monospace, Menlo, monospace; color: #c7ff4a; }
      #hoja { display: grid; grid-template-columns: repeat(3, ${celda}px); gap: 18px; padding: 18px; width: max-content; }
      figure { margin: 0; } img { display: block; width: ${celda}px; height: ${alto}px; }
      figcaption { padding: 10px 2px 4px; text-transform: uppercase; letter-spacing: .12em; }
    </style>
    <div id="hoja">${tarjetas}</div>`;
  await pagina.setViewportSize({ width: celda * 3 + 18 * 4, height: (alto + 60) * 2 + 18 * 3 });
  await pagina.setContent(hoja, { waitUntil: "load" });
  await pagina.locator("#hoja").screenshot({ path: path.join(carpeta, "todas.jpg"), type: "jpeg", quality: 84 });
  console.log("✓ opciones/todas.jpg");
} else {
  await renderizar(paginaNormal, path.join(salida, "normal.jpg"));
  console.log(`✓ normal.jpg (${ANCHO}×${ALTO})`);
  await renderizar(estilos[estilo], path.join(salida, "alter.jpg"));
  console.log(`✓ alter.jpg (${ANCHO}×${ALTO}, estilo ${estilo})`);
}
await navegador.close();
