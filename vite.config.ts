import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Educar para Transformar',
        short_name: 'Educar',
        description:
          'Portal educativo del centro Educar para Transformar: novedades, inscripciones y gestión académica.',
        lang: 'es',
        display: 'standalone',
        start_url: '/login',
        theme_color: '#4f46e5',
        background_color: '#f9fafb',
        icons: [
          { src: '/icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/pwa-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      // Precache del shell estático con los valores de fábrica de Workbox.
      // Solo se cachean GET públicos: las respuestas financieras y de sesión
      // nunca se guardan en el dispositivo.
      workbox: {
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api(?:\/|$)/],
        runtimeCaching: [
          {
            urlPattern:
              /\/api\/(?:noticias|actividades|galeria|servicios|instalaciones|niveles|opiniones)(?:\/|$)/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-publica',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 40, maxAgeSeconds: 86400 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:3001' },
  },
});
