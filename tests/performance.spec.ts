import { test, expect } from '@playwright/test';

test.describe('presupuesto móvil', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'no-preference' });

  test('la portada en reposo no descarga la película ni el vídeo decorativo', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', request => requests.push(request.url()));
    await page.goto('/');
    await page.waitForSelector('#carga', { state: 'detached' });
    await page.waitForTimeout(1500);
    expect(requests.filter(url => /secuencia.*\/f\d+\.jpg/.test(url))).toHaveLength(0);
    expect(requests.filter(url => url.includes('estelas.mp4'))).toHaveLength(0);
    await expect(page.locator('.retrato-normal')).toBeVisible();
  });

  test('una imagen secundaria lenta no bloquea la navegación', async ({ page }) => {
    await page.route('**/imagenes/retrato/alter.jpg', async route => {
      await new Promise(resolve => setTimeout(resolve, 5000));
      await route.abort();
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#carga')).toHaveCount(0, { timeout: 2000 });
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
    await page.locator('.cabecera a[href="#proyectos"]').tap();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1000);
  });
});

for (const touch of [true, false]) {
  test(`la secuencia prioriza el destino y libera memoria (${touch ? 'táctil' : 'escritorio'})`, async ({ browser }) => {
    const context = await browser.newContext({ hasTouch: touch });
    const page = await context.newPage();
    // Página vacía del mismo origen: se ejercita el cargador real con JPEG reales.
    await page.route('**/prueba-secuencia', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Secuencia</title>' }));
    await page.goto('/prueba-secuencia');
    const result = await page.evaluate(async () => {
      const modulePath = '/src/retrato/secuencia.ts';
      const { SecuenciaFotogramas } = await import(/* @vite-ignore */ modulePath);
      const completados: number[] = [];
      let ready: () => void;
      const first = new Promise<void>(resolve => { ready = resolve; });
      const sequence = new SecuenciaFotogramas(121,
        (i: number) => `/imagenes/retrato/secuencia/f${String(i).padStart(3, '0')}.jpg`,
        (i: number) => { completados.push(i); if (sequence.listo(90)) ready(); },
        1,
        (i: number) => `/imagenes/retrato/secuencia-mini/f${String(i).padStart(3, '0')}.jpg`);
      sequence.pedir(90);
      sequence.empezar();
      await first;
      const firstIndex = completados.indexOf(90);
      // Deja drenar la precarga para comprobar que no retiene la película entera.
      await new Promise(resolve => setTimeout(resolve, 1500));
      const retained = sequence.cuadros.filter(Boolean).length;
      sequence.soltar();
      const released = sequence.cuadros.every((frame: unknown) => frame === null);
      sequence.pedir(12);
      await new Promise<void>(resolve => {
        const poll = () => sequence.listo(12) ? resolve() : setTimeout(poll, 20);
        poll();
      });
      const restored = !!sequence.mejor(12);
      sequence.detener();
      return { firstIndex, retained, released, restored };
    });
    expect(result.firstIndex).toBe(0);
    expect(result.retained).toBeLessThanOrEqual(33);
    expect(result.released).toBe(true);
    expect(result.restored).toBe(true);
    await context.close();
  });
}
