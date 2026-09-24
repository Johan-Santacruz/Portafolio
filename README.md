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
ausencia de desbordamiento, el cambio de idioma y auditoría axe.

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

Casi todo el texto que se lee está en `src/datos/` y en `src/idioma/textos.ts`,
escrito dos veces (`{ es, en }`). Al añadir o cambiar algo hay que poner las
dos versiones; ver «Dos idiomas».

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

Al final del recorrido, con la figura ya a la derecha, entra una línea de
comandos: se teclea `whoami` y responde con el perfil de la hoja de vida en
primera persona (`presentacion` en `src/datos/perfil.ts`, con el nombre en
negrita). Se teclea letra a letra con el scroll: cada letra es un span con su
índice, transparente hasta que le toca, y la primera sin escribir hace de
cursor lima; así el párrafo está repartido en líneas desde el principio y no
salta mientras se escribe. Los lectores de pantalla leen el texto entero de
una vez, y el nombre completo es el `h1` de la página, fuera de la vista. En
los teléfonos bajos y en horizontal las dos líneas de rol que siguen no se
muestran: el perfil ya lo dice y sin ellas el texto no pisa la cara.

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

## Trayectoria y hoja de vida

`src/datos/trayectoria.ts` tiene los pases: cada sitio donde he estado dio
uno. Sale de la hoja de vida, así que si cambia una, cambia la otra. Las habilidades blandas no están aquí: van con las técnicas,
como una categoría más de `datos/stack.ts` (campo `criterio`), porque es su
sitio, aunque se presenta como otro capítulo. Entre la última categoría
técnica y ella hay un corte: un barrido de luz lima deja la pantalla en negro
y otro la devuelve a blanco (fotogramas de `video8.mp4`, ver abajo). Con la
pantalla negra, la cabecera cambia de «Herramientas · Con qué construyo» a
«Habilidades blandas · Cómo trabajo», así que el relevo no se ve. Después el
lector de palabras se aparta a la izquierda y se apaga, y las habilidades
toman el ancho entero en una cuadrícula de ocho casillas: el número, un
esquema, la palabra y una frase corta. Si una necesita un párrafo para
explicarse, está mal escrita.

Cada esquema (`componentes/Glifo.tsx`) enseña la habilidad en vez de
ilustrarla: resolutivo parte un problema en ramas hasta que cada hoja lleva
su check; responsable, una barra de progreso que cae justo en la bandera de
la fecha; adaptativo, una ruta que rodea el obstáculo; colaborativo, una red
que pasa por el centro; autodidacta, una escalera que sigue; ordenado, un
árbol con la rama buena en lima; comunicativo, un bocadillo que se oye;
riguroso, un documento bajo la lupa, aprobado. Ocupan el hueco que antes
quedaba vacío en las ocho casillas y hacía que la pantalla pareciera una
tabla.

Cada casilla es una placa de acero de la misma familia que las de las
herramientas técnicas: la trama de líneas, el degradado del metal, el filo
lima a la izquierda y el chaflán. Antes eran casillas blancas separadas por
líneas grises, y aunque el armado fuera vistoso, en reposo la pantalla seguía
pareciendo una tabla de otra página. Sobre el acero el texto va en claro, y
el esquema en claro con su pieza en lima y un halo. Al pasar el ratón la
placa aclara y el filo engorda. Como las placas ya son oscuras, cuando el
agujero se traga la sección no hace falta aclarar su texto: solo la cabecera
y la consola, que siguen sobre el blanco.

**El armado.** Las casillas no aparecen con un fundido: nacen del centro de
la pantalla, justo donde se retira la luz del corte, y salen girando y
creciendo hasta su sitio, cada una a su turno, mientras su esquema se dibuja
trazo a trazo. Todo sale de `--arma` (0 a 1), que `Herramientas.tsx` calcula
con el scroll en el tramo entre el corte y el agujero; subiendo, vuelven al
centro y se desdibujan. Es el camino inverso al del agujero negro, que luego
se las traga al mismo centro: nacen de la luz y mueren en la oscuridad.

