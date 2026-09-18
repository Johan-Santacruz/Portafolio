/**
 * Motor del retrato interactivo. Dibuja en un canvas la "segunda identidad"
 * recortada por una máscara orgánica que persigue al puntero.
 *
 * Todo el movimiento son muelles: la posición va con inercia, el radio entra
 * con un rebote corto y sale sin él. Una sola variable, `energia` (velocidad
 * del puntero suavizada: sube rápido, baja despacio), gobierna cuánto se
 * deforma y estira la máscara, las partículas, la estela y los cortes.
 *
 * El bucle solo corre mientras hay algo que mover; parado, el canvas queda
 * limpio y no cuesta nada.
 */

export interface OpcionesMotor {
  /** prefers-reduced-motion: sin partículas, sin ruido, seguimiento directo. */
  reducido: boolean;
  acento: string;
  papel: string;
  /** Punto de la imagen que se conserva al recortar (como `object-position`), de 0 a 1. */
  foco: { x: number; y: number };
}

interface Particula {
  x: number;
  y: number;
  vx: number;
  vy: number;
  vida: number;
  total: number;
  tam: number;
  glifo: string | null;
}
interface Huella {
  x: number;
  y: number;
  r: number;
  vida: number;
}
interface Corte {
  y: number;
  alto: number;
  dx: number;
}

const GLIFOS = ["0", "1", "<", ">", "/", "{", "}", ";", "=", "#", "λ"];
const PUNTOS_BLOB = 72;

