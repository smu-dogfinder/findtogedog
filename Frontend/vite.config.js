import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
// import polyfillNode from 'vite-plugin-polyfill-node';

const BACKEND_URL = process.env.VITE_BACKEND_URL || 'http://localhost:8000';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      buffer: 'buffer',
      process: 'process/browser',
      util: 'util',
    },
  },
  define: {
    'process.env': {},
    'global': 'window',
  },
  optimizeDeps: {
    include: ['buffer', 'process', 'util'],
  },
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