El vector de cada casilla hasta el centro no se mide: va en tamaños de
casilla (el % de `translate` es el de la propia casilla), con su columna y
su fila en la rejilla de 4 × 2 y en la de 2 × 4 (`--c4`, `--f4`, `--c2`,
`--f2`, que pone el marcado). Así vale durante el propio armado, cuando las
casillas están desplazadas y medirlas daría un vector falso. Cada trazo del
esquema lleva `pathLength` 1 para que el mismo `stroke-dasharray` valga para
todas las líneas, y --j dice su turno: la pieza en lima llega la última, justo
cuando la casilla se posa.

El disparo automático del corte llega hasta el final del armado: un solo
gesto reproduce el barrido y la llegada de las casillas. Con movimiento
reducido, todo está ya posado y dibujado.

El esquema ocupa el hueco que deja su casilla, con tope. En un teléfono bajo
(menos de 780 px de alto) no queda sitio y encogería hasta ser una mancha, así
que no se pinta. Para que eso funcione, la bandeja lleva en ese capítulo una
fila del alto de la pantalla y no del contenido: con la fila automática, la
cuadrícula crecía con lo que tuviera dentro y en móvil se salía por abajo.

El corte se genera igual que las demás secuencias:

```bash
F="format=rgb24,fps=32/7.3"
ffmpeg -ss 1.0 -to 8.3 -i video8.mp4 -vf "$F,scale=1280:720:flags=lanczos,format=yuvj420p" \
  -start_number 0 -q:v 5 public/imagenes/corte/f%03d.jpg
ffmpeg -ss 1.0 -to 8.3 -i video8.mp4 -vf "$F,scale=320:180:flags=lanczos,format=yuvj420p" \
  -start_number 0 -q:v 12 public/imagenes/corte-mini/f%03d.jpg
```

Si cambia el número de fotogramas, ajusta `CORTES` en `Herramientas.tsx`.

La sección es un libro mayor de cinco bandas a todo el ancho, una por pase,
con un encabezado que lleva el contador («02 / 05»). Cada banda enseña siempre
su línea: el índice, el año en grande, de qué fue, dónde y el sello. La banda
del pase activo se abre y enseña dentro lo que hizo, el sitio y las notas, en
dos columnas; las demás quedan como una línea. Cuánto se abre cada una sale de
`--p`: cada banda mide al menos su línea (el detalle va con alto cero en el
flujo y se desborda dentro, recortado por la banda) y el espacio que sobra se
lo lleva entero la abierta; a medio deslizamiento se lo reparten dos, así que
una se cierra mientras la siguiente se abre. El lector se detiene en cada pase
(`conReposo`, el mismo recurso que el de herramientas).

Antes era una pila de credenciales, una a la vez, con media pantalla vacía; y
antes de esto, una lista con el detalle al lado, que el dueño encontró
demasiado parecida. Las bandas que se abren son el recurso que más se repite
en los portafolios premiados de Awwwards para listas de trabajos y de
experiencia (Dennis Snellenberg, Jesper Landberg): la lista entera a la
vista, y la fila activa que crece y enseña lo suyo.

Añadir un pase es añadir una entrada en `pases`; la altura de la sección se
calcula sola con `--pases`.

La hoja de vida vive en `public/documentos/`: el PDF que se descarga y sus
páginas en JPEG, que son las que se ven en la ventana (un PDF embebido no se
muestra bien en móvil). Para regenerar las páginas tras cambiar el PDF:

```bash
node scripts/hoja-de-vida.mjs
```

## Trabajos

Los trabajos viven en `src/datos/trabajos.ts`: el primero se presenta en grande
con su galería y el resto como tarjetas. Cada uno puede llevar `capturas` (la
primera es la que se ve tras el nombre en la lista), `landing` (la página
completa que se abre en la ventana) y `sitio` (si está publicado y se puede
probar). Añadir uno nuevo es escribir una entrada más.

