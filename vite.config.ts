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
      // 'prompt' (Fase 8, Módulo 2): la versión nueva queda esperando y la
      // app muestra "Hay una versión nueva, toca para actualizar"
      // (AvisoVersionNueva.tsx). Con 'autoUpdate' el dispositivo seguía con
      // la versión vieja abierta, sin aviso, hasta cerrar todas las
      // pestañas o recargar (a veces dos veces).
      registerType: 'prompt',
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
        //
        // Fase 8, Módulo 3 (optimización): tampoco se guardan
        // - VisorAR (visor 3D, ~1 MB): igual que el de marcador, los modelos
        //   3D vienen de internet, así que offline no sirve de nada;
        // - las variantes de SQLite que PowerSync nunca carga con nuestra
        //   configuración (~5 MB). Usa la base en IndexedDB
        //   (IDBBatchAtomicVFS, su valor por defecto), que solo carga
        //   wa-sqlite-async. Las "mc-" son para bases cifradas
        //   (encryptionKey) y la wa-sqlite simple es para las variantes OPFS.
        //   Si algún día se configura cifrado o un vfs OPFS en
        //   powerSyncClient.ts, hay que sacarlas de esta lista.
        //   (`????????` = el hash de 8 letras; así no toca wa-sqlite-async)
        globIgnores: [
          '**/VisorARMarcador-*.js',
          '**/VisorAR-*.js',
          '**/mc-wa-sqlite*',
          '**/wa-sqlite-????????.{wasm,js}',
        ],
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
