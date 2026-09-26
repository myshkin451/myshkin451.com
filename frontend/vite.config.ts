import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: './',
  plugins: [react()],
  server: { host: '127.0.0.1', port: 4323, strictPort: true },
  preview: { host: '127.0.0.1', port: 4323, strictPort: true },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('index.html', import.meta.url)),
        study: fileURLToPath(new URL('study.html', import.meta.url)),
      },
    },
  },
})