Cuando el rol no consta en ninguna parte se marca `rolPorConfirmar` y la ficha
lo omite, en vez de inventarlo.

Las imágenes salen de ejecutar cada proyecto en local y fotografiarlo, o de su
sitio publicado si lo tiene. Las versiones a resolución completa quedan fuera
del repositorio, en `capturas/`. El formato es el mismo para todos: las de la
lista a 1100 × 688 y las de recorrido a 1000 de ancho, en JPEG.

Lo que no se puede fotografiar honestamente se queda sin imagen. Un proyecto
que necesita base de datos y claves para arrancar sale vacío, y una pantalla
vacía dice menos que ninguna.

## Reconocimientos

Al final del capítulo de proyectos, en `datos/reconocimientos.ts`: lo que han
publicado otros sobre el trabajo, con el medio delante porque ahí está el
valor. Cada fila enlaza a la publicación original.

Las vistas previas se guardan en el repositorio, en
`public/imagenes/reconocimientos/`, y las baja `scripts/reconocimientos.mjs`:

```bash
node scripts/reconocimientos.mjs
```

No se enlazan directamente porque las direcciones de las imágenes de Instagram
y de LinkedIn van firmadas y caducan, así que a las pocas semanas la página se
queda con huecos. Instagram además no entrega la vista previa a `curl`, solo a
un navegador de verdad; por eso el guion usa el Chromium de Playwright. Al
añadir un reconocimiento hay que añadirlo también a la lista del guion y
volver a correrlo.

Las fotos son de quien las publicó. Van con su medio a la vista y enlazadas a
la publicación.

La banda es una placa de papel sobre el capítulo oscuro, con borde limpio: el
mismo chaflán y el mismo filo lima de las demás placas del sitio (la ventana
de proyecto, los pases), y dentro los textos en tinta. Sobresale del texto una
holgura por cada lado y nunca llega a pegarse al borde de la pantalla.

Probamos a difuminar el negro hasta el blanco de cuatro maneras: rampa lineal,
rampa suavizada, en oklab y un disolvido por trama de líneas. Todas se veían
sucias, porque cualquier paso entre los dos pasa por grises; el corte neto se
lee como una pieza a propósito. El lima de la casa no se lee sobre papel, así
que el medio y el estado de paso usan el verde oscuro que ya llevan la portada
y la pantalla de carga.

Las vistas previas se encienden solas al pasar por el centro de la pantalla, con el mismo `--luz` que escribe `Proyectos.tsx` para
los nombres de los proyectos (ahí con un alcance mayor, porque las filas son
más bajas y van seguidas). Antes solo se encendían con el ratón, así que en un
teléfono se quedaban siempre apagadas. Con `prefers-reduced-motion` se quedan
encendidas del todo.

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

## Pantalla de carga

`index.html` lleva el marcado y el CSS de la pantalla de carga, para que se
vea antes de que llegue el JavaScript; `retrato/carga.ts` precarga y la
retira. No se precarga la página entera (son varios megas de secuencias):
solo las dos capas del retrato, nueve fotogramas repartidos del vídeo de la
portada y las tipografías, que no bloquean. Con red buena dura poco más de un
segundo; con 1,6 Mb/s, unos cuatro. Hay tope de tres segundos para que una
red mala no secuestre la página, y suelo de cuatro décimas para que no
parpadee si todo estaba en caché.

La marca de la pantalla es `public/logo.png`, el mismo monograma JB que va en
la pestaña (`public/icono-64.png` y `public/icono-180.png`). Los tres salen del
logo original con `scripts/logo.mjs`, que lo recorta y lo aplana a tres tintas
(el papel de la página, el azul del logo y el lima de la casa): así el PNG pesa
14 kB en vez de 170 y aparece de inmediato.

