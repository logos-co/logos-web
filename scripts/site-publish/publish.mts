import { execFileSync } from 'node:child_process'
import { cp, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'

const branch = process.env.DEPLOY_BRANCH
if (branch !== 'deploy-develop' && branch !== 'deploy-master')
  throw new Error('Invalid deployment branch')
const siteUrl = process.env.SITE_URL
if (
  siteUrl !==
  (branch === 'deploy-master' ? 'https://logos.co' : 'https://dev.logos.co')
)
  throw new Error('The deployment branch and site URL do not match')

const token = process.env.SITE_PUBLISH_TOKEN
if (!token) throw new Error('The publishing App token is required')
const git = (args: string[], cwd?: string): string =>
  execFileSync('git', args, {
    cwd,
    env: {
      ...process.env,
      GIT_CONFIG_COUNT: '1',
      GIT_CONFIG_KEY_0: 'http.https://github.com/.extraheader',
      GIT_CONFIG_VALUE_0: `AUTHORIZATION: basic ${Buffer.from(`x-access-token:${token}`).toString('base64')}`,
    },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()

// Keep the short-lived App token out of Git URLs, arguments and configuration files.
git(['fetch', 'origin', `${branch}:refs/remotes/origin/${branch}`])
const previous = git(['rev-parse', `refs/remotes/origin/${branch}`])
const directory = await mkdtemp(resolve(tmpdir(), 'logos-site-publish-'))
const output = resolve('apps/web/out')
await readFile(resolve(output, 'index.html'))
await cp(output, directory, { recursive: true })
await writeFile(resolve(directory, 'CNAME'), new URL(siteUrl).hostname + '\n')
await writeFile(resolve(directory, '.nojekyll'), '')
await writeFile(
  resolve(directory, 'site-publish.json'),
  JSON.stringify({
    runId: Number(process.env.GITHUB_RUN_ID),
    sourceSha: git(['rev-parse', 'HEAD']),
    previewRunId: process.env.PREVIEW_BUILD
      ? Number(process.env.PREVIEW_BUILD)
      : null,
  }) + '\n'
)
git(['init', '--quiet'], directory)
git(['config', 'user.name', 'github-actions[bot]'], directory)
git(
  [
    'config',
    'user.email',
    '41898282+github-actions[bot]@users.noreply.github.com',
  ],
  directory
)
git(['add', '--all'], directory)
const tree = git(['write-tree'], directory)
// Use the main checkout's object store so the commit is a fast-forward on the current deployment.
const objects = git(['rev-parse', '--git-path', 'objects'])
await cp(resolve(directory, '.git/objects'), resolve(objects), {
  recursive: true,
})
const commit = git([
  '-c',
  'user.name=github-actions[bot]',
  '-c',
  'user.email=41898282+github-actions[bot]@users.noreply.github.com',
  'commit-tree',
  tree,
  '-p',
  previous,
  '-m',
  `Publish site from run ${process.env.GITHUB_RUN_ID}`,
])
// A competing Jenkins or Actions publish makes this push fail rather than overwrite its output.
git(['push', 'origin', `${commit}:refs/heads/${branch}`])
