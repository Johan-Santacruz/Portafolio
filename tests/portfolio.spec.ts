import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/** La pantalla de carga tapa y bloquea el scroll hasta que la portada está
 *  lista: los tests que se mueven por la página esperan a que se retire. */
const sinCarga = (page) =>
  page.waitForSelector("#carga", { state: "detached", timeout: 20000 });

/**
 * Deja la pantalla en las habilidades blandas, ya puestas: recorre la sección
 * de herramientas hasta el primer punto en que el corte ha terminado y el
 * grupo del criterio es el activo. Buscarlo desde el final no vale: al volver
 * atrás se pasa de largo y se acaba midiendo la composición de dos columnas,
 * donde las palabras todavía no ocupan el ancho entero.
 */
async function irAlCriterio(page) {
  const caja = await page.locator("#herramientas").evaluate((s: HTMLElement) => ({
    top: s.offsetTop,
    alto: s.offsetHeight,
  }));
  for (let y = caja.top; y < caja.top + caja.alto; y += 30) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(16);
    const puesto = await page.locator("#herramientas").evaluate((s: HTMLElement) => {
      const corte = Number(getComputedStyle(s).getPropertyValue("--corte")) || 0;
      return (
        corte >= 1 &&
        !!s.querySelector('.herr-grupo[data-estado="activo"] .herr-criterio')
      );
    });
    if (puesto) {
      await page.waitForTimeout(150);
      return;
    }
  }
  throw new Error("no se llegó a las habilidades blandas");
}

/** Lo que hay que mirar de la cuadrícula: que cuadre y que quepa. */
async function medirCriterio(page, columnas: number) {
  return page.evaluate((columnas) => {
    const celdas = [...document.querySelectorAll<HTMLElement>(".herr-criterio > li")];
    const cajas = celdas.map((c) => c.getBoundingClientRect());
    const filas = new Map<number, number[]>();
    celdas.forEach((celda, i) => {
      const y = Math.round(cajas[i].top);
      filas.set(y, [
        ...(filas.get(y) ?? []),
        Math.round(celda.querySelector("h4")!.getBoundingClientRect().top),
      ]);
    });
    return {
      columnas: new Set(cajas.map((c) => Math.round(c.left))).size,
      filas: filas.size,
      // Cuántas filas tienen sus palabras a distinta altura.
      torcidas: [...filas.values()].filter((t) => new Set(t).size > 1).length,
      arriba: Math.min(...cajas.map((c) => c.top)),
      abajo: Math.max(...cajas.map((c) => c.bottom)),
      derecha: Math.max(...cajas.map((c) => c.right)),
      ancho: window.innerWidth,
      alto: window.innerHeight,
      esperadas: columnas,
    };
  }, columnas);
}

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
  await sinCarga(page);
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
  await sinCarga(page);
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
  // Con las tipografías cargadas: la página encoge unos px al llegar.
  await page.evaluate(() => document.fonts.ready);
  const seccion = page.locator("#herramientas");
  const grupos = page.locator(".herr-grupo");
  await expect(grupos).toHaveCount(7);
  // Todas las herramientas llevan logo.
  const placas = await page.locator(".herr-placa").count();
  expect(placas).toBeGreaterThan(20);
  await expect(page.locator(".herr-placa .herr-logo")).toHaveCount(placas);
  // La última categoría no son herramientas: el criterio se presenta aparte.
  await expect(page.locator(".herr-criterio > li")).toHaveCount(8);
  await expect(page.locator(".herr-criterio")).toHaveCount(1);

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
  // Al final: la última, que es el criterio. La pantalla cambia de
  // composición: el lector se aparta y las habilidades toman el ancho.
  await page.evaluate((y) => window.scrollTo(0, y), inicio + largo);
  await expect.poll(activos).toEqual(["Cómo trabajo"]);
  await expect(seccion).toHaveAttribute("data-criterio", "");
  // Y es otro capítulo: la cabecera cambia de nombre.
  await expect(page.locator(".herr-cabecera")).toContainText("Habilidades blandas");
  await expect(page.locator(".herr-cabecera h2 .herr-r2")).toBeVisible();
  await expect(page.locator(".herr-cabecera h2 .herr-r1")).toBeHidden();
  // El corte entre lo técnico y el criterio ya ha terminado.
  await expect.poll(() => seccion.evaluate((s) => Number(s.style.getPropertyValue("--corte")))).toBe(1);
  await expect(page.locator(".herr-corte")).toHaveCSS("opacity", "0");
  const anchos = await page.evaluate(() => ({
    bandeja: document.querySelector(".herr-bandeja")!.getBoundingClientRect().width,
    fijo: document.querySelector(".herr-fijo")!.clientWidth,
  }));
  expect(anchos.bandeja).toBeGreaterThan(anchos.fijo * 0.85);
  await expect(page.locator(".herr-criterio > li").first()).toBeVisible();
  // Las ocho van en cuadrícula y llenan la pantalla: en renglones, la palabra
  // quedaba a un borde y la frase al otro, con el centro vacío.
  await irAlCriterio(page);
  await expect(seccion).toHaveAttribute("data-criterio", "");
  const rejilla = await medirCriterio(page, 4);
  expect(rejilla.columnas).toBe(4);
  expect(rejilla.filas).toBe(2);
  expect(rejilla.torcidas).toBe(0);
  expect(rejilla.derecha).toBeLessThanOrEqual(rejilla.ancho);
  expect(rejilla.abajo).toBeLessThanOrEqual(rejilla.alto);
  expect(rejilla.abajo - rejilla.arriba).toBeGreaterThan(
    (rejilla.alto - rejilla.arriba) * 0.8,
  );

  // Y subir vuelve atrás: no hay estado.
  await page.evaluate((y) => window.scrollTo(0, y), inicio);
  await expect.poll(activos).toEqual(["Lenguajes"]);
});

