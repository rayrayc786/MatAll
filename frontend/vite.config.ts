import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'maskable-icon.png'],
      manifest: {
        name: 'MatAll: Home Repair Supplies within 60 mins',
        short_name: 'MatAll',
        description: 'Get all your home repair supplies delivered within 60 minutes. MatAll provides plumbing, electrical, hardware, and more at your doorstep.',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        id: '/',
        screenshots: [
          {
            src: 'screenshot-wide.png',
            sizes: '1024x1024',
            type: 'image/png',
            form_factor: 'wide',
            label: 'MatAll Desktop'
          },
          {
            src: 'screenshot-mobile.png',
            sizes: '1024x1024',
            type: 'image/png',
            label: 'MatAll Mobile'
          }
        ],
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '1024x1024',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '1024x1024',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '1024x1024',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '1024x1024',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'classic'
      },
      workbox: {
        // Only precache files in production mode to avoid dev warnings
        globPatterns: mode === 'production' ? ['**/*.{js,css,html,ico,png,svg,webmanifest}'] : [],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true
      }
    })
  ],
}))

