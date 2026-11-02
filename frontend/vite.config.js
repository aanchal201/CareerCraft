import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true, // must match CORS_ALLOWED_ORIGINS on the backend
  },
  build: {
    // Source maps would expose the original source code publicly - keep them off
    sourcemap: false,
    rollupOptions: {
      output: {
        // React + router in their own long-cached file: it rarely changes between deploys
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', 'axios'],
        },
      },
    },
  },
  // Unit tests (npm test) - Vitest reads this section
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}'],
  },
});
