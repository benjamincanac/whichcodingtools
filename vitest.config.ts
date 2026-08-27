import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node'
  },
  resolve: {
    // The three aliases Nuxt gives `shared/`, `server/` and the module's runtime utils, so a
    // unit test imports exactly the file the server does.
    alias: {
      '#shared': fileURLToPath(new URL('./shared', import.meta.url)),
      '~~': fileURLToPath(new URL('.', import.meta.url))
    }
  }
})