const limitar = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export class MotorRetrato {
  private ctx: CanvasRenderingContext2D;
  private ancho = 0;
  private alto = 0;
  private dpr = 1;
  private radioBase = 200;

  private objetivo = { x: 0, y: 0 };
  private puntero = { x: 0, y: 0 };
  private pos = { x: 0, y: 0 };
  private vel = { x: 0, y: 0 };
  private radio = 0;
  private radioVel = 0;
  private activo = false;
  private punteroFino = true;

  private energia = 0;
  private velocidadInst = 0;
  private ultimoPunto = { x: 0, y: 0, t: 0 };

  private particulas: Particula[] = [];
  private acumulador = 0;
  private estela: Huella[] = [];
  private cortes: Corte[] = [];
  private cortesDesde = 0;

  private patron: CanvasPattern | null = null;
  private conFiltro: boolean;
  /** Revelado global (0 a 1) gobernado por el scroll: a 1, todo el alter ego. */
  private base = 0;
  private punteroConocido = false;
  private mascara: HTMLCanvasElement;
  private ctxMascara: CanvasRenderingContext2D;
  private guion: ((desde: number) => { x: number; y: number } | null) | null =
    null;
  private guionDesde = 0;
  private alFinGuion: (() => void) | null = null;

  private raf = 0;
  private ultimoFrame = 0;
  private t = 0;
  private alCambiar: ((activo: boolean) => void) | null = null;

  constructor(
    private lienzo: HTMLCanvasElement,
    private imagen: HTMLImageElement,
    private opciones: OpcionesMotor,
  ) {
    const ctx = lienzo.getContext("2d", { alpha: true });
    if (!ctx) throw new Error("Canvas 2D no disponible");
    this.ctx = ctx;
    this.conFiltro = "filter" in ctx;
    this.mascara = document.createElement("canvas");
    const ctxMascara = this.mascara.getContext("2d");
    if (!ctxMascara) throw new Error("Canvas 2D no disponible");
    this.ctxMascara = ctxMascara;
    this.redimensionar();
  }

  /** Avisa cuando la máscara empieza o termina de estar activa. */
  observar(fn: (activo: boolean) => void) {
    this.alCambiar = fn;
  }

  redimensionar() {
    const caja = this.lienzo.getBoundingClientRect();
    this.ancho = caja.width;
    this.alto = caja.height;
    // Sin pasar de la resolución de la imagen oculta: el lienzo ocupa la
    // pantalla entera y se repinta en cada scroll del revelado; píxeles de
    // más solo encarecen subirlo a la GPU.
    const caja0 = this.lienzo.getBoundingClientRect();
    const tope = Math.max(1, (this.imagen.naturalWidth || 1) / (caja0.width || 1));
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.5, tope);
    this.lienzo.width = Math.round(this.ancho * this.dpr);
    this.lienzo.height = Math.round(this.alto * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.mascara.width = this.lienzo.width;
    this.mascara.height = this.lienzo.height;
    this.ctxMascara.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (!this.punteroConocido) {
      this.puntero = { x: this.ancho / 2, y: this.alto * 0.42 };
    }
    // Entre 160 y 260 px según el lado corto del retrato.
    this.radioBase = limitar(Math.min(this.ancho, this.alto) * 0.34, 160, 260);
    this.patron = this.crearScanlines();
    if (this.radio > 0.5 || this.base > 0) this.dibujar();
  }

  /**
   * Revelado por scroll: `valor` de 0 (solo la máscara del puntero) a 1
   * (todo el alter ego a la vista). Crece como un círculo suave desde la
   * última posición del puntero.
   */
  /**
   * Deja la máscara en variables CSS del contenedor (--mx, --my, --mr) para
   * que otras capas HTML (los datos del HUD) se recorten con la misma forma.
   */
  private publicar() {
    const estilo = this.lienzo.parentElement?.style;
    if (!estilo) return;
    estilo.setProperty("--mx", `${this.pos.x.toFixed(1)}px`);
    estilo.setProperty("--my", `${this.pos.y.toFixed(1)}px`);
    estilo.setProperty("--mr", `${Math.max(0, this.radio).toFixed(1)}px`);
  }

  avanzar(valor: number) {
    const nuevo = limitar(valor, 0, 1);
    if (nuevo === this.base) return;
    this.base = nuevo;
    if (!this.raf) this.dibujar();
  }

  entrar(x: number, y: number, fino = true) {
    this.guion = null;
    this.punteroFino = fino;
    this.punteroConocido = true;
    this.objetivo = { x, y };
    this.puntero = { x, y };
    if (this.radio < 1) {
      this.pos = { x, y };
      this.vel = { x: 0, y: 0 };
    }
    this.ultimoPunto = { x, y, t: performance.now() };
    this.velocidadInst = 0;
    this.activar();
  }

  mover(x: number, y: number) {
    if (this.guion) return;
    const ahora = performance.now();
    const dt = Math.max(1, ahora - this.ultimoPunto.t);
    const d = Math.hypot(x - this.ultimoPunto.x, y - this.ultimoPunto.y);
    this.velocidadInst = (d / dt) * 1000;
    this.ultimoPunto = { x, y, t: ahora };
    this.objetivo = { x, y };
    this.puntero = { x, y };
  }

  salir() {
    this.guion = null;
    this.desactivar();
  }

  /**
   * Una pasada automática por la cara, de izquierda a derecha, para enseñar
   * que el retrato responde. Dura 1,5 s y se cancela con el primer gesto.
   */
  insinuar(alTerminar?: () => void) {
    if (this.opciones.reducido) {
      alTerminar?.();
      return;
    }
    const DURACION = 1500;
    const suave = (p: number) => 0.5 - Math.cos(p * Math.PI) / 2;
    this.correrGuion((desde) => {
      if (desde > DURACION) return null;
      const p = suave(desde / DURACION);
      return {
        x: this.ancho * (0.24 + 0.52 * p),
        y: this.alto * (0.42 - Math.sin(p * Math.PI) * 0.07),
      };
    }, alTerminar);
  }

  /** Con el foco del teclado la máscara orbita sola sobre la cara. */
  orbitar() {
    const cx = this.ancho / 2;
    const cy = this.alto * 0.4;
    if (this.opciones.reducido) {
      this.correrGuion(() => ({ x: cx, y: cy }));
      return;
    }
    this.correrGuion((desde) => ({
      x: cx + Math.cos(desde / 1400) * this.ancho * 0.16,
      y: cy + Math.sin(desde / 1400) * this.alto * 0.1,
    }));
  }

  destruir() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.alCambiar = null;
  }

  private correrGuion(
    guion: (desde: number) => { x: number; y: number } | null,
    alTerminar?: () => void,
  ) {
    this.guionDesde = performance.now();
    this.alFinGuion = alTerminar ?? null;
    const inicio = guion(0);
    if (!inicio) return;
    this.punteroFino = false;
    this.objetivo = { ...inicio };
    if (this.radio < 1) {
      this.pos = { ...inicio };
      this.vel = { x: 0, y: 0 };
    }
    this.guion = guion;
    this.activar();
  }

  private activar() {
    if (!this.activo) {
      this.activo = true;
      this.alCambiar?.(true);
    }
    this.arrancar();
  }
  private desactivar() {
    if (this.activo) {
      this.activo = false;
      this.alCambiar?.(false);
    }
    this.arrancar();
  }

  private arrancar() {
    if (this.raf) return;
    this.ultimoFrame = performance.now();
    this.raf = requestAnimationFrame(this.paso);
  }

  private paso = (ahora: number) => {
    const dt = limitar((ahora - this.ultimoFrame) / 1000, 0.001, 0.05);
    this.ultimoFrame = ahora;
    this.t += dt;

    if (this.guion) {
      const punto = this.guion(ahora - this.guionDesde);
      if (punto) {
        this.velocidadInst =
          Math.hypot(punto.x - this.objetivo.x, punto.y - this.objetivo.y) / dt;
        this.objetivo = punto;
      } else {
        const fin = this.alFinGuion;
        this.guion = null;
        this.alFinGuion = null;
        this.desactivar();
        fin?.();
      }
    }
    this.simular(dt, ahora);
    this.dibujar();
    this.publicar();

    const vivo =
      this.activo || this.radio > 0.5 || this.particulas.length > 0;
    if (vivo) this.raf = requestAnimationFrame(this.paso);
    else {
      this.raf = 0;
      if (this.base <= 0) this.ctx.clearRect(0, 0, this.ancho, this.alto);
      else this.dibujar();
    }
  };

  private simular(dt: number, ahora: number) {
    const { reducido } = this.opciones;

    // Energía: qué tan rápido va el puntero. Si lleva 80 ms quieto, es cero.
    if (ahora - this.ultimoPunto.t > 80 && !this.guion) this.velocidadInst = 0;
    const objetivoEnergia = reducido
      ? 0
      : limitar(this.velocidadInst / 1500, 0, 1);
    const tasa = objetivoEnergia > this.energia ? 16 : 4.5;
    this.energia += (objetivoEnergia - this.energia) * (1 - Math.exp(-dt * tasa));

    // Posición: muelle ligeramente subamortiguado, para que vaya un poco detrás.
    const k = reducido ? 700 : 170;
    const c = reducido ? 54 : 23;
    this.vel.x += ((this.objetivo.x - this.pos.x) * k - this.vel.x * c) * dt;
    this.vel.y += ((this.objetivo.y - this.pos.y) * k - this.vel.y * c) * dt;
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;

    // Radio: entra con un rebote corto; sale sin rebote en ~450 ms.
    const escalaGuion = this.guion ? 0.78 : 1;
    const radioObjetivo = this.activo ? this.radioBase * escalaGuion : 0;
    const entrando = radioObjetivo > this.radio;
    const kr = reducido ? 160 : entrando ? 120 : 110;
    const cr = reducido ? 26 : entrando ? 15 : 21;
    this.radioVel += ((radioObjetivo - this.radio) * kr - this.radioVel * cr) * dt;
    this.radio += this.radioVel * dt;
    if (!this.activo && this.radio < 0.5) {
      this.radio = 0;
      this.radioVel = 0;
    }

    if (reducido) return;

    // Estela: solo cuando hay velocidad; se apaga en ~350 ms.
    if (this.energia > 0.18 && this.radio > 10) {
      this.estela.push({
        x: this.pos.x,
        y: this.pos.y,
        r: this.radio * 0.5,
        vida: 1,
      });
      if (this.estela.length > 22) this.estela.shift();
    }
    for (const h of this.estela) h.vida -= dt * 2.9;
    this.estela = this.estela.filter((h) => h.vida > 0);

    // Partículas: polvo digital constante y una ráfaga proporcional a la energía.
    if (this.activo && this.radio > 10) {
      this.acumulador += dt * (5 + this.energia * 150);
      while (this.acumulador >= 1 && this.particulas.length < 120) {
        this.acumulador -= 1;
        this.emitir();
      }
    }
    for (const p of this.particulas) {
      p.vida -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
    }
    this.particulas = this.particulas.filter((p) => p.vida > 0);

    // Cortes: se renuevan cada 70 ms, solo con velocidad.
    if (this.energia > 0.22) {
      if (ahora - this.cortesDesde > 70) {
        this.cortesDesde = ahora;
        const n = 1 + Math.floor(this.energia * 3);
        this.cortes = Array.from({ length: n }, () => ({
          y: (Math.random() - 0.5) * 1.8,
          alto: 2 + Math.random() * 9,
          dx: (Math.random() - 0.5) * 2 * (5 + this.energia * 24),
        }));
      }
    } else this.cortes = [];
  }

  private emitir() {
    const ang = Math.random() * Math.PI * 2;
    const dx = Math.cos(ang);
    const dy = Math.sin(ang);
    const r = this.radio * (0.95 + Math.random() * 0.15);
    const impulso = (18 + this.energia * 150) * (0.5 + Math.random());
    const total = 0.45 + Math.random() * 0.65;
    this.particulas.push({
      x: this.pos.x + dx * r,
      y: this.pos.y + dy * r,
      vx: dx * impulso - this.vel.x * 0.12,
      vy: dy * impulso - this.vel.y * 0.12 - 8,
      vida: total,
      total,
      tam: 1 + Math.random() * 1.6,
      glifo:
        Math.random() < 0.22
          ? GLIFOS[Math.floor(Math.random() * GLIFOS.length)]
          : null,
    });
  }

  /** Traza la forma orgánica centrada en el origen, estirada según la velocidad. */
  private trazarBlob(r: number, amplitud: number, estirar: number, ang: number) {
    this.trazarBlobEn(this.ctx, r, amplitud, estirar, ang);
  }
  private trazarBlobEn(
    ctx: CanvasRenderingContext2D,
    r: number,
    amplitud: number,
    estirar: number,
    ang: number,
  ) {
    ctx.rotate(ang);
    ctx.scale(1 + estirar, 1 - estirar * 0.3);
    ctx.beginPath();
    const t = this.t;
    for (let i = 0; i <= PUNTOS_BLOB; i++) {
      const a = (i / PUNTOS_BLOB) * Math.PI * 2;
      const ruido =
        Math.sin(3 * a + t * 1.1) * 0.5 +
        Math.sin(5 * a - t * 1.7 + 1.3) * 0.3 +
        Math.sin(8 * a + t * 2.3 + 2.1) * 0.2;
      const rr = r * (1 + amplitud * ruido);
      const x = Math.cos(a) * rr;
      const y = Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  private dibujar() {
    const { ctx, ancho, alto, opciones } = this;
    const { reducido, acento, papel } = opciones;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, ancho, alto);
    const base = this.base;
    if (base >= 0.999) {
      // Todo revelado: la imagen entera y nada más que dibujar.
      this.pintarImagen(0, 0);
      return;
    }
    if (this.radio < 0.5 && this.particulas.length === 0 && base <= 0) return;

    const r = this.radio;
    const e = this.energia;
    const amplitud = reducido ? 0 : 0.05 + e * 0.1;
    const estirar = reducido ? 0 : e * 0.32;
    const ang = Math.atan2(this.vel.y, this.vel.x);
    const suavidad = reducido ? 6 : 10 + e * 12;
    const alcance = r * (1.2 + estirar) + 40;
    const cx = this.pos.x;
    const cy = this.pos.y;
    const caja = {
      x: Math.floor(cx - alcance),
      y: Math.floor(cy - alcance),
      w: Math.ceil(alcance * 2),
      h: Math.ceil(alcance * 2),
    };

    // Estela, debajo de todo.
    if (this.estela.length) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const h of this.estela) {
        ctx.globalAlpha = h.vida * 0.05 * e;
        ctx.fillStyle = acento;
        ctx.beginPath();
        ctx.arc(h.x, h.y, h.r * (0.6 + h.vida * 0.4), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    if (r >= 0.5 || base > 0) {
      // 1. La imagen oculta: solo la caja de la máscara, o entera si el
      //    revelado por scroll ya ha empezado.
      ctx.save();
      if (base <= 0) {
        ctx.beginPath();
        ctx.rect(caja.x, caja.y, caja.w, caja.h);
        ctx.clip();
      }
      this.pintarImagen(0, 0);
      ctx.restore();

      // 2. La máscara se compone aparte (círculo del scroll + forma del
      //    puntero, ambos desenfocados) y se aplica de una vez.
      const m = this.ctxMascara;
      m.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      m.clearRect(0, 0, ancho, alto);
      m.fillStyle = "#fff";
      if (base > 0) {
        const alcanceMax = Math.hypot(ancho, alto) * 0.62;
        const rb = base * alcanceMax;
        const { x, y } = this.puntero;
        // Borde suave con un degradado radial: el mismo aspecto que un
        // desenfoque, a una fracción del coste (esto se pinta en cada scroll).
        const borde = 8 + rb * 0.12;
        const g = m.createRadialGradient(x, y, Math.max(0, rb - borde), x, y, rb + borde);
        g.addColorStop(0, "rgba(255,255,255,1)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        m.fillStyle = g;
        m.beginPath();
        m.arc(x, y, rb + borde, 0, Math.PI * 2);
        m.fill();
        m.fillStyle = "#fff";
      }
      if (r >= 0.5) {
        m.save();
        m.translate(cx, cy);
        if (this.conFiltro) {
          m.filter = `blur(${suavidad}px)`;
          this.trazarBlobEn(m, r, amplitud, estirar, ang);
        } else {
          // Sin ctx.filter (Safari viejo): borde con degradado radial.
          this.trazarBlobEn(m, r * 1.08, amplitud, estirar, ang);
          const g = m.createRadialGradient(0, 0, r * 0.7, 0, 0, r * 1.08);
          g.addColorStop(0, "rgba(255,255,255,1)");
          g.addColorStop(1, "rgba(255,255,255,0)");
          m.fillStyle = g;
        }
        m.fill();
        m.restore();
      }
      ctx.save();
      ctx.globalCompositeOperation = "destination-in";
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(this.mascara, 0, 0);
      ctx.restore();

      // 3. Scanlines solo sobre lo revelado; se van yendo con el scroll.
      if (this.patron && base < 1) {
        ctx.save();
        ctx.globalCompositeOperation = "source-atop";
        ctx.globalAlpha = 0.1 * (1 - base);
        ctx.fillStyle = this.patron;
        if (base > 0) ctx.fillRect(0, 0, ancho, alto);
        else ctx.fillRect(caja.x, caja.y, caja.w, caja.h);
        ctx.restore();
      }

      // Con el alter ego ya casi entero a la vista, el borde y sus efectos
      // pierden sentido: se atenúan con el revelado global.
      const atenuar = 1 - base;

      // 4. Cortes: franjas de la imagen desplazadas que se salen del borde,
      //    como si la realidad fallara alrededor del cursor.
      if (this.cortes.length && atenuar > 0.05) {
        ctx.save();
        ctx.translate(cx, cy);
        this.trazarBlob(r * 1.16, amplitud, estirar, ang);
        ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        ctx.clip();
        ctx.globalAlpha = 0.85 * atenuar;
        for (const corte of this.cortes) {
          const y = cy + corte.y * r;
          ctx.save();
          ctx.beginPath();
          ctx.rect(caja.x, y, caja.w, corte.alto);
          ctx.clip();
          this.pintarImagen(corte.dx, 0);
          ctx.restore();
        }
        ctx.restore();
      }

      // 5. Borde: un filete lima con brillo y un anillo de puntos que gira.
      ctx.save();
      ctx.translate(cx, cy);
      this.trazarBlob(r, amplitud, estirar, ang);
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.strokeStyle = acento;
      ctx.lineWidth = 1;
      ctx.globalAlpha = (0.4 + e * 0.45) * atenuar;
      ctx.shadowColor = acento;
      ctx.shadowBlur = 16 * this.dpr;
      ctx.stroke();
      ctx.restore();

      if (!reducido && atenuar > 0.05) {
        ctx.save();
        ctx.strokeStyle = acento;
        ctx.globalAlpha = (0.18 + e * 0.2) * atenuar;
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 9]);
        ctx.lineDashOffset = -this.t * 26;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 1.14, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 6. Partículas: puntos y glifos que salen del borde.
    if (this.particulas.length) {
      ctx.save();
      ctx.fillStyle = acento;
      ctx.font = "500 10px ui-monospace, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const p of this.particulas) {
        ctx.globalAlpha = limitar(p.vida / p.total, 0, 1) * 0.9 * (1 - base);
        if (p.glifo) ctx.fillText(p.glifo, p.x, p.y);
        else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.tam, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    // 7. Mira en la posición real del puntero (solo ratón).
    if (this.activo && this.punteroFino && r > 4) {
      const { x, y } = this.puntero;
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        ctx.moveTo(x + dx * 9, y + dy * 9);
        ctx.lineTo(x + dx * 13, y + dy * 13);
      }
      // Halo oscuro debajo del trazo claro: se ve sobre la foto y sobre el alter ego.
      ctx.strokeStyle = "rgba(0, 0, 0, 0.45)";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.strokeStyle = papel;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.95;
      ctx.stroke();
      ctx.fillStyle = papel;
      ctx.beginPath();
      ctx.arc(x, y, 1.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  /**
   * Dibuja la imagen oculta cubriendo el lienzo, con el mismo recorte que
   * `object-fit: cover; object-position: foco` de la foto de debajo.
   */
  private pintarImagen(dx: number, dy: number) {
    const { imagen, ancho, alto } = this;
    const { foco } = this.opciones;
    const iw = imagen.naturalWidth || 1;
    const ih = imagen.naturalHeight || 1;
    const escala = Math.max(ancho / iw, alto / ih);
    const w = iw * escala;
    const h = ih * escala;
    this.ctx.drawImage(
      imagen,
      (ancho - w) * foco.x + dx,
      (alto - h) * foco.y + dy,
      w,
      h,
    );
  }

  private crearScanlines(): CanvasPattern | null {
    const c = document.createElement("canvas");
    c.width = 4;
    c.height = 4;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, 4, 1);
    return this.ctx.createPattern(c, "repeat");
  }
}
