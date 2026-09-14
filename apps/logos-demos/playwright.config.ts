/**
 * End-to-end tests for `apps/logos-demos`.
 *
 * These cover the storage demo's full path: a real file through a real file
 * input, the CID the page works out, and the shared link round trip. The unit
 * tests check the CID against a node's answers; these check that a person
 * dropping a file actually gets that answer on screen.
 *
 * Run with `pnpm --filter logos-demos test:e2e`.
 */
import { defineConfig, devices } from '@playwright/test'

const PORT = 3005

/**
 * Where to run.
 *
 * Defaults to a dev server started here. Set `E2E_BASE_URL` to point at a
 * deployment instead. Worth doing before calling a fix done, because the bugs
 * this suite exists for were ones that only showed up on a real build.
 */
const DEPLOYED = process.env.E2E_BASE_URL
const BASE_URL = DEPLOYED ?? `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  // Hashing and a round trip through the store; the default 30s is tight on a
  // cold dev server.
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Nothing to start when testing a deployment.
  webServer: DEPLOYED
    ? undefined
    : {
        command: `pnpm exec next dev --port ${PORT}`,
        url: BASE_URL,
        /**
         * A fresh server every run, unless asked otherwise.
         *
         * Reusing one is faster and was the default, until a run reused a
         * server started before the fix under test and reported it broken.
         * A suite that can test yesterday's code is worse than a slow one.
         */
        reuseExistingServer: Boolean(process.env.E2E_REUSE_SERVER),
        timeout: 120_000,
      },
})
