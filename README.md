# Johan Balanta — Ideas que toman forma

Portafolio en React, TypeScript y Vite. Landing con un retrato interactivo a
pantalla completa en la portada, sección editorial, cuatro trabajos con
capturas reales y cierre de contacto.
Presentación, precios y la página completa de cada trabajo se consultan en
ventanas nativas, sin páginas adicionales.

## Desarrollo

El servidor de desarrollo usa el puerto 5180 y los tests el 5199, ambos fijos:
el 5173 lo comparten otros proyectos de la máquina y la suite llegó a ejecutarse
contra la aplicación equivocada sin avisar.

```bash
npm install
npm run dev
npm run build
npm run preview
npm run typecheck
```

## Verificación

```bash
npx playwright install chromium
npm test
```

Las pruebas cubren apertura y cierre de ventanas con teclado, restauración de
foco, el revelado del retrato (ratón, táctil, teclado y movimiento reducido),
pausa y reproducción del video según visibilidad, revelados al desplazarse,
ausencia de desbordamiento y auditoría axe.

Para ver la fluidez en un equipo concreto, abre la página con `?diag=1`: un
rótulo abajo a la izquierda muestra los fotogramas por segundo y cuenta los
tirones (fotogramas de más de 50 ms) por sección. Con `?suave=0` se apaga el
scroll suave de escritorio, para comparar con el nativo.

## Editar la campaña

- `src/componentes/Campana.tsx`: estructura, textos, ventanas y trabajos.
- `src/componentes/Campana.css`: composición, geometría y versión móvil.
- `src/estilos/global.css`: papel `#f4f0e7`, tinta `#171815`, lima `#c7ff4a`,
  tipografías Instrument Sans / Newsreader y revelados de 0,75 segundos.
- `src/ganchos/useCampana.ts`: revelados y ciclo de reproducción del video.
- `src/datos/perfil.ts`: identidad, presentación, correo y disponibilidad.

Los componentes de la versión anterior y sus datos se conservan en `src/`,
pero la landing actual solo monta `Campana`. No hay selector de tema: la
composición utiliza una paleta fija clara y un cierre oscuro.

## Retrato interactivo

La portada es un retrato con dos identidades: la foto normal y, debajo, un
alter ego tecnológico que aparece solo bajo el puntero (en táctil, manteniendo
pulsado o arrastrando en horizontal; con teclado, al enfocar el retrato).

- `src/componentes/Retrato.tsx`: DOM, gestos y estados.
- `src/retrato/motor.ts`: la máscara en canvas. Muelles para posición y radio;
  la velocidad del puntero gobierna deformación, estiramiento, partículas,
  estela y cortes. Con `prefers-reduced-motion` queda un círculo suave que
  sigue al puntero sin efectos.
- `public/imagenes/retrato/normal.jpg` y `alter.jpg`: las dos capas, con la
  proporción de la foto original. Deben tener el mismo encuadre exacto; la
  portada las recorta con `object-fit: cover` y el punto focal (`FOCO` en
  `Retrato.tsx`) es el mismo para las dos.

El alter ego actual es una imagen generada con IA (image-to-image a partir
de la foto) y alineada con `scripts/alinear-alter.mjs`, que escala y desplaza
la imagen hasta que sus pupilas caen sobre las de `normal.jpg`:

```bash
node scripts/alinear-alter.mjs ruta/al/alter.png \
  --ojos-normal 743,379 897,380 \
  --ojos-alter 2562,1075 3002,1075
```

Además escribe `alter-mezcla.jpg` (las dos capas al 50 %) para comprobar la
alineación a ojo; se borra después.

Si no tienes un alter ego hecho fuera, `scripts/retrato.mjs` genera uno a
partir de la propia foto, en cinco estilos (`--estilo circuitos|duotono|
wireframe|ascii|holograma`, o `--opciones` para verlos todos en una hoja de
contacto):

