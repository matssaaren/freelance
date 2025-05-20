// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // forward REST calls
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, '')
      },
      // forward socket.io websockets
      '/socket.io': {
        target: 'ws://localhost:5000',
        ws: true
      }
    }
  }
});
