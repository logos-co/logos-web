import { fileURLToPath } from 'node:url'

import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()
const workspaceRoot = fileURLToPath(new URL('../..', import.meta.url))
const isProduction = process.env.NODE_ENV === 'production'

const nextConfig = {
  basePath: process.env.BASE_PATH || undefined,
  experimental: {
    globalNotFound: true,
  },
  images: {
    unoptimized: true,
  },
  ...(isProduction && { output: 'export' }),
  ...(!isProduction && {
    async rewrites() {
      return [
        {
          source: '/api/legacy-search',
          destination: 'https://blog.logos.co/api/search',
        },
      ]
    },
  }),
  reactStrictMode: true,
  transpilePackages: ['@acid-info/logos-ui'],
  trailingSlash: false,
  turbopack: {
    root: workspaceRoot,
  },
}

export default withNextIntl(nextConfig)
