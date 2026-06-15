import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Served from https://aswinpmenon.github.io/dumbstudio/
  base: "/dumbstudio/",
  plugins: [react()],
})
