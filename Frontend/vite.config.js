import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const BACKEND_URL = 'https://overpuissantly-propagatory-cathey.ngrok-free.dev';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  define: {
    'import.meta.env.VITE_BACKEND_URL': JSON.stringify(BACKEND_URL),
  },
  server: {
    proxy: {
      '/api': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
        headers: { 'ngrok-skip-browser-warning': 'true' },
      },
      '/auth': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
        headers: { 'ngrok-skip-browser-warning': 'true' },
      },
    },
  },
});
