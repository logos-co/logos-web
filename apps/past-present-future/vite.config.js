import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'NEXT_PUBLIC_API_MODE')
  const apiMode =
    process.env.NEXT_PUBLIC_API_MODE ||
    env.NEXT_PUBLIC_API_MODE ||
    (command === 'serve' ? 'development' : 'production')
  const origins = {
    development: 'http://localhost:3003',
    staging: 'https://dev-admin-acid.logos.co',
    production: 'https://admin-acid.logos.co',
  }
  if (!Object.hasOwn(origins, apiMode))
    throw new Error('Invalid NEXT_PUBLIC_API_MODE')
  return {
    plugins: [sveltekit()],
    define: {
      'import.meta.env.MUSEUM_SUBMISSION_ENDPOINT': JSON.stringify(
        `${origins[apiMode]}/api/forms/museum`
      ),
    },
    // apps/web proxies /past-present-future to this port in dev (next.config.mjs).
    // The proxy does not carry the HMR websocket, so the client connects here directly.
    server: {
      port: 3006,
      strictPort: true,
      hmr: { clientPort: 3006 },
    },
  }
})
