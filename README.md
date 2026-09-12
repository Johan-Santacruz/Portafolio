# Johan Balanta — Ideas que toman forma

Portafolio en React, TypeScript y Vite. Landing con portada en video, sección
editorial, cuatro trabajos con capturas reales y cierre de contacto.
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
foco, movimiento reducido, pausa y reproducción del video según visibilidad,
revelados al desplazarse, ausencia de desbordamiento y auditoría axe.

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

- `flujo-loop.mp4` — portada. [Elegant Abstract White Flowing Background Loop](https://www.pexels.com/video/elegant-abstract-white-flowing-background-loop-37014005/),
  de Chandresh Uike (Pexels). Lleva una curva de tonos aplicada en la
  codificación para que la estructura se lea sobre el fondo oscuro.
- `tinta-loop.mp4` — panel de la sección Enfoque. [Abstract Image of a Black and White Ink](https://www.pexels.com/video/abstract-image-of-a-black-and-white-ink-3051492/),
  de Dan Cristian Pădureț (Pexels). El bucle cierra con un fundido del final
  contra el inicio, sin corte visible.

Los dos reproducen con autoplay, muted, loop y playsinline, y se pausan fuera de
su sección, con la pestaña oculta o con movimiento reducido. Si el navegador
rechaza el autoplay (Safari en ahorro de energía), se reintenta al primer gesto.

## Movimiento

Tres sistemas, todos función pura de la posición del scroll y todos anulados con
`prefers-reduced-motion`:

- La portada se despide: el video se queda atrás, el texto sube y se desvanece,
  y el fondo se funde a negro antes de que entre la sección clara.
- Los bloques giran hacia atrás en 3D al salir por arriba, como los tablones de
  una rueda, y vuelven intactos al subir.
- Los contenidos aparecen al entrar en pantalla, una sola vez.

## Publicación

Sitio estático: `npm run build` genera `dist/` (unos 4,4 MB, la mayoría video).

En Cloudflare Pages, conectando este repositorio:

- Build command: `npm run build`
- Output directory: `dist`

`public/_headers` fija el caché: eterno para `/assets/` (llevan hash en el
nombre) y una semana para video e imágenes. Netlify entiende el mismo archivo.

Para publicar en una subruta (GitHub Pages bajo `/portafolio/`), cambia `base`
en `vite.config.ts` antes de compilar: las rutas de video e imágenes la usan.
