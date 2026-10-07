import { z } from 'zod'

const RELEASES_URL =
  'https://api.github.com/repos/logos-co/logos-basecamp/releases/latest'
const DOWNLOAD_ROOT =
  'https://github.com/logos-co/logos-basecamp/releases/download/'
const FULL_VERSION =
  /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:\+[\da-zA-Z.-]+)?$/

const releaseSchema = z.object({
  tag_name: z.string(),
  draft: z.boolean(),
  prerelease: z.boolean(),
  assets: z.array(
    z.object({
      name: z.string(),
      browser_download_url: z.string().url(),
      state: z.string(),
      size: z.number().int().nonnegative(),
    })
  ),
})

const PLATFORM_ASSETS = {
  linuxArm64: /-aarch64\.AppImage$/,
  linuxX64: /-x86_64\.AppImage$/,
  macArm64: /-aarch64\.dmg$/,
  windowsX64: /-x86_64-(?:windows-)?setup\.exe$/,
} as const

export interface BasecampReleaseDownloads {
  readonly tag: string
  readonly downloads: {
    readonly linuxArm64: string
    readonly linuxX64: string
    readonly macArm64: string
    readonly windowsX64: string
  }
}

export interface FetchBasecampReleaseOptions {
  readonly token?: string
  readonly fetcher?: typeof fetch
}

export function parseBasecampReleaseDownloads(
  payload: unknown
): BasecampReleaseDownloads {
  const release = releaseSchema.parse(payload)
  if (
    release.draft ||
    release.prerelease ||
    !FULL_VERSION.test(release.tag_name)
  ) {
    throw new Error('Latest Basecamp release must be a published full version')
  }

  function assetUrl(platform: keyof typeof PLATFORM_ASSETS): string {
    const matches = release.assets.filter(
      (asset) =>
        asset.name.startsWith('LogosBasecamp-Desktop-') &&
        PLATFORM_ASSETS[platform].test(asset.name) &&
        asset.state === 'uploaded' &&
        asset.size > 0
    )
    if (matches.length !== 1) {
      throw new Error(
        `Basecamp ${release.tag_name} must have exactly one ${platform} download; found ${matches.length}`
      )
    }
    const asset = matches[0]!
    const expectedUrl = `${DOWNLOAD_ROOT}${encodeURIComponent(release.tag_name)}/${encodeURIComponent(asset.name)}`
    if (asset.browser_download_url !== expectedUrl) {
      throw new Error(
        `Basecamp ${platform} download does not belong to ${release.tag_name}`
      )
    }
    return asset.browser_download_url
  }

  return {
    tag: release.tag_name,
    downloads: {
      linuxArm64: assetUrl('linuxArm64'),
      linuxX64: assetUrl('linuxX64'),
      macArm64: assetUrl('macArm64'),
      windowsX64: assetUrl('windowsX64'),
    },
  }
}

export async function fetchBasecampReleaseDownloads({
  token,
  fetcher = fetch,
}: FetchBasecampReleaseOptions = {}): Promise<BasecampReleaseDownloads> {
  // GitHub excludes drafts and prereleases here; parsing also rejects RC tags
  // whose release flags have been set incorrectly.
  const response = await fetcher(RELEASES_URL, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  })
  if (!response.ok) {
    throw new Error(
      `Unable to fetch latest Basecamp release: HTTP ${response.status}`
    )
  }
  return parseBasecampReleaseDownloads(await response.json())
}
