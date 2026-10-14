import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    // Android's older system WebViews need optional chaining and nullish
    // coalescing lowered instead of Vite's default modern-browser output.
    target: ['chrome63', 'safari13'],
    cssTarget: ['chrome63', 'safari13'],
    outDir: 'dist',
    sourcemap: false,
  },
});
