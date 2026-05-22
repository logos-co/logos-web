import { fileURLToPath } from 'node:url'

const workspaceRoot = fileURLToPath(new URL('../..', import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  cacheComponents: true,
  transpilePackages: ['@acid-info/logos-ui'],
  turbopack: { root: workspaceRoot },
}

export default nextConfig
