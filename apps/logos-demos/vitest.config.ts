/**
 * Vitest for `apps/logos-demos`.
 *
 * Pure-function lib tests and route handler tests with `fetch` stubbed.
 * Demo flows are verified in the browser.
 * Run with `pnpm --filter logos-demos test`.
 */
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/lib/**/*.test.ts', 'src/app/**/__tests__/*.test.ts'],
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
