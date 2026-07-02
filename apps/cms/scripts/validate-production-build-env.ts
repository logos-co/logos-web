import { createRequire } from 'node:module'

interface NextEnv {
  loadEnvConfig: (dir: string) => unknown
}

const require = createRequire(import.meta.url)
const { loadEnvConfig } = require('@next/env') as NextEnv

loadEnvConfig(process.cwd())

const missing: string[] = []

if (!process.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY) {
  missing.push('NEXT_SERVER_ACTIONS_ENCRYPTION_KEY')
}

if (missing.length > 0) {
  console.error(
    `CMS production builds require ${missing.join(
      ', '
    )}. This value keeps Next Server Actions stable across deployments.`
  )
  process.exit(1)
}
