import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  // Puerto propio y fijo: el 5173 lo comparten otros proyectos de la máquina y
  // acababa sirviendo la aplicación equivocada.
  server: { port: 5180, strictPort: true },
  preview: { port: 4180, strictPort: true },
  plugins: [react(), cloudflare()],
  // Si publicas en GitHub Pages bajo https://usuario.github.io/portafolio/
  // cambia esto a '/portafolio/'. Para dominio propio o Vercel, déjalo en '/'.
  base: '/',
})