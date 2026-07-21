import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        manifestFilename: 'site.webmanifest',
        includeAssets: [
          'favicon.svg',
          'favicon-16x16.png',
          'favicon-32x32.png',
          'favicon-48x48.png',
          'apple-touch-icon.png',
          'icon-192.png',
          'icon-512.png',
          'icon-192-maskable.png',
          'icon-512-maskable.png',
          'og.png',
          'site.webmanifest',
        ],
        manifest: {
          name: 'Navo — Prediction Markets',
          short_name: 'Navo',
          description: 'Trade prediction markets on elections, sports, crypto, and culture.',
          theme_color: '#000000',
          background_color: '#000000',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/?source=pwa',
          scope: '/',
          id: '/',
          icons: [
            { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/icon-192-maskable.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
            { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
          categories: ['finance', 'news'],
          lang: 'en',
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,webmanifest}'],
          navigateFallback: '/index.html',
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.mode === 'navigate',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'navo-navigate',
                networkTimeoutSeconds: 4,
                expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 },
              },
            },
            {
              urlPattern: /^https:\/\/gamma-api\.polymarket\.com\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'polymarket-gamma',
                networkTimeoutSeconds: 8,
                expiration: { maxEntries: 50, maxAgeSeconds: 300 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /^https:\/\/clob\.polymarket\.com\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'polymarket-clob',
                networkTimeoutSeconds: 5,
                expiration: { maxEntries: 50, maxAgeSeconds: 60 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /^https:\/\/data-api\.polymarket\.com\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'polymarket-data',
                networkTimeoutSeconds: 8,
                expiration: { maxEntries: 40, maxAgeSeconds: 120 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    define: {
      global: 'globalThis',
    },
    optimizeDeps: {
      include: ['@privy-io/react-auth', 'viem', '@polymarket/clob-client-v2', '@polymarket/builder-relayer-client'],
    },
    server: {
      proxy: {
        '/api/polymarket/sign': {
          target: `http://localhost:${env.SIGN_PORT ?? '8787'}`,
          rewrite: (path) => path.replace(/^\/api\/polymarket\/sign/, '/sign'),
        },
        '/api/polymarket/health': {
          target: `http://localhost:${env.SIGN_PORT ?? '8787'}`,
          rewrite: (path) => path.replace(/^\/api\/polymarket\/health/, '/health'),
        },
      },
    },
  };
});
