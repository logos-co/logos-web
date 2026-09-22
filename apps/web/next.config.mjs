import { fileURLToPath } from 'node:url'

import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()
const workspaceRoot = fileURLToPath(new URL('../..', import.meta.url))
const isProduction = process.env.NODE_ENV === 'production'

// apps/past-present-future is its own SvelteKit app. The production build
// copies its static output into out/past-present-future; in dev, proxy to its
// Vite server (port set in apps/past-present-future/vite.config.js).
const PAST_PRESENT_FUTURE_DEV_ORIGIN = 'http://localhost:3006'

const pastPresentFutureDevRewrites = async () => [
  {
    source: '/past-present-future',
    destination: `${PAST_PRESENT_FUTURE_DEV_ORIGIN}/past-present-future/`,
  },
  {
    source: '/past-present-future/:path*',
    destination: `${PAST_PRESENT_FUTURE_DEV_ORIGIN}/past-present-future/:path*`,
  },
]

const nextConfig = {
  basePath: process.env.BASE_PATH || undefined,
  experimental: {
    globalNotFound: true,
  },
  images: {
    unoptimized: true,
  },
  ...(isProduction
    ? { output: 'export' }
    : { rewrites: pastPresentFutureDevRewrites }),
  reactStrictMode: true,
  transpilePackages: ['@acid-info/logos-ui'],
  trailingSlash: false,
  turbopack: {
    root: workspaceRoot,
  },
}

export default withNextIntl(nextConfig)
