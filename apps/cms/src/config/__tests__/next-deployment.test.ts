import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const cmsRoot = process.cwd()
const buildEnvValidationScript = join(
  cmsRoot,
  'scripts/validate-production-build-env.ts'
)
const tsxLoader = join(cmsRoot, 'node_modules/tsx/dist/esm/index.mjs')

const importNextConfig = async (
  overrides: Record<string, string | undefined>
): Promise<{ stderr: string; stdout: string }> => {
  const env = { ...process.env }
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete env[key]
    } else {
      env[key] = value
    }
  }

  try {
    const { stderr, stdout } = await execFileAsync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        [
          "const { default: config } = await import('./next.config.mjs')",
          'console.log(JSON.stringify({ deploymentId: config.deploymentId ?? null }))',
        ].join('; '),
      ],
      {
        cwd: process.cwd(),
        env,
      }
    )
    return { stderr, stdout }
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'stderr' in error &&
      'stdout' in error
    ) {
      return {
        stderr: String(error.stderr),
        stdout: String(error.stdout),
      }
    }
    throw error
  }
}

const runBuildEnvValidation = async (
  overrides: Record<string, string | undefined>,
  cwd = cmsRoot
): Promise<{ stderr: string; stdout: string }> => {
  const env = { ...process.env }
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete env[key]
    } else {
      env[key] = value
    }
  }

  try {
    const { stderr, stdout } = await execFileAsync(
      process.execPath,
      ['--import', tsxLoader, buildEnvValidationScript],
      {
        cwd,
        env,
      }
    )
    return { stderr, stdout }
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'stderr' in error &&
      'stdout' in error
    ) {
      return {
        stderr: String(error.stderr),
        stdout: String(error.stdout),
      }
    }
    throw error
  }
}

describe('Next deployment configuration', () => {
  it('requires a stable Server Actions key for production builds', async () => {
    const result = await runBuildEnvValidation({
      DEPLOYMENT_VERSION: 'ci',
      NEXT_SERVER_ACTIONS_ENCRYPTION_KEY: undefined,
    })

    assert.match(
      result.stderr,
      /CMS production builds require NEXT_SERVER_ACTIONS_ENCRYPTION_KEY/
    )
  })

  it('accepts a stable Server Actions key without a deployment identifier', async () => {
    const result = await runBuildEnvValidation({
      DEPLOYMENT_VERSION: undefined,
      NEXT_DEPLOYMENT_ID: undefined,
      NEXT_SERVER_ACTIONS_ENCRYPTION_KEY: 'test-key',
      VERCEL_GIT_COMMIT_SHA: undefined,
    })

    assert.equal(result.stderr, '')
  })

  it('loads the stable Server Actions key from local env files', async () => {
    const fixtureDir = await mkdtemp(join(tmpdir(), 'logos-cms-env-'))

    try {
      await writeFile(
        join(fixtureDir, '.env'),
        'NEXT_SERVER_ACTIONS_ENCRYPTION_KEY="n7o/dx+local-test-key="\n'
      )

      const result = await runBuildEnvValidation(
        {
          NEXT_SERVER_ACTIONS_ENCRYPTION_KEY: undefined,
        },
        fixtureDir
      )

      assert.equal(result.stderr, '')
    } finally {
      await rm(fixtureDir, { force: true, recursive: true })
    }
  })

  it('does not configure a deployment id from environment variables', async () => {
    const result = await importNextConfig({
      DEPLOYMENT_VERSION: 'self-host-20260702',
      NEXT_SERVER_ACTIONS_ENCRYPTION_KEY: 'test-key',
      NODE_ENV: 'production',
      NEXT_DEPLOYMENT_ID: 'dpl_4qcQ6gQnY9YpyAFSWnXy9jVJsUy1',
      VERCEL_GIT_COMMIT_SHA: '5789cddea9cce53b639a79dfd5ccbc0eb19be56e',
    })

    assert.deepEqual(JSON.parse(result.stdout), { deploymentId: null })
  })
})

describe('self-host deployment environment wiring', () => {
  it('passes only the Server Actions key into the Docker build', async () => {
    const [composeFile, dockerfile, envExample, jenkinsfile] = await Promise.all([
      readFile('../../docker-compose.prod.yml', 'utf8'),
      readFile('Dockerfile', 'utf8'),
      readFile('.env.docker.example', 'utf8'),
      readFile('../../Jenkinsfile', 'utf8'),
    ])

    assert.match(
      composeFile,
      /NEXT_SERVER_ACTIONS_ENCRYPTION_KEY: \$\{NEXT_SERVER_ACTIONS_ENCRYPTION_KEY\}/
    )
    assert.doesNotMatch(composeFile, /DEPLOYMENT_VERSION/)
    assert.match(dockerfile, /ARG NEXT_SERVER_ACTIONS_ENCRYPTION_KEY/)
    assert.doesNotMatch(dockerfile, /ARG DEPLOYMENT_VERSION/)
    assert.match(
      dockerfile,
      /NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=\$\{NEXT_SERVER_ACTIONS_ENCRYPTION_KEY\}/
    )
    assert.doesNotMatch(jenkinsfile, /DEPLOYMENT_VERSION/)
    assert.match(envExample, /NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=/)
    assert.doesNotMatch(envExample, /DEPLOYMENT_VERSION/)
  })

  it('declares only the CMS Server Actions key for Turbo build tasks', async () => {
    const turboConfig = JSON.parse(
      await readFile('../../turbo.json', 'utf8')
    ) as { tasks: { build: { env: string[] } } }

    assert.ok(
      turboConfig.tasks.build.env.includes('NEXT_SERVER_ACTIONS_ENCRYPTION_KEY')
    )
    assert.deepEqual(
      [
        'DEPLOYMENT_VERSION',
        'NEXT_DEPLOYMENT_ID',
        'VERCEL_GIT_COMMIT_SHA',
      ].filter((name) => turboConfig.tasks.build.env.includes(name)),
      []
    )
  })
})
