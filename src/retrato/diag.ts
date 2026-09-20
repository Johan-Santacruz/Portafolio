/**
 * Diagnóstico de fluidez, para cuando «a veces se traba» y hay que saber
 * dónde: se activa con `?diag=1` en la dirección y pinta abajo a la
 * izquierda los fotogramas por segundo, el fotograma más largo del último
 * medio segundo y cuántos tirones (fotogramas de más de 50 ms) ha habido en
 * cada sección desde que se cargó la página. No se carga nada de esto sin
 * el parámetro.
 */
export function activarDiagnostico() {
  if (!/[?&]diag=1/.test(location.search)) return;
  const caja = document.createElement("pre");
  caja.setAttribute("aria-hidden", "true");
  caja.style.cssText =
    "position:fixed;left:8px;bottom:8px;z-index:9999;margin:0;padding:8px 10px;" +
    "font:11px/1.5 ui-monospace,Menlo,monospace;color:#eef0f2;background:rgba(15,17,19,.88);" +
    "white-space:pre;pointer-events:none;border-left:3px solid #c7ff4a";
  document.body.append(caja);

  const nombre = (s: Element) =>
    s.classList.contains("campana-hero") ? "portada" : s.id || s.className.split(" ")[0];
  const secciones = () =>
    Array.from(document.querySelectorAll<HTMLElement>("section, .campana-hero")).map((s) => ({
      n: nombre(s),
      top: s.offsetTop,
    }));
  const seccionActual = () => {
    const y = scrollY + innerHeight / 2;
    let actual = "?";
    for (const s of secciones()) if (y >= s.top) actual = s.n;
    return actual;
  };

  const tirones: Record<string, { n: number; max: number }> = {};
  const nav = navigator as Navigator & { deviceMemory?: number };
  const fijo = [
    `${Math.round(innerWidth)}×${Math.round(innerHeight)} · dpr ${devicePixelRatio}`,
    `${navigator.hardwareConcurrency ?? "?"} núcleos${nav.deviceMemory ? ` · ${nav.deviceMemory} GB` : ""}`,
    `suave: ${document.documentElement.classList.contains("lenis") ? "sí" : "no"}`,
    navigator.userAgent.replace(/^Mozilla\/5\.0 /, "").slice(0, 70),
  ].join("\n");

  let t0 = performance.now();
  let desde = t0;
  let cuenta = 0;
  let peor = 0;
  const tick = (t: number) => {
    const dt = t - t0;
    t0 = t;
    cuenta++;
    if (dt > peor) peor = dt;
    if (dt > 50) {
      const s = seccionActual();
      const r = (tirones[s] ??= { n: 0, max: 0 });
      r.n++;
      r.max = Math.max(r.max, dt);
    }
    if (t - desde >= 500) {
      const fps = Math.round((cuenta * 1000) / (t - desde));
      const lista = Object.entries(tirones)
        .map(([s, r]) => `${s} ${r.n} (máx ${Math.round(r.max)} ms)`)
        .join(", ");
      caja.textContent =
        `${fps} fps · peor ${Math.round(peor)} ms · en ${seccionActual()}\n` +
        `tirones: ${lista || "ninguno"}\n${fijo}`;
      desde = t;
      cuenta = 0;
      peor = 0;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
