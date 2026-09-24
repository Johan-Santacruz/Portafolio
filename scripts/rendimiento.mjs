// Ejecutar después de npm run build. Mide el mismo recorrido, sin servidor
// de desarrollo, con CPU 4× más lenta. No equivale a un teléfono físico.
import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';

const root = resolve('dist');
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp4': 'video/mp4' };
const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const file = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
  if (!file.startsWith(`${root}/`)) { res.writeHead(403).end(); return; }
  try {
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': tipos[extname(file)] || 'application/octet-stream' });
    res.end(data);
  } catch { res.writeHead(404).end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch();
try {
  for (const mobile of [true, false]) {
    const context = await browser.newContext(mobile
      ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }
      : { viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await cdp.send('Performance.enable');
    await page.addInitScript(() => performance.setResourceTimingBufferSize(5000));
    await page.goto(`http://127.0.0.1:${server.address().port}/?suave=0`);
    await page.waitForSelector('#carga', { state: 'detached' });
    await page.waitForTimeout(2000);
    const initial = await page.evaluate(() => {
      const r = performance.getEntriesByType('resource');
      return {
        requests: r.length,
        frames: r.filter(x => x.name.includes('secuencia')).length,
        bytes: r.reduce((s, x) => s + x.transferSize, 0),
        videos: r.filter(x => x.name.includes('.mp4')).length,
      };
    });
    const sections = {};
    for (const id of ['top', 'herramientas', 'proyectos', 'trayectoria', 'contacto']) {
      const before = (await cdp.send('Performance.getMetrics')).metrics;
      const frames = await page.evaluate(async id => {
        const s = document.getElementById(id);
        const from = s.getBoundingClientRect().top + scrollY;
        const length = Math.min(s.offsetHeight - innerHeight, 3000);
        const intervals = [];
        let last;
        for (let i = 0; i <= 90; i++) {
          window.scrollTo({ top: from + length * i / 90, behavior: 'instant' });
          const now = await new Promise(requestAnimationFrame);
          if (last) intervals.push(now - last);
          last = now;
        }
        intervals.sort((a, b) => a - b);
        return { p95ms: Math.round(intervals[Math.floor(intervals.length * .95)]), over50ms: intervals.filter(n => n > 50).length };
      }, id);
      const after = (await cdp.send('Performance.getMetrics')).metrics;
      const delta = name => Math.round(((after.find(m => m.name === name)?.value || 0) - (before.find(m => m.name === name)?.value || 0)) * 1000);
      sections[id] = { ...frames, layoutMs: delta('LayoutDuration'), styleMs: delta('RecalcStyleDuration'), taskMs: delta('TaskDuration') };
    }
    console.log(JSON.stringify({ profile: mobile ? 'mobile' : 'desktop', cpuSlowdown: 4, initial, sections }, null, 2));
    await context.close();
  }
} finally {
  await browser.close();
  server.close();
}
