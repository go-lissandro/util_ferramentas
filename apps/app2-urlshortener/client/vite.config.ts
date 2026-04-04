import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/app2/',
  server: {
    port: 5174,
    proxy: {
      '/api': { target: 'http://localhost:4001', changeOrigin: true },
      '/r':   { target: 'http://localhost:4001', changeOrigin: true },
    },
  },
  build: { outDir: 'dist' },
});
