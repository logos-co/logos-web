import { describe, expect, it } from 'vitest'

import { EXTERNAL_URLS } from '@/constants/routes'
import { resolveBasecampDownloadTarget } from '@/lib/basecamp-download-target'

describe('resolveBasecampDownloadTarget', () => {
  it('selects the x86_64 AppImage for x86_64 Linux', () => {
    expect(
      resolveBasecampDownloadTarget({
        platform: 'Linux x86_64',
        preferredPlatform: 'linux',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
      })
    ).toBe(EXTERNAL_URLS.basecampLinuxX64Download)
  })

  it('selects the ARM64 AppImage for ARM64 Linux', () => {
    expect(
      resolveBasecampDownloadTarget({
        architecture: 'arm',
        bitness: '64',
        platform: 'Linux',
        preferredPlatform: 'linux',
      })
    ).toBe(EXTERNAL_URLS.basecampLinuxArm64Download)
  })

  it('selects the ARM64 DMG when high-entropy data identifies Apple Silicon', () => {
    expect(
      resolveBasecampDownloadTarget({
        architecture: 'arm',
        bitness: '64',
        platform: 'macOS',
        preferredPlatform: 'macos',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      })
    ).toBe(EXTERNAL_URLS.basecampMacArm64Download)
  })

  it('uses the release page for Intel macOS because no Intel DMG exists', () => {
    expect(
      resolveBasecampDownloadTarget({
        platform: 'MacIntel',
        preferredPlatform: 'macos',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      })
    ).toBe(EXTERNAL_URLS.basecampRelease)
  })

  it('uses the release page for Windows because no Windows asset exists', () => {
    expect(
      resolveBasecampDownloadTarget({
        architecture: 'x86',
        bitness: '64',
        platform: 'Windows',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      })
    ).toBe(EXTERNAL_URLS.basecampRelease)
  })

  it('uses the release page when the selected OS differs from the current OS', () => {
    expect(
      resolveBasecampDownloadTarget({
        architecture: 'x86',
        bitness: '64',
        platform: 'Windows',
        preferredPlatform: 'linux',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      })
    ).toBe(EXTERNAL_URLS.basecampRelease)
  })

  it('uses the release page when the platform or architecture is unknown', () => {
    expect(resolveBasecampDownloadTarget({})).toBe(
      EXTERNAL_URLS.basecampRelease
    )
  })
})
