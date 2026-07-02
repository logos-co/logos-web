import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { describe, it } from 'node:test'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

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
      ['--import', 'tsx', 'scripts/validate-production-build-env.ts'],
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

  it('uses the Vercel commit SHA as the deployment id', async () => {
    const result = await importNextConfig({
      NEXT_SERVER_ACTIONS_ENCRYPTION_KEY: 'test-key',
      NODE_ENV: 'production',
      NEXT_DEPLOYMENT_ID: undefined,
      VERCEL_GIT_COMMIT_SHA: 'abc123',
    })

    assert.deepEqual(JSON.parse(result.stdout), { deploymentId: 'abc123' })
  })

  it('uses the Vercel deployment id when Vercel provides one', async () => {
    const result = await importNextConfig({
      NEXT_DEPLOYMENT_ID: 'dpl_4qcQ6gQnY9YpyAFSWnXy9jVJsUy1',
      NEXT_SERVER_ACTIONS_ENCRYPTION_KEY: 'test-key',
      NODE_ENV: 'production',
      VERCEL_GIT_COMMIT_SHA: '5789cddea9cce53b639a79dfd5ccbc0eb19be56e',
    })

    assert.deepEqual(JSON.parse(result.stdout), {
      deploymentId: 'dpl_4qcQ6gQnY9YpyAFSWnXy9jVJsUy1',
    })
  })

  it('uses the self-host deployment version as the deployment id', async () => {
    const result = await importNextConfig({
      DEPLOYMENT_VERSION: 'self-host-20260702',
      NEXT_DEPLOYMENT_ID: undefined,
      NEXT_SERVER_ACTIONS_ENCRYPTION_KEY: 'test-key',
      NODE_ENV: 'production',
      VERCEL_GIT_COMMIT_SHA: undefined,
    })

    assert.deepEqual(JSON.parse(result.stdout), {
      deploymentId: 'self-host-20260702',
    })
  })
})

describe('self-host deployment environment wiring', () => {
  it('passes Server Actions and deployment identifiers into the Docker build', async () => {
    const [composeFile, dockerfile, envExample] = await Promise.all([
      readFile('../../docker-compose.prod.yml', 'utf8'),
      readFile('Dockerfile', 'utf8'),
      readFile('.env.docker.example', 'utf8'),
    ])

    assert.match(
      composeFile,
      /NEXT_SERVER_ACTIONS_ENCRYPTION_KEY: \$\{NEXT_SERVER_ACTIONS_ENCRYPTION_KEY\}/
    )
    assert.match(composeFile, /DEPLOYMENT_VERSION: \$\{DEPLOYMENT_VERSION/)
    assert.match(dockerfile, /ARG NEXT_SERVER_ACTIONS_ENCRYPTION_KEY/)
    assert.match(dockerfile, /ARG DEPLOYMENT_VERSION/)
    assert.match(
      dockerfile,
      /NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=\$\{NEXT_SERVER_ACTIONS_ENCRYPTION_KEY\}/
    )
    assert.match(envExample, /NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=/)
    assert.match(envExample, /DEPLOYMENT_VERSION=/)
  })

  it('declares CMS deployment env vars for Turbo build tasks', async () => {
    const turboConfig = JSON.parse(
      await readFile('../../turbo.json', 'utf8')
    ) as { tasks: { build: { env: string[] } } }

    assert.deepEqual(
      [
        'DEPLOYMENT_VERSION',
        'NEXT_DEPLOYMENT_ID',
        'NEXT_SERVER_ACTIONS_ENCRYPTION_KEY',
        'PAYLOAD_DB_CONNECTION_TIMEOUT_MS',
        'PAYLOAD_DB_IDLE_TIMEOUT_MS',
        'PAYLOAD_DB_POOL_MAX',
        'PAYLOAD_DB_QUERY_TIMEOUT_MS',
        'PAYLOAD_HEALTH_TIMEOUT_MS',
        'VERCEL_GIT_COMMIT_SHA',
      ].filter((name) => !turboConfig.tasks.build.env.includes(name)),
      []
    )
  })
})
