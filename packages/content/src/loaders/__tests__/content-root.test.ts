import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { it } from 'node:test'

import { getContentRoot } from '../_fs'

it('finds workspace content when the app has its own Turbo configuration', () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'logos-content-root-')))
  const app = join(root, 'apps/web')
  const originalCwd = process.cwd()
  const originalRoot = process.env.LOGOS_CONTENT_ROOT
  try {
    mkdirSync(app, { recursive: true })
    mkdirSync(join(root, 'content'))
    writeFileSync(join(root, 'pnpm-workspace.yaml'), 'packages: [apps/*]\n')
    writeFileSync(join(app, 'turbo.json'), '{"extends":["//"]}')
    delete process.env.LOGOS_CONTENT_ROOT
    process.chdir(app)
    assert.equal(getContentRoot(), join(root, 'content'))
  } finally {
    process.chdir(originalCwd)
    if (originalRoot === undefined) delete process.env.LOGOS_CONTENT_ROOT
    else process.env.LOGOS_CONTENT_ROOT = originalRoot
    rmSync(root, { recursive: true, force: true })
  }
})
