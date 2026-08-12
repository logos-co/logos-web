import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
    // Integration tests share one PostgreSQL database and truncate between
    // cases, so their files must not run concurrently against it.
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      include: ['src/server/**/*.ts', 'src/contracts/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/server/db/seed.ts'],
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
