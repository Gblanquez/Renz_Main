import { defineConfig } from 'vite'
import glsl from 'vite-plugin-glsl';

// vite.config.js
export default defineConfig({
  plugins: [glsl()],
  server: {
    host: 'localhost',
    cors: '*',
    hmr: {
      host: 'localhost',
      protocol: 'ws',
    },
  },
  build: {
    minify: true,
    manifest: true,
    rollupOptions: {
      input: {
        main: './index.html',
        about: './about.html',
        contact: './work.html',
        inside: './inside.html', 
      },
      output: {
        format: 'es',
        entryFileNames: 'main.js',
        esModule: false,
        compact: true,
        globals: {
          jquery: '$',
        },
      },
      // external: ['jquery'],
    },
  },
})
