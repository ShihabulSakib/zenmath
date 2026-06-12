import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    allowedHosts: ['engrammic-unrebellious-edna.ngrok-free.dev'],
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      srcDir: 'public',
      filename: 'sw.js',
      strategies: 'injectManifest',
      injectManifest: {
        swSrc: 'public/sw.js',
        swDest: 'dist/sw.js',
        globDirectory: 'dist',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,wav,json,webmanifest}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
      includeAssets: ['favicon.ico', 'pwa-192x192.png', 'pwa-512x512.png', 'notification-icon.png', 'notification-badge.png', 'audio/*.wav', 'audio/*.json'],
      manifest: {
        name: 'ZenMath — Mental Arithmetic',
        short_name: 'ZenMath',
        description: 'Sharpen your mental math skills with timed exercises, multiple modes, and progress tracking',
        theme_color: '#0A1C2A',
        background_color: '#0A1C2A',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone'],
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        categories: ['education', 'utilities'],
        lang: 'en',
        dir: 'ltr',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
})
