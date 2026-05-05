import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
  },
  preview: {
    // Railway injects PORT dynamically — don't hardcode it here
    host: true,
    allowedHosts: ['all'],
  },
})
