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
 * No descarga nada hasta `empezar()`; `pedir()` antes de eso solo reordena.
 */
export class SecuenciaFotogramas {
  readonly cuadros: (HTMLImageElement | null)[];
  private cola: number[];
  private cargando = 0;
  private activa = false;
  private decodificados = new Set<number>();

  constructor(
    private total: number,
    private url: (i: number) => string,
    /** Se llama cada vez que llega un fotograma. */
    private alCargar: (i: number) => void,
    private concurrencia = 8,
  ) {
    this.cuadros = Array(total).fill(null);
    this.cola = SecuenciaFotogramas.orden(total);
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
    const urgentes = [i, i - 1, i + 1, i - 2, i + 2].filter(
      (n) => n >= 0 && n < this.total && this.cuadros[n] === null,
    );
    if (!urgentes.length) return;
    this.cola = [...urgentes, ...this.cola.filter((n) => !urgentes.includes(n))];
    this.seguir();
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
    while (this.activa && this.cargando < this.concurrencia) {
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