test("el cierre sale de la niebla con el scroll y deja el contacto a mano", async ({
  page,
}) => {
  await page.goto("/");
  // Con las tipografías cargadas: la página encoge unos px al llegar.
  await page.evaluate(() => document.fonts.ready);
  const cierre = page.locator("#contacto");
  const { inicio, largo, alto } = await cierre.evaluate((s) => ({
    inicio: s.offsetTop,
    largo: s.offsetHeight - innerHeight,
    alto: innerHeight,
  }));
  const velo = () =>
    page
      .locator(".cierre-niebla")
      .evaluate((n) => Number(getComputedStyle(n).backgroundColor.match(/[\d.]+(?=\))/)?.[0] ?? 1));
  const pintado = () =>
    page.locator(".cierre-video").evaluate((c: HTMLCanvasElement) => c.width > 0);

  // Al asomar por abajo: la niebla lo tapa todo.
  await page.evaluate((y) => window.scrollTo(0, y), inicio - alto);
  await expect.poll(velo).toBeGreaterThan(0.95);
  expect(await cierre.getAttribute("data-texto")).toBeNull();
  // A media llegada la niebla ya se ha abierto: la figura no se hace esperar.
  await page.evaluate((y) => window.scrollTo(0, y), inicio - alto * 0.5);
  await expect.poll(velo).toBe(0);
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
  // Con las tipografías cargadas: la página encoge unos px al llegar.
  await page.evaluate(() => document.fonts.ready);
  const nav = page.getByRole("navigation", { name: "Apartados" });
  const actual = () =>
    nav.locator('[aria-current="location"]').getAttribute("aria-label");
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
  // Con las tipografías cargadas: la página encoge unos px al llegar.
  await page.evaluate(() => document.fonts.ready);
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
  // Asomando: el túnel ya avanza y las herramientas aún no están; las placas
  // que salen por arriba cruzan el borde de la sección, sobre la portada.
  await page.evaluate((y) => window.scrollTo(0, y), inicio - alto * 0.5);
  await expect.poll(() => v("--pt")).toBeGreaterThan(0.05);
  expect(await v("--llegada")).toBe(0);
  // En algún punto de la entrada hay placas asomando por encima del borde.
  let cruzan = 0;
  for (const f of [0.75, 0.6, 0.45, 0.3, 0.15]) {
    await page.evaluate((y) => window.scrollTo(0, y), inicio - alto * f);
    await page.waitForTimeout(150);
    cruzan += await page.locator(".tunel-placa").evaluateAll((placas) => {
      const borde = document.querySelector("#herramientas")!.getBoundingClientRect().top;
      return placas.filter((p) => {
        const r = p.getBoundingClientRect();
        return Number(getComputedStyle(p).opacity) > 0.3 && r.top < borde - 10 && r.bottom > 0;
      }).length;
    });
  }
  expect(cruzan).toBeGreaterThan(0);
  // Justo antes de acabar, las placas de lenguajes del túnel ya están
  // encima de las casillas donde van las reales (que siguen ocultas).
  await page.evaluate((y) => window.scrollTo(0, y), inicio + tunel - 4);
  await expect(seccion).toHaveAttribute("data-fase", "tunel");
  const desvios = await page.evaluate(() => {
    const centro = (e: Element) => {
      const r = e.getBoundingClientRect();
      return [r.left + r.width / 2, r.top + r.height / 2];
    };
    const reales = [...document.querySelectorAll(".herr-grupo:first-child .herr-placa")];
    return [...document.querySelectorAll(".tunel-aterriza")].map((t, i) => {
      const [ax, ay] = centro(t);
      const [bx, by] = centro(reales[i]);
      return { d: Math.hypot(ax - bx, ay - by), tunel: getComputedStyle(t).opacity, real: getComputedStyle(reales[i]).opacity };
    });
  });
  expect(desvios).toHaveLength(8);
  for (const { d, tunel: ot, real } of desvios) {
    expect(d).toBeLessThan(2);
    expect(ot).toBe("1");
    expect(real).toBe("0");
  }
  // Al acabar el túnel, las herramientas están en la misma pantalla fija y
  // las placas reales relevan a las del túnel en el acto.
  await page.evaluate((y) => window.scrollTo(0, y), inicio + tunel);
  await expect.poll(() => v("--llegada")).toBe(1);
  await expect(seccion).toHaveAttribute("data-fase", "aterrizado");
  await expect(page.locator(".herr-grupo:first-child .herr-placa").first()).toHaveCSS("opacity", "1");
  await expect(page.locator(".tunel-aterriza").first()).toHaveCSS("opacity", "0");
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

test("las secciones se solapan y se funden sin borde", async ({ page }) => {
  // Con movimiento reducido no hay agujero negro y la sección mide menos.
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  // Con las tipografías cargadas: la página encoge unos px al llegar.
  await page.evaluate(() => document.fonts.ready);
  const { herrFin, proyInicio, trayFin, cierreInicio, alto } = await page.evaluate(() => {
    const h = document.querySelector<HTMLElement>("#herramientas")!;
    const t = document.querySelector<HTMLElement>("#trayectoria")!;
    const p = document.querySelector<HTMLElement>("#proyectos")!;
    const c = document.querySelector<HTMLElement>("#contacto")!;
    return {
      herrFin: h.offsetTop + h.offsetHeight,
      proyInicio: p.offsetTop,
      trayFin: t.offsetTop + t.offsetHeight,
      cierreInicio: c.offsetTop,
      alto: innerHeight,
    };
  });
  // Cada sección empieza una pantalla antes de que acabe la anterior.
  expect(Math.abs(herrFin - proyInicio - alto)).toBeLessThan(3);
  expect(Math.abs(trayFin - cierreInicio - alto * 0.65)).toBeLessThan(3);
  const v = (sel: string, n: string) =>
    page.locator(sel).evaluate((s, n) => Number(s.style.getPropertyValue(n)), n);
  // Cuando Proyectos asoma, el agujero negro ya se ha tragado Herramientas
  // y ha dejado la pantalla en ese mismo negro.
  await page.evaluate((y) => window.scrollTo(0, y), proyInicio - alto);
  await expect.poll(() => v("#herramientas", "--traga")).toBeGreaterThan(0.99);
  await expect(page.locator(".herr-agujero")).toHaveCSS("opacity", "1");
  await expect(page.locator(".herr-final-tecleo")).toHaveText("ls ./proyectos");
  await expect.poll(() => v("#proyectos", "--cubre")).toBeLessThan(0.02);
  // A media cubierta, las estelas se van encendiendo con la sección.
  await page.evaluate((y) => window.scrollTo(0, y), proyInicio - alto / 2);
  await expect.poll(() => v("#proyectos", "--cubre")).toBeCloseTo(0.5, 1);
  // Cuando Cierre asoma, Trayectoria ya se ha fundido a blanco.
  await page.evaluate((y) => window.scrollTo(0, y), cierreInicio - alto);
  await expect.poll(() => v("#trayectoria", "--fin")).toBeGreaterThan(0.99);
  await expect
    .poll(() => page.locator(".tray-velo").evaluate((e) => Number(getComputedStyle(e).opacity)))
    .toBeGreaterThan(0.99);
});

test("la trayectoria pasa las credenciales y abre la hoja de vida", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const tray = page.locator("#trayectoria");
  const pases = tray.locator(".tray-pase");
  await expect(pases).toHaveCount(5);
  await expect(pases.locator(".tray-donde")).toHaveText([
    "Familia Insurances",
    "SALA AI Summit",
    "IEEE · AMITIC",
    "Grupo PADIA",
    "Ingeniería de Sistemas",
  ]);
  await expect(tray).toContainText("Massachusetts");
  await expect(tray).toContainText("Inglés");

  const { inicio, porPase, alto } = await tray.evaluate((s) => {
    const sonda = s.querySelector<HTMLElement>(".tray-sonda")!;
    const n = s.querySelectorAll(".tray-pase").length;
    return {
      inicio: (s as HTMLElement).offsetTop,
      porPase: (sonda.offsetTop - innerHeight) / n,
      alto: innerHeight,
    };
  });
  const p = () => tray.evaluate((s) => Number(s.style.getPropertyValue("--p")));
  const activo = () =>
    tray.locator('.tray-pase[data-estado="activa"] .tray-donde').textContent();

  // Al entrar, el primero; la pila no se ha movido.
  await page.evaluate((y) => window.scrollTo(0, y), inicio);
  await expect.poll(p).toBeLessThan(0.1);
  await expect.poll(activo).toBe("Familia Insurances");
  // A mitad, uno del medio.
  await page.evaluate(
    (y) => window.scrollTo(0, y),
    inicio + alto * 0.05 + porPase * 2.5,
  );
  await expect.poll(p).toBeGreaterThan(1.8);
  await expect.poll(activo).toBe("IEEE · AMITIC");
  // Al final, el último, y la ficha muestra su año.
  await page.evaluate(
    (y) => window.scrollTo(0, y),
    inicio + alto * 0.05 + porPase * 4.6,
  );
  await expect.poll(activo).toBe("Ingeniería de Sistemas");
  expect(await p()).toBeCloseTo(4, 1);

  // La hoja de vida se ve sin salir de la página y se puede descargar.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const abridor = page.getByRole("button", { name: /Hoja de vida/ });
  await abridor.click();
  const ventana = page.locator("dialog.hoja-ventana");
  await expect(ventana).toBeVisible();
  await expect(ventana.locator(".hoja-paginas img")).toHaveCount(2);
  await expect(ventana.locator(".hoja-paginas img").first()).toBeVisible();
  await expect(ventana.getByRole("link", { name: /Descargar PDF/ })).toHaveAttribute(
    "href",
    /hoja-de-vida-johan-balanta\.pdf$/,
  );
  await page.keyboard.press("Escape");
  await expect(ventana).not.toBeVisible();
  await expect(abridor).toBeFocused();
});

