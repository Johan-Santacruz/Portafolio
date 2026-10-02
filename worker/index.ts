/**
 * Lo único que hace este Worker es mandar a HTTPS a quien llegue por HTTP.
 * Lo demás lo sirve tal cual el servicio de archivos estáticos (`ASSETS`),
 * con las cabeceras de `public/_headers`.
 *
 * En un navegador no haría falta: los dominios .dev vienen con HTTPS
 * obligatorio de serie (lista HSTS precargada). Pero los robots y las
 * herramientas de auditoría no la usan y se quedaban en la versión HTTP.
 * workers.dev no tiene el ajuste «Always Use HTTPS» de un dominio propio.
 *
 * Solo pasan por aquí las páginas (ver `run_worker_first` en wrangler.jsonc):
 * imágenes, vídeo y /assets/ van directos y no gastan invocaciones.
 */
interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

// En desarrollo (Vite, wrangler dev) todo va por HTTP en la propia máquina.
const LOCALES = new Set(["localhost", "127.0.0.1", "[::1]"]);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.protocol === "http:" && !LOCALES.has(url.hostname)) {
      url.protocol = "https:";
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