## En el teléfono

La página se revisa en vertical (320 × 568, 360 × 640, 375 × 667, 390 × 844,
430 × 932), en horizontal (640 × 360, 667 × 375, 740 × 360, 844 × 390,
932 × 430) y en tableta. Lo que no se ve a simple vista:

- **Horizontal** es su propio caso (`orientation: landscape` y menos de
  500 px de alto), no una versión estrecha del escritorio ni una ancha del
  móvil. La trayectoria deja las cinco líneas a la izquierda como índice y
  pone el detalle del pase activo a la derecha, todos en el mismo sitio y
  cada uno con su `--luz`: apiladas, las cinco bandas no dejaban nada a la
  abierta. Las habilidades blandas vuelven a 4 × 2, porque en 2 × 4 cada
  placa medía 50 px y no cabía la frase. El contacto vuelve al reparto de
  escritorio, con el titular medido por el alto.
- **Teléfonos bajos en vertical** (hasta 620 px de alto): la trayectoria
  quita el encabezado (el riel ya dice en qué pase va) y aprieta las bandas
  cerradas para que quepan las tres notas del pase abierto. Por debajo de
  400 px de ancho los dos idiomas se apilan, que en una línea pisaban el riel.
- **Contacto**: la figura ocupa lo que deja libre el texto, medido desde
  abajo, en vez de un 62 % fijo que en los teléfonos bajos ponía el titular
  encima de la cara. La hoja de vida y GitHub también salen en el teléfono:
  es el único sitio desde el que se abren.
- **Cabecera**: la letra más pequeña del menú (10 px) es solo para 320; a 360
  y 375 cabe la de 390. El botón de idioma mide al menos 38 px de ancho, que
  con dos letras se quedaba en 26. Entre 861 y 1400 px la píldora, con los
  nombres largos, llega hasta el rótulo de las herramientas: el rótulo baja
  a la franja de debajo.
- **Fichas**: el botón de cerrar no se encoge (`flex: 0 0 44px`); con un
  título largo, a 320 quedaba en 12 px. La barra de la hoja de vida, a 320,
  pasa la descarga a una segunda línea.

Las dos últimas pruebas de `tests/portfolio.spec.ts` lo vigilan: el pase
abierto entero en horizontal y a 320, y el contacto con la hoja de vida y
GitHub a mano sin pisar el pie ni la cabecera.

## Dos idiomas

La página nace en español y el botón de la cabecera (`EN` / `ES`) la pasa a
inglés. La elección se guarda en `localStorage` con la llave
`portafolio:idioma` y la aplica un guion de cuatro líneas dentro de
`index.html`, antes de que llegue React: así la pantalla de carga y el título
de la pestaña ya salen en el idioma correcto, sin parpadeo.

Todo lo que se lee está escrito dos veces, como un `Par` (`{ es, en }`):

- `src/idioma/idioma.tsx` — el contexto, la memoria y `di(...)`, que resuelve
  un `Par` al idioma activo y deja pasar los `string` tal cual.
- `src/idioma/textos.ts` — los rótulos, los botones y las etiquetas que
  escriben los componentes.
- `src/datos/` — el contenido: el stack, los trabajos, la trayectoria y el
  perfil.

Lo que no se traduce son los nombres propios: las tecnologías, los nombres de
los proyectos y los de las instituciones. Las claves de React tampoco: cada
grupo del stack y cada habilidad llevan un `id` estable, porque si la clave
cambiara al cambiar de idioma React reharía los nodos y las animaciones, que
los guardan desde el primer render, se quedarían apuntando a nodos muertos.

La hoja de vida en PDF sigue siendo solo en español.

## Movimiento

Todo es función pura de la posición del scroll (variables CSS que escribe cada
sección en `requestAnimationFrame`) y todo se anula con `prefers-reduced-motion`:

- La portada es un recorrido: revela el alter ego y avanza el vídeo con el
  scroll, y todo vuelve al subir.
