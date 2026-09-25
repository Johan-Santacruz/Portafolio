/**
 * Secuencias por scroll: prioriza el cuadro visible, guarda una ventana de
 * cuadros nítidos a su alrededor y usa muestras pequeñas para saltos largos.
 * Mantiene la resolución original sin retener toda la película en memoria.
 * `soltar()` descarta imágenes y bitmaps al alejarse de la sección;
 * `pedir()` los recupera al volver. Las descargas tardías se descartan.
 */
const LIGERO =
  typeof window !== "undefined" &&
  (window.matchMedia("(pointer: coarse)").matches ||
    ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) <= 4 ||
    (navigator.hardwareConcurrency ?? 8) <= 4);
/** Cuadros nítidos a cada lado del visible: menos en equipos limitados. */
const RADIO = LIGERO ? 8 : 16;
/** Y cuánto más lejos tiene que quedar uno para soltarlo: sin ese margen,
 *  subir y bajar un poco soltaba y volvía a pedir los mismos. */
const HOLGURA = 4;

/**
 * Un fotograma listo para pintar. En modo ligero es un `ImageBitmap`: ya
 * descomprimido fuera del hilo principal, así pintarlo no cuesta volver a
 * descomprimirlo (en un teléfono de gama media eran varios milisegundos por
 * fotograma en plena portada). Los dos tienen `width` y `height`.
 */
export type Fotograma = HTMLImageElement | ImageBitmap;

export class SecuenciaFotogramas {
  readonly cuadros: (Fotograma | null)[];
  private cola: number[];
  private cargando = 0;
  private activa = false;
  private decodificados = new Set<number>();
  private minis: (HTMLImageElement | null)[];
  private minisListos = new Set<number>();
  /** Cola de minis (van antes que la de fotogramas buenos). */
  private colaMini: number[];
  /** El último fotograma pedido: el centro de la ventana en modo ligero. */
  private centro = 0;
  /** Cuántos se descargan y descomprimen a la vez. */
  private limite: number;
  /** Soltada por `soltar()`: lo siguiente que se pida la vuelve a cargar. */
  private suelta = false;
  /** En modo ligero, los que están llegando (una marca por fotograma): si se
   *  sueltan antes de llegar, al llegar se descartan. */
  private enCamino: (object | null)[];

  constructor(
    private total: number,
    private url: (i: number) => string,
    /** Se llama cada vez que llega un fotograma (bueno o mini). */
    private alCargar: (i: number) => void,
    concurrencia = 8,
    private urlMini?: (i: number) => string,
    /** Buenos que se guardan a cada lado del visible (RADIO por defecto). Una
     *  secuencia corta y ligera puede guardarse entera: así se precarga toda
     *  antes de llegar y nunca se pide nada en pleno scroll. */
    private radio = RADIO,
  ) {
    this.cuadros = Array(total).fill(null);
    this.minis = Array(total).fill(null);
    this.limite = Math.min(concurrencia, LIGERO ? 3 : 4);
    this.enCamino = Array(total).fill(null);
    this.cola = this.ventana();
    this.colaMini = this.muestras();
  }

  // Una muestra cada ocho fotogramas basta como respaldo para saltos largos.
  // Descargar todos los minis retrasaba el cuadro nítido que se está mirando.
  private muestras() {
    return this.urlMini
      ? SecuenciaFotogramas.orden(this.total).filter(i => i % 8 === 0 || i === this.total - 1)
      : [];
  }

  /** Los buenos que faltan alrededor del centro, del más cercano al más lejano. */
  private ventana() {
    const r: number[] = [];
    for (let d = 0; d <= this.radio; d++) {
      for (const n of d ? [this.centro + d, this.centro - d] : [this.centro]) {
        if (n >= 0 && n < this.total && this.cuadros[n] === null && !this.enCamino[n])
          r.push(n);
      }
    }
    return r;
  }

  /** Libera los cuadros al salir de la sección, también en escritorio. */
  soltar() {
    for (let n = 0; n < this.total; n++) this.quitar(n);
    this.minis.fill(null);
    this.minisListos.clear();
    // Nada en cola: lo que esté llegando termina y se descarta, y no se
    // pide nada más mientras la sección esté lejos.
    this.colaMini = [];
    this.cola = [];
    this.suelta = true;
  }

  /** 0, 8, 16… luego 4, 12, 20… luego 2, 6, 10… y por último los impares. */
  static orden(total: number) {
    const visto = new Set<number>();
    const orden: number[] = [];
    for (let paso = 8; paso >= 1; paso /= 2) {
      for (let i = 0; i < total; i += paso) {
        if (!visto.has(i)) {
          visto.add(i);
          orden.push(i);
        }
      }
    }
    // El último, pronto: es donde se queda la secuencia al terminar.
    const ultimo = orden.indexOf(total - 1);
    if (ultimo > 0) orden.splice(1, 0, ...orden.splice(ultimo, 1));
    return orden;
  }

  empezar() {
    this.activa = true;
    // Si se soltó antes de empezar (la sección estaba lejos al abrir la
    // página), la cola está vacía: se rehace desde el último pedido. Si no,
    // no se cargaba nada hasta que cambiara el fotograma pedido, y una
    // secuencia que había que tener lista de antemano llegaba sin cargar.
    if (this.suelta) this.pedir(this.centro);
    else this.seguir();
  }

