import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  fetchBasecampReleaseDownloads,
  parseBasecampReleaseDownloads,
} from '../releases'

function releaseFixture(tag = '0.3.2', windowsSuffix = 'x86_64-setup.exe') {
  const names = [
    `LogosBasecamp-Desktop-v${tag}-f2fae6-aarch64.AppImage`,
    `LogosBasecamp-Desktop-v${tag}-f2fae6-x86_64.AppImage`,
    `LogosBasecamp-Desktop-v${tag}-f2fae6-aarch64.dmg`,
    `LogosBasecamp-Desktop-v${tag}-f2fae6-${windowsSuffix}`,
  ]
  return {
    tag_name: tag,
    draft: false,
    prerelease: false,
    assets: names.map((name) => ({
      name,
      browser_download_url: `https://github.com/logos-co/logos-basecamp/releases/download/${tag}/${name}`,
      state: 'uploaded',
      size: 1024,
    })),
  }
}

describe('Basecamp release downloads', () => {
  it('uses the actual asset URLs for all four platforms from one full release', () => {
    const release = releaseFixture()
    const result = parseBasecampReleaseDownloads(release)
    assert.equal(result.tag, '0.3.2')
    assert.deepEqual(
      Object.values(result.downloads),
      release.assets.map((asset) => asset.browser_download_url)
    )
  })

  it('accepts the previous Windows filename without constructing an installer URL', () => {
    const release = releaseFixture('0.3.1', 'x86_64-windows-setup.exe')
    assert.equal(
      parseBasecampReleaseDownloads(release).downloads.windowsX64,
      release.assets[3]!.browser_download_url
    )
  })

  for (const overrides of [
    { draft: true },
    { prerelease: true },
    { tag_name: '0.3.3-rc.1' },
    { tag_name: 'v0.3.3-beta.2' },
    { tag_name: 'pre-release-f2fae63-1239' },
  ]) {
    it(`rejects non-full releases even if GitHub's flags are wrong: ${JSON.stringify(overrides)}`, () => {
      assert.throws(
        () =>
          parseBasecampReleaseDownloads({ ...releaseFixture(), ...overrides }),
        /published full version/
      )
    })
  }

  it('rejects an incomplete release rather than mixing old and new platform URLs', () => {
    const release = releaseFixture()
    assert.throws(
      () =>
        parseBasecampReleaseDownloads({
          ...release,
          assets: release.assets.slice(0, 3),
        }),
      /windowsX64.*found 0/
    )
  })

  it('rejects ambiguous platform assets', () => {
    const release = releaseFixture()
    assert.throws(
      () =>
        parseBasecampReleaseDownloads({
          ...release,
          assets: [...release.assets, release.assets[0]],
        }),
      /linuxArm64.*found 2/
    )
  })

  it('rejects unfinished and empty downloads', () => {
    const release = releaseFixture()
    for (const overrides of [{ state: 'starter' }, { size: 0 }]) {
      assert.throws(
        () =>
          parseBasecampReleaseDownloads({
            ...release,
            assets: release.assets.map((asset, index) =>
              index === 0 ? { ...asset, ...overrides } : asset
            ),
          }),
        /linuxArm64.*found 0/
      )
    }
  })

  it('rejects URLs from another release or host', () => {
    const release = releaseFixture()
    for (const url of [
      release.assets[0]!.browser_download_url.replace('/0.3.2/', '/0.3.1/'),
      'https://example.com/installer',
    ]) {
      assert.throws(
        () =>
          parseBasecampReleaseDownloads({
            ...release,
            assets: release.assets.map((asset, index) =>
              index === 0 ? { ...asset, browser_download_url: url } : asset
            ),
          }),
        /does not belong/
      )
    }
  })

  it('rejects malformed API responses', () => {
    assert.throws(() =>
      parseBasecampReleaseDownloads({ message: 'API rate limit exceeded' })
    )
  })

  it('queries latest without caching and can authenticate only the build request', async () => {
    const fetcher: typeof fetch = async (input, init) => {
      assert.equal(
        input,
        'https://api.github.com/repos/logos-co/logos-basecamp/releases/latest'
      )
      assert.equal(init?.cache, 'no-store')
      assert.equal(
        new Headers(init?.headers).get('Authorization'),
        'Bearer test-token'
      )
      assert.ok(init?.signal)
      return Response.json(releaseFixture())
    }
    const result = await fetchBasecampReleaseDownloads({
      token: 'test-token',
      fetcher,
    })
    assert.equal(result.tag, '0.3.2')
    assert.ok(!JSON.stringify(result).includes('test-token'))
  })

  it('supports unauthenticated public release queries', async () => {
    const fetcher: typeof fetch = async (_input, init) => {
      assert.equal(new Headers(init?.headers).get('Authorization'), null)
      return Response.json(releaseFixture())
    }
    assert.equal(
      (await fetchBasecampReleaseDownloads({ fetcher })).tag,
      '0.3.2'
    )
  })

  it('fails on HTTP and network errors instead of reusing a previous release', async () => {
    const forbidden: typeof fetch = async () =>
      new Response(null, { status: 403 })
    await assert.rejects(
      fetchBasecampReleaseDownloads({ fetcher: forbidden }),
      /HTTP 403/
    )
    const unavailable: typeof fetch = async () => {
      throw new Error('network unavailable')
    }
    await assert.rejects(
      fetchBasecampReleaseDownloads({ fetcher: unavailable }),
      /network unavailable/
    )
  })
})