- De la portada a las herramientas se pasa por un túnel en 3D (`Tunel.tsx`);
  las placas de los lenguajes que viajan por él aterrizan en su casilla de la
  sección, que las releva en el mismo píxel.
- Trayectoria recorre sus apartados en horizontal mientras se baja, con el
  mismo fondo que los proyectos.
- El corte entre lo técnico y las habilidades blandas tiene su propio tramo
  de scroll (`--corte-tramo`), no comparte el del lector: así no se pasa de
  largo al bajar deprisa.
- No hay bordes entre secciones: las placas del túnel cruzan el borde de la
  sección mientras entra (recorte solo horizontal); al acabar las herramientas
  un agujero negro se las traga (cada pieza cae al centro girando y volviéndose
  clara) hasta dejar la pantalla en negro, que ya es el fondo de Proyectos, y
  ahí se teclea `ls ./proyectos`, que es su rótulo y de donde emergen los
  proyectos; Trayectoria sigue con ese mismo fondo, sin borde; y al final una
  niebla sube y se lo lleva todo hasta dejar el blanco de Cierre, que llega
  por encima igual.
- El cierre saca la figura de la niebla con el scroll.

Las tres animaciones largas —el túnel, el corte y el agujero negro— no hay
que arrastrarlas: en cuanto se pide bajar con un gesto de verdad (rueda, dedo
o tecla), la página se desliza sola hasta el final del tramo y se ven enteras
(`deslizarHasta` en `suave.ts`). Un salto programático —un enlace de la
cabecera, una prueba— no las dispara, y con `prefers-reduced-motion` tampoco.

Mientras el deslizamiento dura, seguir bajando no lo corta: va al mismo sitio
al que va quien lee. Esto importa con el trackpad, que manda eventos de rueda
durante casi un segundo después de soltar el dedo; antes esa inercia cancelaba
el deslizamiento siempre y, como cada tramo solo lo intentaba una vez por
pasada, el agujero negro acababa haciéndose a pulso. Ahora va con cerrojo
(`lock` de Lenis) y cada tramo recuerda con qué gesto se lanzó, no si se lanzó
ya: si el intento se corta, el siguiente gesto hacia abajo vuelve a lanzarlo.

Lo que sí lo corta es querer otra cosa: rueda hacia arriba o un dedo en la
pantalla. Ahí manda quien lee, se quita el cerrojo y la página se queda donde
va. La rueda hacia arriba tampoco cuenta como «quiero bajar», o echarse atrás
cortaría el deslizamiento y ese mismo gesto lo relanzaría al pararse.

Los tramos están medidos para que la página no se haga larga: unas 17
pantallas de principio a fin en escritorio y 16 en móvil. Si añades una
categoría o un pase, mira que no se dispare (`--por-categoria`, `--por-pase`,
`--tunel`, `--agujero`).

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

### La niebla

La salida hacia el contacto reproduce igual los fotogramas de `video7.mp4`
(niebla blanca muy suave sobre negro, sin remolinos ni destellos). Va en una
capa fija a la pantalla y en modo «screen»: su negro deja ver la sección y su
blanco la cubre, así que no hace falta tocarle los niveles. El último cuarto
lo remata un velo blanco sólido.

```bash
F="format=rgb24,fps=36/8.7"
ffmpeg -ss 0.8 -to 9.5 -i video7.mp4 -vf "$F,scale=1280:720:flags=lanczos,format=yuvj420p" \
  -start_number 0 -q:v 6 public/imagenes/niebla/f%03d.jpg
ffmpeg -ss 0.8 -to 9.5 -i video7.mp4 -vf "$F,scale=320:180:flags=lanczos,format=yuvj420p" \
  -start_number 0 -q:v 13 public/imagenes/niebla-mini/f%03d.jpg
```

Si cambia el número de fotogramas, ajusta `FOTOGRAMAS` en `Proyectos.tsx`.

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
