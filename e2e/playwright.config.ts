import { defineConfig, devices } from '@playwright/test'
import { LOGOS_WEB_URL, siteEnvironment } from './src/config/site'
import { LOGOS_WEB_RULES } from './src/constants/logos-web'

import type { SiteOptions } from './src/fixtures/site.fixture'

/**
 * logos.co suite. It starts no server: point LOGOS_WEB_URL at a running
 * instance (default http://localhost:3000), staging or production. Settings
 * come from the shell, e2e/.env.local or e2e/.env (loaded in
 * src/config/site.ts). The daily
 * workflow runs it against https://dev.logos.co and https://logos.co.
 */
export default defineConfig<SiteOptions>({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // One worker against the deployed sites: their nginx rate-limits per IP.
  workers: siteEnvironment(LOGOS_WEB_URL) === 'local' ? 2 : 1,
  reporter: [
    ['html', { outputFolder: 'test-results/html-report', open: 'never' }],
    ['list'],
    ...(process.env.CI
      ? ([['github', {}]] as [string, Record<string, unknown>][])
      : []),
  ],
  outputDir: 'test-results/artifacts',

  use: {
    ...devices['Desktop Chrome'],
    baseURL: LOGOS_WEB_URL,
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    // `next dev` compiles a route on its first visit.
    navigationTimeout: 45_000,
    siteRules: LOGOS_WEB_RULES,
  },

  projects: [{ name: 'logos.co' }],
})
