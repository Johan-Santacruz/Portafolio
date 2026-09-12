import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("presentación y precios se abren con teclado y restauran el foco", async ({
  page,
}) => {
  await page.goto("/");
  for (const name of ["Presentación", "Precios"]) {
    const opener = page
      .getByRole("navigation")
      .getByRole("button", { name, exact: true });
    await opener.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(opener).toBeFocused();
  }
});

test("movimiento reducido muestra el poster y mantiene el video pausado", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".hero-poster")).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator(".hero-video")
        .evaluate((video: HTMLVideoElement) => video.paused),
    )
    .toBe(true);
  await expect(page.locator(".hero-video")).toHaveAttribute("poster", /media/);
});

test("el video se pausa al salir del hero y vuelve al regresar", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect
    .poll(() =>
      page
        .locator(".hero-video")
        .evaluate((video: HTMLVideoElement) => video.paused),
    )
    .toBe(false);
  await page.locator("#contacto").scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      page
        .locator(".hero-video")
        .evaluate((video: HTMLVideoElement) => video.paused),
    )
    .toBe(true);
  await page.locator("#top").scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      page
        .locator(".hero-video")
        .evaluate((video: HTMLVideoElement) => video.paused),
    )
    .toBe(false);
});

test("contenido se revela al entrar en el viewport", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const title = page.locator("#titulo-trabajos");
  await expect(title).toHaveCSS("opacity", "0");
  await title.scrollIntoViewIfNeeded();
  await expect(title).toHaveCSS("opacity", "1");
});

test("móvil permite abrir las ventanas sin navegación ni desbordamiento", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("navigation")).toBeHidden();
  await page.getByRole("button", { name: "Conoce mi enfoque" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Cerrar ventana" }).click();
  await page.getByRole("button", { name: "Consultar precios" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  for (const width of [320, 390, 760, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test("landing y ventanas cumplen la auditoría automatizada de accesibilidad", async ({
  page,
}) => {
  await page.goto("/");
  const audit = async () => {
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      results.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          reason: n.failureSummary,
        })),
      })),
    ).toEqual([]);
  };
  await audit();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Precios", exact: true })
    .click();
  await audit();
});

test("el video del panel solo corre cuando la sección está a la vista", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const panel = page.locator(".plano-video");
  await expect
    .poll(() => panel.evaluate((video: HTMLVideoElement) => video.paused))
    .toBe(true);
  await page.locator("#enfoque").scrollIntoViewIfNeeded();
  await expect
    .poll(() => panel.evaluate((video: HTMLVideoElement) => video.paused))
    .toBe(false);
  await page.locator("#contacto").scrollIntoViewIfNeeded();
  await expect
    .poll(() => panel.evaluate((video: HTMLVideoElement) => video.paused))
    .toBe(true);
});

test("la portada se despide al bajar y se queda quieta con movimiento reducido", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const opacidad = () =>
    page
      .locator(".hero-contenido")
      .evaluate((nodo) => Number(getComputedStyle(nodo).opacity));
  expect(await opacidad()).toBeCloseTo(1, 1);
  await page.evaluate(() => window.scrollTo(0, 450));
  await expect.poll(opacidad).toBeLessThan(0.6);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await page.evaluate(() => window.scrollTo(0, 450));
  await expect.poll(opacidad).toBe(1);
});

test("los bloques giran hacia atrás al salir y vuelven al subir", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const titulo = page.locator("#titulo-editorial");
  const atras = () =>
    titulo.evaluate((nodo) =>
      Number(getComputedStyle(nodo).getPropertyValue("--atras")),
    );

  await titulo.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -200));
  await expect.poll(atras).toBe(0);

  // Al subir por la franja alta, el bloque gira y se aleja.
  await page.evaluate(() => window.scrollTo(0, 1080));
  await expect.poll(atras).toBeGreaterThan(0.5);
  const girado = await titulo.evaluate(
    (nodo) => getComputedStyle(nodo).transform,
  );
  expect(girado).toContain("matrix3d");

  // Y volver arriba lo devuelve exactamente a su sitio: no hay estado.
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(atras).toBe(0);
  await expect(titulo).toHaveCSS("filter", "none");
});

const anchos = [320, 390, 768, 1024, 1440, 2560];

test("ningún ancho produce desbordamiento horizontal", async ({ page }) => {
  await page.goto("/");
  for (const width of anchos) {
    await page.setViewportSize({ width, height: width < 500 ? 780 : 900 });
    await page.waitForTimeout(250);
    // recorre la página entera: el contenido que aparece al bajar también cuenta
    const desborde = await page.evaluate(async () => {
      let peor = 0;
      for (let y = 0; y < document.body.scrollHeight; y += 500) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 30));
        const d =
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth;
        if (d > peor) peor = d;
      }
      window.scrollTo(0, 0);
      return peor;
    });
    expect(desborde, `desbordamiento a ${width}px`).toBeLessThanOrEqual(0);
  }
});

test("en apaisado el titular cabe entero bajo la cabecera", async ({
  page,
}) => {
  await page.setViewportSize({ width: 667, height: 375 });
  await page.goto("/");
  const medidas = await page.evaluate(() => {
    const caja = (s) => document.querySelector(s)?.getBoundingClientRect();
    const h1 = caja("h1");
    const cabecera = caja(".campana-header");
    return {
      titularArriba: Math.round(h1?.top ?? -1),
      titularAbajo: Math.round(h1?.bottom ?? -1),
      cabeceraAbajo: Math.round(cabecera?.bottom ?? 0),
      alto: window.innerHeight,
    };
  });
  // Ni cortado por arriba, ni por debajo del borde, ni encima de la cabecera.
  expect(medidas.titularArriba).toBeGreaterThanOrEqual(medidas.cabeceraAbajo);
  expect(medidas.titularAbajo).toBeLessThanOrEqual(medidas.alto);
});

test("no queda texto por debajo de 10px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const diminutos = await page.evaluate(() => {
    const fuera = new Set();
    for (const el of document.querySelectorAll("p, li, span, a, dd, dt, h3")) {
      if (!el.textContent?.trim()) continue;
      const t = parseFloat(getComputedStyle(el).fontSize);
      if (t && t < 10) fuera.add(el.className || el.tagName);
    }
    return [...fuera];
  });
  expect(diminutos).toEqual([]);
});

test("la landing completa de un trabajo se abre, se recorre y devuelve el foco", async ({
  page,
}) => {
  await page.goto("/");
  const abridor = page
    .getByRole("button", { name: /Ver la landing completa/i })
    .first();
  await abridor.scrollIntoViewIfNeeded();
  await abridor.focus();
  await page.keyboard.press("Enter");

  const ventana = page.locator("dialog.ventana-landing");
  await expect(ventana).toBeVisible();
  await expect(ventana.locator("img")).toBeVisible();

  // El lienzo tiene que poder recorrerse: es una página entera.
  const recorrible = await page
    .locator(".landing-lienzo")
    .evaluate((nodo) => nodo.scrollHeight > nodo.clientHeight + 10);
  expect(recorrible).toBe(true);

  await page.keyboard.press("Escape");
  await expect(ventana).not.toBeVisible();
  await expect(abridor).toBeFocused();
});
