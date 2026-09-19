import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const pintado = (page) =>
  page.locator(".retrato-alter").evaluate((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d")!;
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let opacos = 0;
    for (let i = 3; i < data.length; i += 4 * 97) if (data[i] > 40) opacos++;
    return opacos;
  });

test("el retrato revela el alter ego bajo el cursor y lo retira al salir", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const retrato = page.locator(".retrato");
  await expect(retrato).toHaveAttribute("data-listo", "true");
  // Deja pasar la insinuación automática antes de medir.
  await expect.poll(() => retrato.getAttribute("data-activo"), { timeout: 8000 }).toBe("true");
  await expect.poll(() => retrato.getAttribute("data-activo"), { timeout: 8000 }).toBeNull();

  const caja = (await retrato.boundingBox())!;
  await page.mouse.move(caja.x + caja.width * 0.5, caja.y + caja.height * 0.45);
  await expect(retrato).toHaveAttribute("data-activo", "true");
  await expect.poll(() => pintado(page)).toBeGreaterThan(50);

  // El retrato ocupa toda la ventana: salir de él es sacar el ratón de la
  // página, que Playwright no puede hacer moviendo el puntero.
  await retrato.dispatchEvent("pointerleave", { pointerType: "mouse" });
  await expect(retrato).not.toHaveAttribute("data-activo", "true");
  await expect.poll(() => pintado(page), { timeout: 3000 }).toBe(0);
});

test("con movimiento reducido el revelado sigue funcionando", async ({
  page,
}) => {
  await page.goto("/");
  const retrato = page.locator(".retrato");
  await expect(retrato).toHaveAttribute("data-listo", "true");
  await page.waitForTimeout(1600);
  expect(await retrato.getAttribute("data-activo")).toBeNull();
  const caja = (await retrato.boundingBox())!;
  await page.mouse.move(caja.x + caja.width * 0.5, caja.y + caja.height * 0.45);
  await expect.poll(() => pintado(page)).toBeGreaterThan(50);
});

test("el retrato se revela con el teclado al recibir el foco", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator(".retrato").focus();
  await expect(page.locator(".retrato")).toHaveAttribute("data-activo", "true");
  await page.keyboard.press("Tab");
  await expect(page.locator(".retrato")).not.toHaveAttribute("data-activo", "true");
});

test("en táctil, mantener pulsado revela sin desplazar la página", async ({
  browser,
}) => {
  const contexto = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    baseURL: "http://127.0.0.1:5199",
  });
  const page = await contexto.newPage();
  await page.goto("/");
  await expect(page.locator(".retrato")).toHaveAttribute("data-listo", "true");
  const cdp = await contexto.newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 195, y: 330 }],
  });
  await page.waitForTimeout(350);
  for (let i = 1; i <= 6; i++)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: 195 + i * 10, y: 330 + i * 6 }],
    });
  await expect(page.locator(".retrato")).toHaveAttribute("data-activo", "true");
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(page.locator(".retrato")).not.toHaveAttribute("data-activo", "true");
  await contexto.close();
});

