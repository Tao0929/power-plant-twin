import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '192.168.99.3',
    port: 7777
  },
  build: {
    base: '/power-plant-twin/',
    outDir: './docs',
  }
})