```bash
node scripts/retrato.mjs ruta/a/tu-foto.jpg --estilo duotono
```

**Recorrido con scroll.** La portada mide 350svh y su contenido va fijo
(`.hero-fijo`, sticky). El retrato lee cuánto se ha bajado: en el primer 30 %
el alter ego se revela entero (un círculo que crece desde el puntero) y en el
resto avanza una secuencia de fotogramas, `public/imagenes/retrato/secuencia/
f000.jpg … f120.jpg`, que es el vídeo del alter ego girando de perfil. Al
final se queda en el último fotograma y la página sigue. Los fotogramas se
cargan después de la primera pintura, de cuatro en cuatro.

La secuencia sale de `video1.mp4` recortada al encuadre exacto de `normal.jpg`
(mismo método que el alter ego: pupilas medidas en el primer fotograma, escala
2,11 y desplazamiento −101, 0; el vídeo va 11 px más arriba que la foto, que
no se nota y evita rellenar el borde superior). Para regenerarla con otro vídeo del mismo
encuadre:

```bash
ffmpeg -i video1.mp4 \
  -vf "format=rgb24,scale=1823:1047:flags=lanczos,crop=1672:941:101:0,scale=1280:720:flags=lanczos,unsharp=5:5:0.5:5:5:0,format=yuvj420p" \
  -start_number 0 -q:v 4 public/imagenes/retrato/secuencia/f%03d.jpg
```

Si cambia el número de fotogramas, ajusta `FOTOGRAMAS` en `Retrato.tsx`.

Ese mismo script es el que produce `normal.jpg` (la foto con su proporción,
lado largo limitado a 2000 px). La foto actual es apaisada con fondo blanco, y
el hero toma ese blanco como fondo para que los bordes que no cubra se fundan
con ella.

## Trabajos

Los cuatro trabajos viven en `src/datos/trabajos.ts`: el primero se presenta en
grande con su galería y el resto como tarjetas. Cada uno puede llevar `capturas`
(las que se ven en la tarjeta) y `landing` (la página completa que se abre en
una ventana). Añadir uno nuevo es escribir una entrada más.

Las imágenes salen de ejecutar cada proyecto en local y fotografiarlo; las
versiones a resolución completa quedan fuera del repositorio, en `capturas/`.

## Videos

En `public/media/` hay dos bucles, ambos recortados, acelerados y recomprimidos
para web, con su póster:

