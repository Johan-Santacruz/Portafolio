import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  // Puerto propio de los tests y sin reutilizar servidores ajenos: con el 5173
  // compartido, una sesión de Vite de otro proyecto se colaba y la suite
  // terminaba probando la aplicación equivocada sin avisar.
  use: { baseURL: 'http://127.0.0.1:5199', reducedMotion: 'reduce' },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5199',
    url: 'http://127.0.0.1:5199',
    reuseExistingServer: false,
  },
})
