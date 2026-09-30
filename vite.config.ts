import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // Node 22+ ships an experimental `localStorage` global that shadows the jsdom one unless disabled.
    execArgv: ['--no-experimental-webstorage'],
  },
})
