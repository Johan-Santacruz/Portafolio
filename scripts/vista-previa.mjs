/**
 * La imagen que acompaña al enlace cuando se comparte la página (WhatsApp,
 * LinkedIn, X, Slack…): la etiqueta `og:image` de `index.html`.
 *
 *   node scripts/vista-previa.mjs
 *
 * Escribe `public/vista-previa.jpg`, de 1200 × 630 (la medida que piden
 * todas) y por debajo de 300 KB (WhatsApp no enseña las más pesadas). Se
 * compone como una página más, con las mismas tipografías y el mismo acero y
 * lima, y la fotografía el Chromium que ya trae Playwright. El retrato es el
 * del alter ego de frente (`alter.jpg`), el de la portada.
 *
 * Si cambia el nombre o el rol, cámbialo abajo y vuelve a correr esto; las
 * redes guardan la vista previa un tiempo, así que el cambio tarda en verse.
 */
import { chromium } from "playwright";
import { readFileSync, statSync } from "node:fs";

const SALIDA = "public/vista-previa.jpg";
const RETRATO = readFileSync("public/imagenes/retrato/alter.jpg").toString("base64");

const html = /* html */ `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@600;700&family=Saira+Extra+Condensed:wght@700&family=JetBrains+Mono:wght@500;700&display=block" rel="stylesheet" />
<style>
  * { box-sizing: border-box; margin: 0; }
  html, body { width: 1200px; height: 630px; overflow: hidden; }
  body {
    position: relative;
    background: #fdfdfe;
    color: #1d1f22;
    font-family: "Chakra Petch", sans-serif;
  }
  /* La rejilla de plano de las secciones, tenue. */
  body::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      linear-gradient(rgba(23, 24, 21, 0.05) 1px, transparent 1px) 0 0 / 60px 60px,
      linear-gradient(90deg, rgba(23, 24, 21, 0.05) 1px, transparent 1px) 0 0 / 60px 60px;
  }
  /* El retrato a la derecha, fundido hacia el texto. */
  .retrato {
    position: absolute;
    top: 0;
    right: -40px;
    width: 700px;
    height: 630px;
    background: url(data:image/jpeg;base64,${RETRATO}) 50% 18% / cover no-repeat;
    -webkit-mask-image: linear-gradient(to right, transparent 0%, #000 34%);
    mask-image: linear-gradient(to right, transparent 0%, #000 34%);
  }
  .texto {
    position: absolute;
    left: 72px;
    top: 50%;
    width: 600px;
    transform: translateY(-50%);
  }
  .rotulo {
    display: flex;
    align-items: center;
    gap: 16px;
    font-weight: 600;
    font-size: 20px;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    color: rgba(23, 24, 21, 0.6);
  }
  .rotulo::before {
    content: "";
    width: 34px;
    height: 5px;
    background: #c7ff4a;
    box-shadow: 0 0 0 1px rgba(23, 24, 21, 0.25);
  }
  h1 {
    margin-top: 18px;
    font-family: "Saira Extra Condensed", sans-serif;
    font-weight: 700;
    font-size: 104px;
    line-height: 0.9;
    text-transform: uppercase;
    letter-spacing: 0.005em;
  }
  .rol {
    margin-top: 22px;
    font-family: "JetBrains Mono", monospace;
    font-weight: 500;
    font-size: 23px;
    line-height: 1.55;
    color: rgba(23, 24, 21, 0.72);
  }
  .rol b { color: #6a8f00; font-weight: 700; }
  /* La dirección, en una placa de acero con su filo lima. */
  .placa {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    margin-top: 30px;
    padding: 14px 24px 13px 22px;
    font-weight: 600;
    font-size: 20px;
    letter-spacing: 0.04em;
    color: #eef0f2;
    background:
      repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.045) 0 1px, transparent 1px 4px),
      linear-gradient(135deg, #2a2e34, #16181c);
    box-shadow: inset 5px 0 0 #c7ff4a;
    clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px));
  }
  .placa i {
    width: 10px;
    height: 10px;
    background: #c7ff4a;
    border-radius: 50%;
  }
</style>
</head>
<body>
  <div class="retrato"></div>
  <div class="texto">
    <p class="rotulo">Portafolio</p>
    <h1>Johan Camilo<br />Balanta Santacruz</h1>
    <p class="rol"><b>//</b> Ingeniero de Sistemas<br /><b>//</b> Desarrollo web · IA · Automatización</p>
    <p class="placa"><i></i>Cali, Colombia</p>
  </div>
</body>
</html>`;

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1200, height: 630 } });
await pagina.setContent(html, { waitUntil: "networkidle" });
await pagina.evaluate(() => document.fonts.ready);
await pagina.screenshot({ path: SALIDA, type: "jpeg", quality: 86 });
await navegador.close();
console.log(`${SALIDA}: ${Math.round(statSync(SALIDA).size / 1024)} KB`);
