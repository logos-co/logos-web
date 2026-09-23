import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

import adapter from '@sveltejs/adapter-static'

// SvelteKit names each build after Date.now() by default, which renames every
// hashed chunk on every deploy. Naming the build after the source keeps the
// output identical when the source is.
const hashSource = (directory) => {
  const hash = createHash('sha256')

  const walk = (current) => {
    for (const entry of readdirSync(current).sort()) {
      const entryPath = path.join(current, entry)

      if (statSync(entryPath).isDirectory()) {
        walk(entryPath)
        continue
      }

      hash
        .update(path.relative(directory, entryPath))
        .update(readFileSync(entryPath))
    }
  }

  walk(directory)

  return hash.digest('hex').slice(0, 16)
}

// Every route is prerendered (see src/routes/+layout.js). The static output in
// build/ is copied into the web app's export at out/past-present-future by
// apps/web/scripts/copy-past-present-future.sh.
//
// The output dirs are set explicitly because adapter-static otherwise detects
// Vercel (VERCEL=1) and writes to .vercel/output/static instead of build/.
const config = {
  kit: {
    adapter: adapter({ pages: 'build', assets: 'build' }),
    paths: {
      base: '/past-present-future',
      relative: false,
    },
    version: {
      name: hashSource(fileURLToPath(new URL('src', import.meta.url))),
    },
  },
}

export default config
