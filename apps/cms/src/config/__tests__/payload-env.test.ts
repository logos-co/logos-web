import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { describe, it } from 'node:test'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const importPayloadConfig = async (
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
    await execFileAsync(
      process.execPath,
      ['--import', 'tsx', '-e', "await import('./payload.config.ts')"],
      {
        cwd: process.cwd(),
        env,
      }
    )
    return { stderr: '', stdout: '' }
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

describe('Payload production env guard', () => {
  it('refuses self-hosted production without an explicit CMS origin', async () => {
    const result = await importPayloadConfig({
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/logos',
      NEXT_PUBLIC_SERVER_URL: undefined,
      NEXT_PUBLIC_WEB_URL: 'https://logos.co',
      NODE_ENV: 'production',
      PAYLOAD_SECRET: 'test-secret',
      VERCEL: undefined,
      VERCEL_URL: undefined,
    })

    assert.match(result.stderr, /NEXT_PUBLIC_SERVER_URL is required/)
  })

  it('refuses self-hosted production without an explicit web origin', async () => {
    const result = await importPayloadConfig({
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/logos',
      NEXT_PUBLIC_SERVER_URL: 'https://cms.logos.co',
      NEXT_PUBLIC_WEB_URL: undefined,
      NODE_ENV: 'production',
      PAYLOAD_SECRET: 'test-secret',
      VERCEL: undefined,
      VERCEL_URL: undefined,
    })

    assert.match(result.stderr, /NEXT_PUBLIC_WEB_URL is required/)
  })
})
