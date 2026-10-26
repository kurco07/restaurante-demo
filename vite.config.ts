import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Cachea el app shell (HTML/JS/CSS/assets de build) Y los .wasm de
      // PowerSync (@powersync/web empaqueta varias variantes de wa-sqlite
      // según qué soporta el navegador — OPFS, hilos, etc. — así que se
      // cachean todas, no se puede saber de antemano cuál va a elegir el
      // navegador en tiempo de ejecución). Sin esto, el motor de SQLite
      // local de PowerSync no podía ni abrir la base offline — reproducido
      // en vivo: el mesonero recargaba la página sin internet y la app se
      // quedaba colgada tratando de bajar el .wasm por red, nunca llegaba
      // a mostrar nada (ni el error de sesión, ni la propia app).
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,wasm}'],
        // Los .wasm de wa-sqlite pesan más de los 2MB por archivo que
        // Workbox cachea por defecto — son la base misma del modo offline
        // (mesoneros/cocina/mesas, CLAUDE.md), así que vale la pena el
        // espacio bajo cualquier tamaño razonable.
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        // El chunk de VisorARMarcador (AR.js: A-Frame + three.js + decoders
        // de Draco/Basis) pesa varios MB y se carga solo bajo demanda — la
        // RA por marcador necesita cámara + internet en el momento de todas
        // formas, así que no gana nada estando precacheado para offline.
        globIgnores: ['**/VisorARMarcador-*.js'],
      },
      manifest: {
        name: 'Plataforma de Restaurantes',
        short_name: 'Restaurantes',
        description: 'Placeholder — plataforma de gestión integral para restaurantes',
        theme_color: '#7e14ff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/pwa-icon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/pwa-icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/pwa-icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
