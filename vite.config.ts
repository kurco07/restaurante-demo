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
      // Solo cachea el app shell (HTML/JS/CSS/assets de build).
      // La sincronización offline de datos la maneja PowerSync por separado,
      // no el service worker de esta PWA.
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
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
