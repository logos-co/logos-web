import { fileURLToPath } from 'node:url'
import createNextIntlPlugin from 'next-intl/plugin'

const workspaceRoot = fileURLToPath(new URL('../..', import.meta.url))
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@acid-info/logos-ui'],
  turbopack: { root: workspaceRoot },
}

export default withNextIntl(nextConfig)
