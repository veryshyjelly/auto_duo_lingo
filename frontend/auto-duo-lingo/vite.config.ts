import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/connect': {
        target: 'http://localhost:8080',
        ws: true,
      },
      '/status': 'http://localhost:8080',
      '/audio': 'http://localhost:8080',
    },
  },
  test: {
    environment: 'node',
  },
})
