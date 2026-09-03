import { fileURLToPath } from 'node:url'

const workspaceRoot = fileURLToPath(new URL('../..', import.meta.url))

/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  turbopack: { root: workspaceRoot },
}
