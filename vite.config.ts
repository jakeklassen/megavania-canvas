import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base so the build works from any path (e.g. surge static hosting).
  base: './',
  build: {
    target: 'es2020',
  },
});
