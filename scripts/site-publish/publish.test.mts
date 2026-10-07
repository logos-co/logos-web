import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { it } from 'node:test'

const script = fileURLToPath(new URL('./publish.mts', import.meta.url))
const env = {
  ...process.env,
  SITE_PUBLISH_TOKEN: 'local-test-token',
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_NOSYSTEM: '1',
}
const git = (cwd: string, ...args: string[]): string =>
  execFileSync('git', args, {
    cwd,
    env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()

it('publishes a static tree as a fast-forward without exposing the private snapshot', () => {
  const directory = mkdtempSync(resolve(tmpdir(), 'logos-publish-test-'))
  const remote = resolve(directory, 'remote.git')
  mkdirSync(remote)
  git(remote, 'init', '--bare', '--quiet')
  const site = resolve(directory, 'site')
  mkdirSync(site)
  git(site, 'init', '--quiet')
  git(site, 'config', 'user.name', 'Test')
  git(site, 'config', 'user.email', 'test@example.test')
  writeFileSync(resolve(site, 'old.txt'), 'old export')
  git(site, 'add', 'old.txt')
  git(site, 'commit', '--quiet', '-m', 'Initial export')
  const initial = git(site, 'rev-parse', 'HEAD')
  git(site, 'remote', 'add', 'origin', remote)
  git(site, 'push', '--quiet', 'origin', 'HEAD:refs/heads/deploy-develop')
  mkdirSync(resolve(site, 'apps/web/out'), { recursive: true })
  writeFileSync(
    resolve(site, 'apps/web/out/index.html'),
    '<html>Reviewed export</html>'
  )
  writeFileSync(resolve(site, 'press-snapshot.json'), 'private media snapshot')
  const result = spawnSync(process.execPath, [script], {
    cwd: site,
    env: {
      ...env,
      DEPLOY_BRANCH: 'deploy-develop',
      SITE_URL: 'https://dev.logos.co',
      GITHUB_RUN_ID: '42',
    },
    encoding: 'utf8',
  })
  assert.equal(result.status, 0, result.stderr)
  assert.equal(git(remote, 'rev-parse', 'deploy-develop^'), initial)
  assert.equal(
    git(remote, 'show', 'deploy-develop:index.html'),
    '<html>Reviewed export</html>'
  )
  assert.equal(git(remote, 'show', 'deploy-develop:CNAME'), 'dev.logos.co')
  const files = git(
    remote,
    'ls-tree',
    '-r',
    '--name-only',
    'deploy-develop'
  ).split('\n')
  assert.ok(!files.includes('old.txt'))
  assert.ok(!files.includes('press-snapshot.json'))
  assert.deepEqual(
    JSON.parse(git(remote, 'show', 'deploy-develop:site-publish.json')),
    { runId: 42, sourceSha: initial, previewRunId: null }
  )
  assert.equal(
    readFileSync(resolve(site, 'press-snapshot.json'), 'utf8'),
    'private media snapshot'
  )
})

it('rejects a competing publication without overwriting the newer deployment', () => {
  const directory = mkdtempSync(resolve(tmpdir(), 'logos-publish-race-'))
  const remote = resolve(directory, 'remote.git')
  mkdirSync(remote)
  git(remote, 'init', '--bare', '--quiet')
  const site = resolve(directory, 'site')
  mkdirSync(site)
  git(site, 'init', '--quiet')
  git(site, 'config', 'user.name', 'Test')
  git(site, 'config', 'user.email', 'test@example.test')
  writeFileSync(resolve(site, 'old.txt'), 'initial')
  git(site, 'add', 'old.txt')
  git(site, 'commit', '--quiet', '-m', 'Initial export')
  git(site, 'remote', 'add', 'origin', remote)
  git(site, 'push', '--quiet', 'origin', 'HEAD:refs/heads/deploy-develop')
  const competitor = resolve(directory, 'competitor')
  git(
    directory,
    'clone',
    '--quiet',
    '--branch',
    'deploy-develop',
    remote,
    competitor
  )
  git(competitor, 'config', 'user.name', 'Test')
  git(competitor, 'config', 'user.email', 'test@example.test')
  writeFileSync(resolve(competitor, 'old.txt'), 'newer competing export')
  git(competitor, 'commit', '--quiet', '-am', 'Competing publication')
  const newer = git(competitor, 'rev-parse', 'HEAD')
  writeFileSync(
    resolve(site, '.git/hooks/pre-push'),
    `#!/bin/sh\ngit -C '${competitor}' push --quiet origin HEAD:refs/heads/deploy-develop\n`,
    { mode: 0o755 }
  )
  mkdirSync(resolve(site, 'apps/web/out'), { recursive: true })
  writeFileSync(
    resolve(site, 'apps/web/out/index.html'),
    '<html>Stale publication</html>'
  )
  const result = spawnSync(process.execPath, [script], {
    cwd: site,
    env: {
      ...env,
      DEPLOY_BRANCH: 'deploy-develop',
      SITE_URL: 'https://dev.logos.co',
      GITHUB_RUN_ID: '43',
    },
    encoding: 'utf8',
  })
  assert.notEqual(result.status, 0)
  assert.equal(git(remote, 'rev-parse', 'deploy-develop'), newer)
  assert.equal(
    git(remote, 'show', 'deploy-develop:old.txt'),
    'newer competing export'
  )
})
