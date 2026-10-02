import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Read .env files from the repo root, like the server does (see .env.example) — one configured
  // origin, not a second apps/web/.env. Only VITE_-prefixed variables are exposed to client code.
  envDir: '../../',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Only used if/when the web app calls the API during development.
    proxy: { '/api': 'http://localhost:3001' },
  },
  test: {
    name: 'web',
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
