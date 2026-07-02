import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { describe, it } from 'node:test'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const CMS_COLLECTION_SLUGS = [
  'users',
  'media',
  'pages',
  'builder-hub-settings',
  'builder-listing-settings',
  'site-settings-content',
  'site-navigation-content',
  'site-footer-content',
  'rfps',
  'ideas',
  'builder-resources',
  'circles',
  'circle-events',
  'circle-initiatives',
  'circle-resources',
  'content-change-requests',
] as const

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

const readPayloadCollections = async (): Promise<
  Array<{ lockDocuments?: false | { duration: number }; slug: string }>
> => {
  const { stdout } = await execFileAsync(
    process.execPath,
    [
      '--import',
      'tsx',
      '-e',
      [
        "const { default: configPromise } = await import('./payload.config.ts')",
        'const config = await configPromise',
        'console.log(JSON.stringify(config.collections.map(({ slug, lockDocuments }) => ({ slug, lockDocuments }))))',
      ].join('; '),
    ],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/logos',
        NODE_ENV: 'development',
        PAYLOAD_SECRET: 'test-secret',
      },
    }
  )

  return JSON.parse(stdout) as Array<{
    lockDocuments?: false | { duration: number }
    slug: string
  }>
}

const readPayloadRuntimeURLs = async (
  overrides: Record<string, string | undefined>
): Promise<{ csrf: string[]; serverURL: string }> => {
  const env = { ...process.env }
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete env[key]
    } else {
      env[key] = value
    }
  }

  const { stdout } = await execFileAsync(
    process.execPath,
    [
      '--import',
      'tsx',
      '-e',
      [
        "const { default: configPromise } = await import('./payload.config.ts')",
        'const config = await configPromise',
        'console.log(JSON.stringify({ csrf: config.csrf, serverURL: config.serverURL }))',
      ].join('; '),
    ],
    {
      cwd: process.cwd(),
      env,
    }
  )

  return JSON.parse(stdout) as { csrf: string[]; serverURL: string }
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

  it('uses the Vercel branch URL for preview deployments', async () => {
    const runtimeURLs = await readPayloadRuntimeURLs({
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/logos',
      NEXT_PUBLIC_SERVER_URL: 'https://stale-preview.vercel.app',
      NEXT_PUBLIC_WEB_URL: 'https://logos.co',
      NODE_ENV: 'production',
      PAYLOAD_SECRET: 'test-secret',
      VERCEL: '1',
      VERCEL_BRANCH_URL:
        'logos-co-cms-git-codex-fix-cms-server-actions-status-im-web.vercel.app',
      VERCEL_ENV: 'preview',
      VERCEL_URL: 'logos-co-cms-unique-hash-status-im-web.vercel.app',
    })

    assert.equal(
      runtimeURLs.serverURL,
      'https://logos-co-cms-git-codex-fix-cms-server-actions-status-im-web.vercel.app'
    )
    assert.equal(runtimeURLs.csrf.includes(runtimeURLs.serverURL), true)
    assert.equal(
      runtimeURLs.csrf.includes('https://stale-preview.vercel.app'),
      false
    )
  })

  it('keeps the explicit CMS origin for Vercel production deployments', async () => {
    const runtimeURLs = await readPayloadRuntimeURLs({
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/logos',
      NEXT_PUBLIC_SERVER_URL: 'https://cms.logos.co',
      NEXT_PUBLIC_WEB_URL: 'https://logos.co',
      NODE_ENV: 'production',
      PAYLOAD_SECRET: 'test-secret',
      VERCEL: '1',
      VERCEL_BRANCH_URL: 'logos-co-cms-git-main-status-im-web.vercel.app',
      VERCEL_ENV: 'production',
      VERCEL_URL: 'logos-co-cms-unique-hash-status-im-web.vercel.app',
    })

    assert.equal(runtimeURLs.serverURL, 'https://cms.logos.co')
  })
})

describe('Payload admin document locking', () => {
  it('keeps the editable CMS collection list covered by the lock guard', async () => {
    const collections = await readPayloadCollections()
    const actualEditableSlugs = collections.map((collection) => collection.slug)

    assert.deepEqual(actualEditableSlugs, [
      ...CMS_COLLECTION_SLUGS,
      'payload-kv',
      'payload-preferences',
      'payload-migrations',
    ])
  })

  it('disables document locking for every editable CMS collection', async () => {
    const collections = await readPayloadCollections()
    const editableCollections = collections.filter((collection) =>
      CMS_COLLECTION_SLUGS.includes(
        collection.slug as (typeof CMS_COLLECTION_SLUGS)[number]
      )
    )

    assert.equal(editableCollections.length, CMS_COLLECTION_SLUGS.length)

    for (const collection of editableCollections) {
      assert.equal(
        collection.lockDocuments,
        false,
        `${collection.slug} must not run Payload document lock queries`
      )
    }
  })

  it('does not register Payload locked-documents internals', async () => {
    const collections = await readPayloadCollections()
    const slugs = collections.map((collection) => collection.slug)

    assert.equal(slugs.includes('payload-locked-documents'), false)
  })
})
