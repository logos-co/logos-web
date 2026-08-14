import { defineConfig, devices } from '@playwright/test'

const PORT = 3105
// localhost rather than 127.0.0.1: the Next dev server treats the numeric host
// as a cross-origin caller and refuses the client's own API requests, which
// looks exactly like a broken app.
const BASE_URL = `http://localhost:${PORT}`

/**
 * Browser coverage for the flows a coordinator actually performs.
 *
 * These run against a real server and a real database, like the integration
 * tests, and for the same reason: the parts most likely to break - a form that
 * posts the wrong shape, a queue that filters server-side, a decision that
 * needs a version token - are invisible to a mocked request.
 *
 * Kept out of `pnpm test` deliberately. They need a database and a build, and a
 * suite that cannot run without setup is one people learn to skip.
 */
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  // A dev server compiles each route on first request, so the first assertion
  // on a page waits on a build rather than on the app being wrong.
  expect: { timeout: 20_000 },
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `pnpm dev --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DATABASE_URL:
        process.env.TEST_DATABASE_URL ??
        'postgresql://logos:logos@localhost:5434/logos_crm',
    },
  },
})
