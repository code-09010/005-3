import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 本地开发：Vite 5173 代理到 Django runserver 8000
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      '/api': 'http://localhost:8000',
      '/media': 'http://localhost:8000',
    },
  },
})
