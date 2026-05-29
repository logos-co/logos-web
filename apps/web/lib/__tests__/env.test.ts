import { afterEach, describe, expect, test, vi } from 'vitest'

const originalEnv = { ...process.env }

const loadEnv = async (values: Record<string, string | undefined>) => {
  vi.resetModules()
  process.env = { ...originalEnv }
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }
  return import('../env')
}

afterEach(() => {
  vi.resetModules()
  process.env = { ...originalEnv }
})

describe('env', () => {
  test('defaults NODE_ENV to development and keeps empty optional values undefined', async () => {
    const { env } = await loadEnv({
      NEXT_PUBLIC_ADMIN_ACID_API_URL: '',
      NEXT_PUBLIC_API_MODE: '',
      NEXT_PUBLIC_CMS_URL: '',
      NEXT_PUBLIC_SITE_URL: '',
      NEXT_PUBLIC_TAKE_ACTION_API_URL: '',
      NODE_ENV: '',
    })

    expect(env).toMatchObject({
      NODE_ENV: 'development',
      NEXT_PUBLIC_ADMIN_ACID_API_URL: undefined,
      NEXT_PUBLIC_API_MODE: undefined,
      NEXT_PUBLIC_CMS_URL: undefined,
      NEXT_PUBLIC_SITE_URL: undefined,
      NEXT_PUBLIC_TAKE_ACTION_API_URL: undefined,
    })
  })

  test('accepts production API mode for metadata indexing gates', async () => {
    const { env } = await loadEnv({
      NEXT_PUBLIC_API_MODE: 'production',
      NODE_ENV: 'production',
    })

    expect(env.NODE_ENV).toBe('production')
    expect(env.NEXT_PUBLIC_API_MODE).toBe('production')
  })

  test('rejects invalid enum values at import time', async () => {
    await expect(
      loadEnv({
        NEXT_PUBLIC_API_MODE: 'prod',
        NODE_ENV: 'production',
      })
    ).rejects.toThrow(/NEXT_PUBLIC_API_MODE="prod" is invalid/)
  })
})
