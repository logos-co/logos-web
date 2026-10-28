# Basecamp release downloads

How `apps/web` resolves the Basecamp download links behind the install CTAs. The build-time half is [`packages/content/src/basecamp/releases.ts`](../../../packages/content/src/basecamp/releases.ts) and [`apps/web/scripts/sync-basecamp-release.ts`](../scripts/sync-basecamp-release.ts); the browser half is [`apps/web/lib/use-basecamp-install-link.ts`](../lib/use-basecamp-install-link.ts), [`apps/web/lib/basecamp-download-target.ts`](../lib/basecamp-download-target.ts) and [`apps/web/lib/basecamp-release-links.ts`](../lib/basecamp-release-links.ts).

## Build-time sync

Every web build runs `pnpm sync:basecamp-release` first, as part of `build:app`. The script queries GitHub's `releases/latest` API for `logos-co/logos-basecamp`, parses the release, and rewrites `apps/web/lib/data/basecamp-release.snapshot.json` with the four platform download URLs. `apps/web/constants/routes.ts` imports that snapshot and exposes the URLs as `EXTERNAL_URLS.basecampLinuxArm64Download` and the other three platform keys, so they are compiled into the bundle.

At runtime the `useBasecampInstallLink` hook detects the client's OS and CPU architecture and swaps the install CTA to the matching URL, falling back to `EXTERNAL_URLS.basecampRelease` for unknown or unsupported clients.

## Release parsing rules

[`releases.ts`](../../../packages/content/src/basecamp/releases.ts) rejects a release unless it is a published full version:

- Not a draft and not a prerelease. The tag must be a full `x.y.z` or `vx.y.z` version: RC tags and other hyphenated suffixes are rejected, while build metadata after `+` is allowed.
- Exactly one uploaded, non-empty asset per platform, with a name that starts with `LogosBasecamp-Desktop-` and ends in `-aarch64.AppImage`, `-x86_64.AppImage`, `-aarch64.dmg` or `-x86_64-setup.exe` (the `-x86_64-windows-setup.exe` form is also accepted).
- Each asset URL must point at that release's own tag.

If the API call fails or the release is rejected, the script exits non-zero and the build fails rather than reusing a stale snapshot. [`apps/web/turbo.json`](../turbo.json) marks the web build task uncached, so the refresh runs on every build.

## Platform and architecture resolution

[`basecamp-download-target.ts`](../lib/basecamp-download-target.ts) reads the OS and CPU architecture from the user agent and the high-entropy `User-Agent` hints, then returns one URL:

| Client         | URL                                        |
| -------------- | ------------------------------------------ |
| Linux arm64    | `EXTERNAL_URLS.basecampLinuxArm64Download` |
| Linux x86_64   | `EXTERNAL_URLS.basecampLinuxX64Download`   |
| macOS arm64    | `EXTERNAL_URLS.basecampMacArm64Download`   |
| Windows x86_64 | `EXTERNAL_URLS.basecampWindowsX64Download` |
| anything else  | `EXTERNAL_URLS.basecampRelease`            |

A CTA whose label names a platform sets a preferred platform. Labels are matched case-insensitively and may start with `Install `: `Linux` sets Linux, `Windows` sets Windows, and `Mac` or `MacOS`, optionally followed by ` (Silicon)` or ` (Apple silicon)`, sets macOS. A Windows preference resolves to `EXTERNAL_URLS.basecampWindowsX64Download` whatever OS the browser reports, unless the link is resolved with a `blockchain` purpose. For any other preference, if the browser reports a different OS, the CTA falls back to the release page instead of offering the wrong installer.

Windows x86_64 clients with a `blockchain` purpose get the WSL2 guide instead (`EXTERNAL_URLS.basecampWindowsBlockchainGuide`).

## Fallback and content flags

The fallback `EXTERNAL_URLS.basecampRelease` is `https://github.com/logos-co/logos-basecamp/releases/latest`, which follows new versions without edits. Content-level `external` flags on install CTAs cannot bypass the resolver: [`basecamp-release-links.ts`](../lib/basecamp-release-links.ts) rewrites any install CTA to the fallback before the download target is resolved. A CTA counts as an install CTA when its label names a platform as above, or when its label starts with `Install` or `Download` and it either sets `iconOverride: 'download'` or links into `https://github.com/logos-co/logos-basecamp`.

## GITHUB_TOKEN

The release query is unauthenticated by default. `GITHUB_TOKEN` (read through `apps/web/lib/env.ts`) is optional for public releases and worth setting on shared CI runners to avoid rate limits.

## When to switch to releases/latest/download

The sync pins the four URLs to one specific release. Switch them to the stable `https://github.com/logos-co/logos-basecamp/releases/latest/download/<asset>` form only once the Basecamp release workflow is active and all four files are verified on the latest full release. Until then those URLs return 404, including on PR previews.
