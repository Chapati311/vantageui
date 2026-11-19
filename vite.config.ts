import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  build: {
    // The real phone is an iPhone SE on iOS 16.3 (Safari 16.3). Vite's default
    // targets Safari 16.4+, which can ship code/CSS that 16.3 can't run.
    target: ['es2020', 'safari16.3', 'ios16.3'],
    cssTarget: ['safari16.3', 'ios16.3'],
  },
  plugins: [
    react(),
    VitePWA({
      // The service worker caches the whole app so it works offline.
      registerType: 'autoUpdate',
      // The manifest is a plain file in public/manifest.webmanifest.
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2,webmanifest}'],
        // The map library is big; still cache it so Maps opens offline (tiles need the internet)
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
});