test("la página cumple la auditoría automatizada de accesibilidad", async ({
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
  // Y con las herramientas a la vista.
  await page.evaluate(() =>
    window.scrollTo(0, document.getElementById("herramientas")!.offsetTop),
  );
  await expect(page.locator(".herr-grupo").first()).toHaveAttribute("data-estado", "activo");
  await audit();
  // Y con el cierre ya revelado.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(page.locator("#contacto")).toHaveAttribute("data-texto", "");
  await audit();
});

test("al bajar, la portada revela el alter ego, reproduce la secuencia y vuelve", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const retrato = page.locator(".retrato");
  await expect(retrato).toHaveAttribute("data-listo", "true");
  const { recorrido, alto } = await page.evaluate(() => ({
    recorrido:
      document.querySelector(".campana-hero")!.getBoundingClientRect().height -
      innerHeight,
    alto: innerHeight,
  }));
  expect(recorrido).toBeGreaterThan(alto);

  // Mitad del tramo de revelado: el alter ego asoma sin puntero.
  await page.evaluate((y) => window.scrollTo(0, y), recorrido * 0.15);
  await expect(retrato).toHaveAttribute("data-fase", "revelado");
  await expect.poll(() => pintado(page)).toBeGreaterThan(50);

  // Dentro del vídeo: la secuencia pinta y la portada sigue fija.
  await page.evaluate((y) => window.scrollTo(0, y), recorrido * 0.6);
  await expect(retrato).toHaveAttribute("data-fase", "secuencia");
  await expect
    .poll(() =>
      page.locator(".retrato-secuencia").evaluate((c: HTMLCanvasElement) => {
        const d = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
        let opacos = 0;
        for (let i = 3; i < d.length; i += 4 * 97) if (d[i] > 40) opacos++;
        return opacos;
      }),
    )
    .toBeGreaterThan(200);
  expect(
    await page.evaluate(() => document.querySelector(".hero-fijo")!.getBoundingClientRect().top),
  ).toBe(0);

  // Y subir deja todo como al principio: no hay estado.
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(retrato).toHaveAttribute("data-fase", "mascara");
  await expect.poll(() => pintado(page), { timeout: 3000 }).toBe(0);
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

test("en apaisado el retrato cubre la portada entera", async ({ page }) => {
  await page.setViewportSize({ width: 667, height: 375 });
  await page.goto("/");
  const medidas = await page.evaluate(() => {
    const retrato = document.querySelector(".retrato")?.getBoundingClientRect();
    return {
      retratoAlto: Math.round(retrato?.height ?? 0),
      retratoAncho: Math.round(retrato?.width ?? 0),
      alto: window.innerHeight,
      ancho: window.innerWidth,
    };
  });
  expect(medidas.retratoAlto).toBe(medidas.alto);
  expect(medidas.retratoAncho).toBe(medidas.ancho);
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

test("las herramientas pasan por el lector una categoría cada vez", async ({
  page,
}) => {
  await page.goto("/");
  const seccion = page.locator("#herramientas");
  const grupos = page.locator(".herr-grupo");
  await expect(grupos).toHaveCount(6);
  // Todas las herramientas llevan logo.
  const placas = await page.locator(".herr-placa").count();
  expect(placas).toBeGreaterThan(20);
  await expect(page.locator(".herr-placa .herr-logo")).toHaveCount(placas);

  const { inicio, largo } = await seccion.evaluate((s) => ({
    inicio: s.offsetTop,
    largo: s.offsetHeight - innerHeight,
  }));
  const activos = () =>
    page.locator('.herr-grupo[data-estado="activo"] .herr-titulo').allTextContents();

  // Al entrar: la primera categoría, y solo esa.
  await page.evaluate((y) => window.scrollTo(0, y), inicio);
  await expect.poll(activos).toEqual(["Lenguajes"]);
  // La sección queda fija mientras se recorre.
  await page.evaluate((y) => window.scrollTo(0, y), inicio + largo * 0.5);
  expect(
    await page.evaluate(() => document.querySelector(".herr-fijo")!.getBoundingClientRect().top),
  ).toBe(0);
  // Al final: la última.
  await page.evaluate((y) => window.scrollTo(0, y), inicio + largo);
  await expect.poll(activos).toEqual(["Control de versiones"]);
  // Y subir vuelve atrás: no hay estado.
  await page.evaluate((y) => window.scrollTo(0, y), inicio);
  await expect.poll(activos).toEqual(["Lenguajes"]);
});

test("el cierre sale de la niebla con el scroll y deja el contacto a mano", async ({
  page,
}) => {
  await page.goto("/");
  const cierre = page.locator("#contacto");
  const { inicio, largo } = await cierre.evaluate((s) => ({
    inicio: s.offsetTop,
    largo: s.offsetHeight - innerHeight,
  }));
  const velo = () =>
    page
      .locator(".cierre-niebla")
      .evaluate((n) => Number(getComputedStyle(n).backgroundColor.match(/[\d.]+(?=\))/)?.[0] ?? 1));
  const pintado = () =>
    page.locator(".cierre-video").evaluate((c: HTMLCanvasElement) => c.width > 0);

  // Al entrar: la niebla lo tapa todo.
  await page.evaluate((y) => window.scrollTo(0, y), inicio);
  await expect.poll(velo).toBeGreaterThan(0.95);
  expect(await cierre.getAttribute("data-texto")).toBeNull();

  // Al final: sin niebla, con el vídeo pintado y el correo a la vista.
  await page.evaluate((y) => window.scrollTo(0, y), inicio + largo);
  await expect(cierre).toHaveAttribute("data-texto", "");
  await expect.poll(velo).toBe(0);
  await expect.poll(pintado).toBe(true);
  await expect(page.getByRole("link", { name: /Escríbeme/ })).toHaveAttribute(
    "href",
    /^mailto:/,
  );
});

test("la cabecera marca el apartado visible y lleva a cada uno", async ({
  page,
}) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Apartados" });
  const actual = () =>
    nav.locator('[aria-current="location"]').textContent();
  await expect.poll(actual).toBe("Inicio");
  await page.evaluate(() =>
    window.scrollTo(0, document.getElementById("herramientas")!.offsetTop + 50),
  );
  await expect.poll(actual).toBe("Herramientas");
  await nav.getByRole("link", { name: "Contacto" }).click();
  await expect.poll(actual).toBe("Contacto");
});

test("los proyectos se encienden al pasar por el centro y abren su ficha", async ({
  page,
}) => {
  await page.goto("/");
  const filas = page.locator(".proy-fila");
  await expect(filas).toHaveCount(4);
  const luz = (i: number) =>
    filas.nth(i).evaluate((f) => Number(f.style.getPropertyValue("--luz")));

  // Con la segunda fila en el centro de la pantalla, es la que brilla.
  await filas.nth(1).evaluate((f) => {
    const c = f.getBoundingClientRect();
    window.scrollBy(0, c.top + c.height / 2 - innerHeight / 2);
  });
  await expect.poll(() => luz(1)).toBeGreaterThan(0.9);
  expect(await luz(0)).toBeLessThan(0.2);

  const abridor = filas.nth(1).getByRole("button");
  await abridor.focus();
  await page.keyboard.press("Enter");
  const ventana = page.locator("dialog.proy-ventana");
  await expect(ventana).toBeVisible();
  await expect(ventana.getByRole("heading", { name: "Oculus Auditor" })).toBeVisible();
  await expect(ventana.locator(".proy-landing img")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(ventana).not.toBeVisible();
  await expect(abridor).toBeFocused();
});

test("la línea de comandos de la portada teclea el nombre al bajar", async ({
  page,
}) => {
  await page.goto("/");
  const nombre = page.locator(".cli-tecleo");
  expect(await nombre.evaluate((e) => e.getBoundingClientRect().width)).toBe(0);
  await page.evaluate(() => {
    const h = document.querySelector(".campana-hero")!;
    window.scrollTo(0, h.getBoundingClientRect().height - innerHeight);
  });
  await expect.poll(() => nombre.evaluate((e) => e.getBoundingClientRect().width)).toBeGreaterThan(200);
  await expect(page.locator(".cli-rol")).toContainText("Ingeniero de Sistemas");
  const tecleo = page.locator(".term-tecleo").first();
  await expect.poll(() => tecleo.evaluate((e) => e.getBoundingClientRect().width)).toBeGreaterThan(20);
});

test("el túnel lleva a las herramientas sin salir de la pantalla", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const seccion = page.locator("#herramientas");
  expect(await page.locator(".tunel-placa").count()).toBeGreaterThan(40);
  const { inicio, alto, tunel } = await seccion.evaluate((s) => ({
    inicio: s.offsetTop,
    alto: innerHeight,
    tunel: (s.querySelector(".herr-sonda") as HTMLElement).offsetTop,
  }));
  const v = (n: string) =>
    seccion.evaluate((s, n) => Number(s.style.getPropertyValue(n)), n);
  // Asomando: el túnel ya avanza y las herramientas aún no están.
  await page.evaluate((y) => window.scrollTo(0, y), inicio - alto * 0.5);
  await expect.poll(() => v("--pt")).toBeGreaterThan(0.05);
  expect(await v("--llegada")).toBe(0);
  // Al acabar el túnel, las herramientas están en la misma pantalla fija.
  await page.evaluate((y) => window.scrollTo(0, y), inicio + tunel);
  await expect.poll(() => v("--llegada")).toBe(1);
  expect(
    await page.evaluate(() => document.querySelector(".herr-fijo")!.getBoundingClientRect().top),
  ).toBe(0);
  await expect(page.locator(".herr-grupo").first()).toHaveAttribute("data-estado", "activo");
});

test("en escritorio el scroll con la rueda se desliza y el túnel reacciona a la velocidad", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/lenis/);
  await expect(page.locator(".retrato")).toHaveAttribute("data-listo", "true");
  await page.waitForTimeout(1500);
  await page.mouse.move(600, 400);
  await page.mouse.wheel(0, 300);
  // Primero un poco, luego el resto: se desliza, no salta.
  await page.waitForTimeout(40);
  const pronto = await page.evaluate(() => scrollY);
  await page.waitForTimeout(900);
  const final = await page.evaluate(() => scrollY);
  expect(pronto).toBeLessThan(final);
  expect(final).toBeGreaterThan(200);
  // Deja terminar la inercia: durante ella, un salto programático se ignora.
  await page.waitForTimeout(1500);

  const { inicio, alto } = await page.evaluate(() => ({
    inicio: document.getElementById("herramientas")!.offsetTop,
    alto: innerHeight,
  }));
  await page.evaluate((y) => window.scrollTo(0, y), inicio - alto * 0.6);
  await page.waitForTimeout(600);
  // Registra en la propia página la velocidad máxima mientras se baja.
  await page.evaluate(() => {
    const s = document.getElementById("herramientas")!;
    (window as unknown as { maxVel: number }).maxVel = 0;
    const mirar = () => {
      const v = Number(s.style.getPropertyValue("--vel")) || 0;
      const w = window as unknown as { maxVel: number };
      w.maxVel = Math.max(w.maxVel, v);
      requestAnimationFrame(mirar);
    };
    mirar();
  });
  for (let k = 0; k < 4; k++) await page.mouse.wheel(0, 400);
  await page.waitForTimeout(800);
  expect(
    await page.evaluate(() => (window as unknown as { maxVel: number }).maxVel),
  ).toBeGreaterThan(0.1);
  const vel = () =>
    page.locator("#herramientas").evaluate((s) => Number(s.style.getPropertyValue("--vel")));
  await expect.poll(vel, { timeout: 4000 }).toBe(0);
});