test("las animaciones largas se reproducen solas al pedir bajar", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await sinCarga(page);
  await page.evaluate(() => document.fonts.ready);
  const seccion = page.locator("#herramientas");
  const v = (n: string) =>
    seccion.evaluate((s, n) => Number(s.style.getPropertyValue(n)), n);
  await page.mouse.move(720, 450);

  // Cuánto mide cada tramo en píxeles de scroll.
  const tramos = await seccion.evaluate((s) => ({
    "--corte": (s.querySelector(".herr-sonda-corte") as HTMLElement).offsetHeight,
    "--traga": (s.querySelector(".herr-sonda-agujero") as HTMLElement).offsetHeight,
  }));

  // Se baja a golpes cortos hasta entrar en el tramo; ahí se sigue rodando un
  // poco más, como hace el trackpad, que manda eventos de rueda casi un
  // segundo después de soltar el dedo. Luego se deja de tocar: la animación
  // tiene que terminar sola. Arrastrándola haría falta el tramo entero, y el
  // tramo mide bastante más que el golpe que la lanzó.
  const comprobar = async (prop: "--corte" | "--traga") => {
    for (let i = 0; i < 500; i++) {
      if ((await v(prop)) > 0.001) break;
      await page.mouse.wheel(0, 60);
      await page.waitForTimeout(35);
    }
    expect(await v(prop), `${prop} no llegó a arrancar`).toBeGreaterThan(0.001);
    expect(tramos[prop]).toBeGreaterThan(200);
    // La inercia. Antes bastaba con esto para tumbar el deslizamiento, y el
    // tramo se quedaba a medias el resto de la pasada.
    for (let i = 0; i < 6; i += 1) {
      await page.mouse.wheel(0, 60);
      await page.waitForTimeout(16);
    }
    // Y sin tocar nada más.
    await page.waitForTimeout(2400);
    expect(await v(prop), `${prop} no terminó solo`).toBeGreaterThan(0.98);
  };

  await comprobar("--corte");
  await comprobar("--traga");
});

