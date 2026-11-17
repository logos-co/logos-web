// Vercel Ignored Build Step. Vercel runs it from the app's root directory:
// exit 0 skips the build, exit 1 builds.
//
// The build is skipped when nothing the app builds from changed since the last
// deployment of the branch: the app, the workspace packages it depends on,
// packages/config and the root build files. Docs and tests are left out.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const app = relative(root, process.cwd())

const rootFiles = [
  '.node-version',
  '.npmrc',
  '.nvmrc',
  'package.json',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'turbo.json',
]
const ignored =
  /(^|\/)(docs|__tests__)\/|(^|\/)(AGENTS|CHANGELOG|README)\.md$|\.test\.[cm]?[jt]sx?$/

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'))
const git = (...args) =>
  execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()

const workspaces = new Map()
for (const group of ['apps', 'packages']) {
  for (const name of readdirSync(join(root, group))) {
    const manifest = join(root, group, name, 'package.json')
    if (existsSync(manifest))
      workspaces.set(readJson(manifest).name, `${group}/${name}`)
  }
}

// Every app extends packages/config by relative path, not as a dependency.
const watched = new Set([app, 'packages/config'])
const visit = (directory) => {
  const { dependencies = {}, devDependencies = {} } = readJson(
    join(root, directory, 'package.json')
  )
  for (const [name, version] of Object.entries({
    ...dependencies,
    ...devDependencies,
  })) {
    const dependency = workspaces.get(name)
    if (!version.startsWith('workspace:') || !dependency) continue
    if (watched.has(dependency)) continue
    watched.add(dependency)
    // @repo/content loads the root content/ folder.
    if (name === '@repo/content') watched.add('content')
    visit(dependency)
  }
}

const previous = process.env.VERCEL_GIT_PREVIOUS_SHA

const findBase = () => {
  if (previous) {
    try {
      return git('rev-parse', '--verify', '--quiet', `${previous}^{commit}`)
    } catch {
      // Vercel clones 10 commits deep, so the commit may be missing.
    }
  }
  // Vercel's clone has no remote, so fetch from the public repo. A branch
  // without a successful deployment is compared with develop.
  const { VERCEL_GIT_REPO_OWNER: owner, VERCEL_GIT_REPO_SLUG: slug } =
    process.env
  const remote =
    owner && slug ? `https://github.com/${owner}/${slug}.git` : 'origin'
  git('fetch', '--quiet', '--depth=1', remote, previous || 'develop')
  return git('rev-parse', 'FETCH_HEAD')
}

try {
  visit(app)
  const base = findBase()
  if (previous && base === git('rev-parse', 'HEAD')) {
    console.log('Building: redeploy of the same commit')
    process.exit(1)
  }
  const relevant = git('diff', '--name-only', base, 'HEAD')
    .split('\n')
    .filter(
      (file) =>
        file &&
        !ignored.test(file) &&
        (rootFiles.includes(file) ||
          [...watched].some((path) => file.startsWith(`${path}/`)))
    )
  if (relevant.length) {
    console.log(
      `Building: ${relevant.length} file(s) changed since ${base.slice(0, 7)}, including ${relevant[0]}`
    )
    process.exit(1)
  }
  console.log(
    `Skipping: no change in ${[...watched].join(', ')} since ${base.slice(0, 7)}`
  )
  process.exit(0)
} catch (error) {
  console.log(
    `Building: could not compare commits (${String(error).split('\n')[0]})`
  )
  process.exit(1)
}
