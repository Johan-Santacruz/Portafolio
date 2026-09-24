/**
 * Carga de una secuencia de fotogramas que se reproduce con el scroll.
 *
 * En producción cada imagen tarda lo suyo en llegar, y quien baja deprisa
 * pide fotogramas que aún no están. Para que siempre haya algo que enseñar:
 *
 * - el orden es de grueso a fino: primero uno de cada 8 (una muestra de todo
 *   el vídeo), luego los intermedios, hasta completar;
 * - el fotograma pedido, si no está, se adelanta en la cola;
 * - `cercano(i)` devuelve el fotograma cargado más próximo al pedido, para
 *   pintarlo mientras llega el exacto;
 * - cada imagen se descomprime (`decode()`) antes de darla por lista, así el
 *   scroll no se atasca descomprimiendo JPEG al pintar.
 *
 * Si se da una `urlMini`, antes que nada se descarga una versión diminuta de
 * todos los fotogramas (~8 KB cada uno): en un par de segundos hay imagen
 * para cualquier punto del vídeo, borrosa hasta que llega la buena.
 *
 * No descarga nada hasta `empezar()`; `pedir()` antes de eso solo reordena.
 *
 * En un teléfono, o en un equipo con poca memoria, no se guardan todos los
 * fotogramas descomprimidos: las cinco secuencias de la página suman 361
 * imágenes de 1280 × 720 o más, cerca de 1,6 GB en memoria, y un teléfono de
 * gama baja tiene 2 o 3 en total. El navegador acababa tirándolas y
 * volviéndolas a descomprimir al pintar, en pleno scroll: eso eran los
 * tirones. En ese modo (`LIGERO`) solo se guardan los buenos a `RADIO`
 * fotogramas del que se está viendo, se descomprimen como mucho tres a la
 * vez, y `soltar()` lo libera todo cuando la sección se aleja; al volver se
 * piden de nuevo, de la caché del navegador y sin descargarlos otra vez.
 */
const LIGERO =
  typeof window !== "undefined" &&
  (window.matchMedia("(pointer: coarse)").matches ||
    ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) <= 4 ||
    (navigator.hardwareConcurrency ?? 8) <= 4);
/** Buenos que se guardan a cada lado del que se ve (en modo ligero). */
const RADIO = 8;
/** Y cuánto más lejos tiene que quedar uno para soltarlo: sin ese margen,
 *  subir y bajar un poco soltaba y volvía a pedir los mismos. */
const HOLGURA = 4;

export class SecuenciaFotogramas {
  readonly cuadros: (HTMLImageElement | null)[];
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

  constructor(
    private total: number,
    private url: (i: number) => string,
    /** Se llama cada vez que llega un fotograma (bueno o mini). */
    private alCargar: (i: number) => void,
    concurrencia = 8,
    private urlMini?: (i: number) => string,
  ) {
    this.cuadros = Array(total).fill(null);
    this.minis = Array(total).fill(null);
    this.limite = LIGERO ? Math.min(concurrencia, 3) : concurrencia;
    this.cola = LIGERO ? this.ventana() : SecuenciaFotogramas.orden(total);
    this.colaMini = urlMini ? SecuenciaFotogramas.orden(total) : [];
  }

  /** Los buenos que faltan alrededor del centro, del más cercano al más lejano. */
  private ventana() {
    const r: number[] = [];
    for (let d = 0; d <= RADIO; d++) {
      for (const n of d ? [this.centro + d, this.centro - d] : [this.centro]) {
        if (n >= 0 && n < this.total && this.cuadros[n] === null) r.push(n);
      }
    }
    return r;
  }

  /**
   * En modo ligero, suelta todo lo cargado (buenos y minis) para que el
   * navegador recupere la memoria. Se llama cuando la sección se aleja; el
   * siguiente `pedir()` vuelve a cargar lo que haga falta.
   */
  soltar() {
    if (!LIGERO) return;
    this.cuadros.fill(null);
    this.decodificados.clear();
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
    this.seguir();
  }

  detener() {
    this.activa = false;
  }

  listo(i: number) {
    return this.decodificados.has(i);
  }

  /** Adelanta `i` (y sus vecinos) en la cola si aún no se han pedido. */
  pedir(i: number) {
    if (LIGERO) {
      if (this.suelta) {
        this.suelta = false;
        this.colaMini = this.urlMini ? SecuenciaFotogramas.orden(this.total) : [];
      }
      this.centro = i;
      // Los buenos que se han quedado lejos, fuera: así la memoria no crece
      // con lo que se va viendo.
      for (let n = 0; n < this.total; n++) {
        if (this.cuadros[n] !== null && Math.abs(n - i) > RADIO + HOLGURA) {
          this.cuadros[n] = null;
          this.decodificados.delete(n);
        }
      }
      this.cola = this.ventana();
      this.seguir();
      return;
    }
    const urgentes = [i, i - 1, i + 1, i - 2, i + 2].filter(
      (n) => n >= 0 && n < this.total && this.cuadros[n] === null,
    );
    if (!urgentes.length) return;
    this.cola = [...urgentes, ...this.cola.filter((n) => !urgentes.includes(n))];
    this.seguir();
  }

  /**
   * La mejor imagen disponible para `i`: el fotograma bueno; si no, el bueno
   * de un vecino muy próximo; si no, el mini; si no, lo más cercano que haya.
   */
  mejor(i: number): HTMLImageElement | null {
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
      const m = this.colaMini.shift();
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
      if (this.cuadros[i] !== null) continue;
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