test("echarse atrás corta el deslizamiento automático", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await sinCarga(page);
  await page.evaluate(() => document.fonts.ready);
  const seccion = page.locator("#herramientas");
  const traga = () =>
    seccion.evaluate((s: HTMLElement) => Number(s.style.getPropertyValue("--traga")));
  await page.mouse.move(720, 450);

  // Hasta la boca del agujero.
  for (let i = 0; i < 500; i++) {
    if ((await traga()) > 0.001) break;
    await page.mouse.wheel(0, 60);
    await page.waitForTimeout(35);
  }
  expect(await traga()).toBeGreaterThan(0.001);

  // Rueda hacia arriba: manda quien lee, y la página se queda donde está en
  // vez de seguir hasta el final del tramo.
  await page.mouse.wheel(0, -200);
  await page.waitForTimeout(1600);
  expect(await traga(), "el deslizamiento no se dejó cortar").toBeLessThan(0.98);

  // Y no queda el cerrojo puesto: se puede volver a subir.
  const antes = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, -600);
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => window.scrollY)).toBeLessThan(antes);
});

test("el botón de la cabecera pasa la página a inglés y lo recuerda", async ({
  page,
}) => {
  await page.goto("/");
  await sinCarga(page);
  const boton = page.locator(".cabecera-idioma");

  // Nace en español: el botón dice a qué idioma lleva, no en cuál estás.
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(boton).toHaveText("EN");
  await expect(page.locator(".cabecera")).toContainText("Herramientas");
  await expect(page.locator("#titulo-proyectos")).toHaveText("Lo que he construido");
  expect(await page.title()).toContain("Ideas que toman forma");

  await boton.click();

  // Y todo cambia a la vez: la página, la pestaña y el propio botón.
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(boton).toHaveText("ES");
  await expect(page.locator(".cabecera")).toContainText("Tools");
  await expect(page.locator("#titulo-proyectos")).toHaveText("What I've built");
  await expect(page.locator(".cierre-copy")).toContainText("Tell me your idea");
  expect(await page.title()).toContain("Ideas that take shape");
  expect(
    await page
      .locator('meta[name="description"]')
      .getAttribute("content"),
  ).toContain("software engineer");

  // La elección sobrevive a recargar, y ya desde la pantalla de carga.
  await page.reload();
  await expect(page.locator("#carga-texto")).toHaveText("loading");
  await sinCarga(page);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator(".cabecera-idioma")).toHaveText("ES");

  // Y se puede volver.
  await page.locator(".cabecera-idioma").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(page.locator(".cabecera")).toContainText("Herramientas");
});

test("el criterio también cuadra en inglés", async ({ page }) => {
  await page.goto("/");
  await sinCarga(page);
  await page.locator(".cabecera-idioma").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.evaluate(() => document.fonts.ready);

  await irAlCriterio(page);
  await expect(page.locator(".herr-criterio > li")).toHaveCount(8);
  await expect(page.locator(".herr-criterio h4").first()).toHaveText("Resourceful");
  // Las palabras inglesas miden otra cosa: que la fila siga cuadrando.
  const rejilla = await medirCriterio(page, 4);
  expect(rejilla.columnas).toBe(4);
  expect(rejilla.torcidas).toBe(0);
  expect(rejilla.derecha).toBeLessThanOrEqual(rejilla.ancho);
  expect(rejilla.abajo).toBeLessThanOrEqual(rejilla.alto);
});
