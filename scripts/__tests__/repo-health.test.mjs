import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
)

function readRootPackageManager() {
  const pkg = JSON.parse(
    readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'),
  )
  assert.equal(
    typeof pkg.packageManager,
    'string',
    'root package.json must declare a "packageManager" field',
  )
  const match = /^([^@]+)@(\d+\.\d+\.\d+)$/.exec(pkg.packageManager)
  assert.ok(
    match,
    `packageManager must be "<name>@<semver>", got: ${pkg.packageManager}`,
  )
  return { name: match[1], version: match[2] }
}

function listWorkflowFiles() {
  const dir = path.join(REPO_ROOT, '.github', 'workflows')
  return readdirSync(dir)
    .filter((file) => /\.ya?ml$/.test(file))
    .map((file) => path.join(dir, file))
}

export function extractPnpmSetupVersions(yamlSource) {
  const stepRegex =
    /uses:\s*pnpm\/action-setup@[^\s]+([\s\S]*?)(?=\n\s*-\s|\njobs:|\nsteps:|$)/g
  const versions = []
  for (const match of yamlSource.matchAll(stepRegex)) {
    const body = match[1] ?? ''
    const ver = /\n\s+version:\s*['"]?([^'"\s#]+)['"]?/.exec(body)
    if (ver) versions.push(ver[1])
  }
  return versions
}

describe('repo health: pnpm version consistency', () => {
  const pm = readRootPackageManager()

  it('root packageManager pins pnpm with a concrete semver', () => {
    assert.equal(pm.name, 'pnpm')
    assert.match(pm.version, /^\d+\.\d+\.\d+$/)
  })

  for (const workflow of listWorkflowFiles()) {
    const name = path.basename(workflow)
    it(`workflow ${name} does not pin a pnpm version conflicting with packageManager`, () => {
      const source = readFileSync(workflow, 'utf8')
      const pinned = extractPnpmSetupVersions(source)
      for (const declared of pinned) {
        assert.equal(
          declared,
          pm.version,
          `${name}: pnpm/action-setup pins pnpm@${declared} but root packageManager is pnpm@${pm.version}. ` +
            `Either omit "version:" so the action reads packageManager, or align both.`,
        )
      }
    })
  }
})

describe('repo health: lockfile sync', () => {
  it('pnpm-lock.yaml satisfies pnpm install --frozen-lockfile (matches Vercel CI)', () => {
    try {
      execFileSync(
        'pnpm',
        ['install', '--frozen-lockfile', '--lockfile-only', '--prefer-offline'],
        { cwd: REPO_ROOT, stdio: 'pipe', encoding: 'utf8' },
      )
    } catch (error) {
      const stderr = error?.stderr?.toString?.() ?? ''
      const stdout = error?.stdout?.toString?.() ?? ''
      assert.fail(
        'pnpm install --frozen-lockfile failed. Lockfile is out of sync with package.json files. ' +
          'Run "pnpm install" and commit the regenerated pnpm-lock.yaml.\n\n' +
          stdout +
          '\n' +
          stderr,
      )
    }
  })
})

describe('repo health: extractPnpmSetupVersions', () => {
  it('returns empty when no version is pinned', () => {
    const source = [
      'steps:',
      '  - uses: actions/checkout@v5',
      '  - uses: pnpm/action-setup@v5',
      '  - uses: actions/setup-node@v6',
      '    with:',
      '      node-version: 24',
    ].join('\n')
    assert.deepEqual(extractPnpmSetupVersions(source), [])
  })

  it('extracts a single pinned version', () => {
    const source = [
      'steps:',
      '  - uses: pnpm/action-setup@v5',
      '    with:',
      '      version: 10.9.0',
      '  - uses: actions/setup-node@v6',
    ].join('\n')
    assert.deepEqual(extractPnpmSetupVersions(source), ['10.9.0'])
  })

  it('extracts versions from multiple action-setup steps', () => {
    const source = [
      'jobs:',
      '  a:',
      '    steps:',
      '      - uses: pnpm/action-setup@v5',
      '        with:',
      '          version: 9.0.0',
      '  b:',
      '    steps:',
      '      - uses: pnpm/action-setup@v5',
      '        with:',
      '          version: 11.1.0',
    ].join('\n')
    assert.deepEqual(extractPnpmSetupVersions(source), ['9.0.0', '11.1.0'])
  })

  it('ignores comments and quoted values', () => {
    const source = [
      'steps:',
      '  - uses: pnpm/action-setup@v5',
      '    with:',
      "      version: '11.1.0' # pinned",
    ].join('\n')
    assert.deepEqual(extractPnpmSetupVersions(source), ['11.1.0'])
  })
})