  detener() {
    this.activa = false;
    this.soltar();
  }

  listo(i: number) {
    return this.decodificados.has(i);
  }

  /** Adelanta `i` (y sus vecinos) en la cola si aún no se han pedido. */
  pedir(i: number) {
    if (this.suelta) {
      this.suelta = false;
      this.colaMini = this.muestras();
    }
    this.centro = i;
    // Los buenos que se han quedado lejos, fuera: así la memoria no crece
    // con lo que se va viendo.
    for (let n = 0; n < this.total; n++) {
      if ((this.cuadros[n] !== null || this.enCamino[n]) && Math.abs(n - i) > this.radio + HOLGURA)
        this.quitar(n);
    }
    this.cola = this.ventana();
    this.seguir();
  }

  /**
   * La mejor imagen disponible para `i`: el fotograma bueno; si no, el bueno
   * de un vecino muy próximo; si no, el mini; si no, lo más cercano que haya.
   */
  /** Suelta el fotograma `n`; si es un `ImageBitmap`, su memoria al momento. */
  private quitar(n: number) {
    const cuadro = this.cuadros[n];
    if (cuadro && "close" in cuadro) cuadro.close();
    this.cuadros[n] = null;
    this.enCamino[n] = null;
    this.decodificados.delete(n);
  }

  mejor(i: number): Fotograma | null {
    // Al volver a necesitarla tras soltarla, se recarga sola.
    if (this.suelta) this.pedir(i);
    if (this.listo(i)) return this.cuadros[i];
    for (let d = 1; d <= 2; d++) {
      if (this.listo(i - d)) return this.cuadros[i - d];
      if (this.listo(i + d)) return this.cuadros[i + d];
    }
    if (this.minisListos.has(i)) return this.minis[i];
    let mejorMini = -1;
    for (let d = 1; d < this.total && mejorMini < 0; d++) {
      if (this.minisListos.has(i - d)) mejorMini = i - d;
      else if (this.minisListos.has(i + d)) mejorMini = i + d;
    }
    const bueno = this.cercano(i);
    if (bueno < 0) return mejorMini >= 0 ? this.minis[mejorMini] : null;
    if (mejorMini < 0) return this.cuadros[bueno];
    return Math.abs(mejorMini - i) < Math.abs(bueno - i)
      ? this.minis[mejorMini]
      : this.cuadros[bueno];
  }

  /** El fotograma cargado más próximo a `i`, o -1 si no hay ninguno. */
  cercano(i: number) {
    for (let d = 0; d < this.total; d++) {
      if (i - d >= 0 && this.listo(i - d)) return i - d;
      if (i + d < this.total && this.listo(i + d)) return i + d;
    }
    return -1;
  }

  private seguir() {
    while (this.activa && this.cargando < this.limite) {
      // El cuadro exacto siempre tiene prioridad, incluso sobre los minis.
      const urgente = this.cola[0] === this.centro;
      const m = urgente ? undefined : this.colaMini.shift();
      if (m !== undefined && this.urlMini) {
        const img = new Image();
        img.decoding = "async";
        this.minis[m] = img;
        this.cargando++;
        img.src = this.urlMini(m);
        img
          .decode()
          .then(() => {
            // Soltada mientras llegaba: no cuenta.
            if (this.minis[m] !== img) return;
            this.minisListos.add(m);
            if (this.activa) this.alCargar(m);
          })
          .catch(() => {})
          .finally(() => {
            this.cargando--;
            this.seguir();
          });
        continue;
      }
      const i = this.cola.shift();
      if (i === undefined) return;
      if (this.cuadros[i] !== null || this.enCamino[i]) continue;
      if (typeof createImageBitmap === "function") {
        // Del archivo a un ImageBitmap, sin pasar por <img>: Chrome lo
        // descomprime en otro hilo, y pintarlo después no cuesta nada. Con
        // un <img> de por medio lo volvía a descomprimir en el principal.
        // El archivo sale de la caché del navegador si ya se había bajado.
        const marca = {};
        this.enCamino[i] = marca;
        this.cargando++;
        fetch(this.url(i))
          .then((r) => (r.ok ? r.blob() : Promise.reject(r.status)))
          .then((b) => createImageBitmap(b))
          .then((mapa) => {
            if (this.enCamino[i] !== marca) {
              mapa.close();
              return;
            }
            this.enCamino[i] = null;
            this.cuadros[i] = mapa;
            this.decodificados.add(i);
            if (this.activa) this.alCargar(i);
          })
          .catch(() => {
            if (this.enCamino[i] === marca) this.enCamino[i] = null;
          })
          .finally(() => {
            this.cargando--;
            this.seguir();
          });
        continue;
      }
      const img = new Image();
      img.decoding = "async";
      this.cuadros[i] = img;
      this.cargando++;
      img.src = this.url(i);
      img
        .decode()
        .then(() => {
          // Soltado mientras llegaba (quedó lejos o la sección se fue).
          if (this.cuadros[i] !== img) return;
          this.decodificados.add(i);
          if (this.activa) this.alCargar(i);
        })
        .catch(() => {
          // Fotograma que no llegó: se queda fuera; el vecino lo sustituye.
        })
        .finally(() => {
          this.cargando--;
          this.seguir();
        });
    }
  }
}