- `flujo-loop.mp4` — antigua portada, hoy sin uso (la portada es el retrato).
  [Elegant Abstract White Flowing Background Loop](https://www.pexels.com/video/elegant-abstract-white-flowing-background-loop-37014005/),
  de Chandresh Uike (Pexels).
- `tinta-loop.mp4` — panel de la sección Enfoque. [Abstract Image of a Black and White Ink](https://www.pexels.com/video/abstract-image-of-a-black-and-white-ink-3051492/),
  de Dan Cristian Pădureț (Pexels). El bucle cierra con un fundido del final
  contra el inicio, sin corte visible.

Los dos reproducen con autoplay, muted, loop y playsinline, y se pausan fuera de
su sección, con la pestaña oculta o con movimiento reducido. Si el navegador
rechaza el autoplay (Safari en ahorro de energía), se reintenta al primer gesto.

## Movimiento

Todo es función pura de la posición del scroll (variables CSS que escribe cada
sección en `requestAnimationFrame`) y todo se anula con `prefers-reduced-motion`:

- La portada es un recorrido: revela el alter ego y avanza el vídeo con el
  scroll, y todo vuelve al subir.
- De la portada a las herramientas se pasa por un túnel en 3D (`Tunel.tsx`);
  las placas de los lenguajes que viajan por él aterrizan en su casilla de la
  sección, que las releva en el mismo píxel.
- No hay bordes entre secciones: las placas del túnel cruzan el borde de la
  sección mientras entra (recorte solo horizontal); al acabar las herramientas
  un agujero negro se las traga (cada pieza cae al centro girando y volviéndose
  clara) hasta dejar la pantalla en negro, que ya es el fondo de Proyectos, y
  ahí se teclea `ls ./proyectos`, que es su rótulo; y tras el último proyecto
  una luz crece hasta llenar la pantalla del blanco de Cierre, que llega por
  encima igual.
- El cierre saca la figura de la niebla con el scroll.

Cada sección solo mide su posición mientras está a la vista (`cercania.ts`):
medir las lejanas fuerza recálculos de estilo que se notaban como tirones. En
escritorio, Lenis suaviza la rueda (`suave.ts`).

### El agujero negro

La transición de herramientas a proyectos reproduce con el scroll los
fotogramas de `video6.mp4` (generado con IA a partir del prompt que hay en el
historial: agujero negro minimalista, fondo blanco, un anillo lima, sin
estrellas, cámara fija). Se recorta al tramo con movimiento y se le llevan el
blanco y el negro a los de la página, para que empalme sin saltos:

```bash
F="format=rgb24,lutrgb=r='clip(15+val*0.9597,0,255)':g='clip(17+val*0.9516,0,255)':b='clip(19+val*0.9435,0,255)',fps=52/8.35"
ffmpeg -ss 1.4 -to 9.75 -i video6.mp4 -vf "$F,scale=1280:720:flags=lanczos,format=yuvj420p" \
  -start_number 0 -q:v 5 public/imagenes/agujero/f%03d.jpg
ffmpeg -ss 1.4 -to 9.75 -i video6.mp4 -vf "$F,scale=320:180:flags=lanczos,format=yuvj420p" \
  -start_number 0 -q:v 13 public/imagenes/agujero-mini/f%03d.jpg
```

Si cambia el número de fotogramas, ajusta `FOTOGRAMAS` en `Herramientas.tsx`.

## Publicación

Sitio estático: `npm run build` genera `dist/` (unos 4,4 MB, la mayoría video).

En Cloudflare Pages, conectando este repositorio:

- Build command: `npm run build`
- Output directory: `dist`

`public/_headers` fija el caché: eterno para `/assets/` (llevan hash en el
nombre) y una semana para video e imágenes. Netlify entiende el mismo archivo.

Para publicar en una subruta (GitHub Pages bajo `/portafolio/`), cambia `base`
en `vite.config.ts` antes de compilar: las rutas de video e imágenes la usan.

## Cierre

La última sección (`src/componentes/Cierre.tsx`) es otro recorrido con
scroll: la figura con armadura sale de la niebla a la luz y, al final, entra
el contacto (correo, copiar correo y GitHub).

- Los fotogramas están en `public/imagenes/cierre/f000.jpg … f119.jpg`: salen
  de `video3.mp4` (la versión en 4K) a 12 por segundo y 1600×900, con los
  niveles subidos para llevar su fondo gris claro a blanco puro y un enfoque
  suave. El vídeo se pinta con `mix-blend-mode: multiply`
  y bordes fundidos, así que no se ve su recuadro sobre el blanco de la página.
- La niebla es CSS (`.cierre-niebla`): un velo blanco que se retira pronto y
  bancos de bruma que derivan y se disipan más tarde.
- Los fotogramas solo se cargan cuando la sección se acerca.

Para regenerarlos con otro vídeo:

```bash
ffmpeg -i video3.mp4 \
  -vf "fps=12,scale=1600:900:flags=lanczos,format=rgb24,colorlevels=rimax=0.78:gimax=0.8:bimax=0.8,unsharp=5:5:0.3:5:5:0,format=yuvj420p" \
  -start_number 0 -q:v 4 public/imagenes/cierre/f%03d.jpg
```

Si cambia el número de fotogramas, ajusta `FOTOGRAMAS` en `Cierre.tsx`.
