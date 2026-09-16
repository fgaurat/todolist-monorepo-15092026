import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Garantit une seule copie de React même si le package partagé
    // est résolu depuis packages/shared (symlink du workspace).
    dedupe: ['react', 'react-dom'],
  },
})
