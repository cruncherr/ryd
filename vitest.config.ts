import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vitest/config'

const dirname = path.dirname(fileURLToPath(import.meta.url))

// Szybkie testy „na sucho": rachunki, walidacja i treść e-maili — bez bazy i bez przeglądarki.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(dirname, 'src'),
    },
  },
})
