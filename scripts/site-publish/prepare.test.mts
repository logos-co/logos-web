import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { it } from 'node:test'

const script = fileURLToPath(new URL('./prepare.mts', import.meta.url))
const stagingSha = 'a'.repeat(40)
const liveSha = 'b'.repeat(40)

const prepare = (environment: string, markerRun = 42, expired = false) => {
  const directory = mkdtempSync(resolve(tmpdir(), 'logos-prepare-test-'))
  const event = resolve(directory, 'event.json')
  const output = resolve(directory, 'output.txt')
  const mock = resolve(directory, 'github.mjs')
  const run = {
    id: 42,
    display_title: 'Site publish: dev',
    status: 'completed',
    conclusion: 'success',
    path: '.github/workflows/site-publish.yml',
    head_branch: 'develop',
    event: 'repository_dispatch',
  }
  const responses = {
    'git/ref/heads/deploy-develop': { object: { sha: stagingSha } },
    'git/ref/heads/deploy-master': { object: { sha: liveSha } },
    'actions/runs/42': run,
    'actions/workflows/site-publish.yml/runs?branch=develop&per_page=100': {
      workflow_runs: [run],
    },
    'actions/runs/42/artifacts?per_page=100': {
      artifacts: [
        { name: 'press-snapshot', expired, expires_at: '2099-01-01' },
      ],
    },
    [`contents/site-publish.json?ref=${stagingSha}`]: {
      content: Buffer.from(JSON.stringify({ runId: markerRun })).toString(
        'base64'
      ),
    },
  }
  writeFileSync(
    event,
    JSON.stringify({ client_payload: { environment, previewBuild: 42 } })
  )
  writeFileSync(
    mock,
    `
    const responses = ${JSON.stringify(responses)};
    globalThis.fetch = async (url) => {
      const prefix = 'https://api.github.com/repos/example/site/';
      if (!url.startsWith(prefix)) throw new Error('Unexpected network request');
      const path = url.slice(prefix.length);
      if (!(path in responses)) throw new Error('Unexpected API endpoint');
      return Response.json(responses[path]);
    };
  `
  )
  const result = spawnSync(process.execPath, ['--import', mock, script], {
    env: {
      ...process.env,
      GITHUB_REPOSITORY: 'example/site',
      GITHUB_TOKEN: 'local-test-token',
      GITHUB_EVENT_PATH: event,
      GITHUB_OUTPUT: output,
    },
    encoding: 'utf8',
  })
  return { result, output }
}

it('captures the deployment baseline before staging builds', () => {
  const { result, output } = prepare('dev')
  assert.equal(result.status, 0, result.stderr)
  const values = readFileSync(output, 'utf8')
  assert.match(values, /source_ref=develop\n/)
  assert.match(values, new RegExp(`deploy_baseline=${stagingSha}\n`))
})

it('uses master source and freezes the reviewed staging deployment for live', () => {
  const { result, output } = prepare('production')
  assert.equal(result.status, 0, result.stderr)
  const values = readFileSync(output, 'utf8')
  assert.match(values, /source_ref=master\n/)
  assert.match(values, new RegExp(`deploy_baseline=${liveSha}\n`))
  assert.match(values, new RegExp(`staging_baseline=${stagingSha}\n`))
  assert.match(values, /preview_build=42\n/)
})

it('rejects a replaced staging deployment or expired snapshot before building live', () => {
  const replaced = prepare('production', 43).result
  assert.match(replaced.stderr, /Staging has changed/)
  assert.notEqual(replaced.status, 0)
  const { result } = prepare('production', 42, true)
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /snapshot has expired/)
})
