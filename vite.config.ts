import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Served from the custom apex domain https://dumbstud.io/
  base: "/",
  plugins: [react()],
})
