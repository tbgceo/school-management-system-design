import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Pin root and cacheDir to this folder so the server behaves the same however it is launched
// (npm run dev from here, or node node_modules/vite/bin/vite.js from somewhere else).
const here = fileURLToPath(new URL('.', import.meta.url));

// GitHub Pages serves a project site from /<repo>/, so the bundle has to be
// built with that prefix. Locally BASE_PATH is unset and this stays '/'.
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  root: here,
  base,
  cacheDir: `${here}node_modules/.vite`,
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
});
