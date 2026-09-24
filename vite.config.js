import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // The Base44 Vite plugin used to provide the "@/" alias. Define it explicitly now.
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
