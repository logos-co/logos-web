# Basecamp release downloads

How `apps/web` resolves the Basecamp download links for the install CTAs. Covers
[`packages/content/src/basecamp/releases.ts`](../../../packages/content/src/basecamp/releases.ts),
[`apps/web/scripts/sync-basecamp-release.ts`](../scripts/sync-basecamp-release.ts),
[`apps/web/lib/use-basecamp-install-link.ts`](../lib/use-basecamp-install-link.ts),
[`apps/web/lib/basecamp-download-target.ts`](../lib/basecamp-download-target.ts)
and [`apps/web/lib/basecamp-release-links.ts`](../lib/basecamp-release-links.ts).

## The pipeline

Every web build runs `pnpm sync:basecamp-release` first (part of `build:app`).
The script queries GitHub's `releases/latest` API for
`logos-co/logos-basecamp`, parses the release, and rewrites
`apps/web/lib/data/basecamp-release.snapshot.json` with the four platform
download URLs. `apps/web/constants/routes.ts` imports that snapshot and exposes
them as `EXTERNAL_URLS.basecampLinuxArm64Download` and the other three platform
keys, which are baked into the bundle at compile time.

At runtime the `useBasecampInstallLink` hook detects the client's OS and CPU
architecture and swaps the install CTA to the matching platform URL, falling
back to `EXTERNAL_URLS.basecampRelease` for unknown or unsupported clients.

## Release parsing rules

[`releases.ts`](../../../packages/content/src/basecamp/releases.ts) rejects a
release unless it is a published full version:

- Not a draft and not a prerelease. The tag must be a full `x.y.z` or `vx.y.z`
  version: RC tags and other hyphenated suffixes are rejected, while build
  metadata after `+` is allowed.
- Exactly one uploaded, non-empty asset per platform, matched by name:
  `-aarch64.AppImage`, `-x86_64.AppImage`, `-aarch64.dmg`, and
  `-x86_64-setup.exe` (the `-x86_64-windows-setup.exe` form is also accepted).
- Each asset URL must point at that release's own tag.

If the API call fails or the release is rejected, the script exits non-zero and
the build fails rather than reusing a stale snapshot. The web build task is
uncached in [`apps/web/turbo.json`](../turbo.json), so this refresh runs on
every build.

## Platform and architecture resolution

[`basecamp-download-target.ts`](../lib/basecamp-download-target.ts) detects the
client's OS and CPU architecture from its user agent (including high-entropy
`User-Agent` hints) and returns the matching URL:

| Client         | URL                                        |
| -------------- | ------------------------------------------ |
| Linux arm64    | `EXTERNAL_URLS.basecampLinuxArm64Download` |
| Linux x86_64   | `EXTERNAL_URLS.basecampLinuxX64Download`   |
| macOS arm64    | `EXTERNAL_URLS.basecampMacArm64Download`   |
| Windows x86_64 | `EXTERNAL_URLS.basecampWindowsX64Download` |
| anything else  | `EXTERNAL_URLS.basecampRelease`            |

Windows x86_64 clients with a `blockchain` purpose get the WSL2 guide instead
(`EXTERNAL_URLS.basecampWindowsBlockchainGuide`).

## Fallback and content flags

The fallback `EXTERNAL_URLS.basecampRelease` is
`https://github.com/logos-co/logos-basecamp/releases/latest`, which follows new
versions without edits. Content-level `external` flags on install CTAs cannot
bypass the resolver: [`basecamp-release-links.ts`](../lib/basecamp-release-links.ts)
rewrites any install CTA to the fallback before the download target is resolved.

## GITHUB_TOKEN

The release query is unauthenticated by default. `GITHUB_TOKEN` (read through
`apps/web/lib/env.ts`) is optional for public releases and recommended on
shared CI runners to avoid rate limits.

## When to switch to releases/latest/download

The parser uses the GitHub releases API because the asset names are not stable
yet. Switch the four URLs to stable
`https://github.com/logos-co/logos-basecamp/releases/latest/download/<asset>`
names only once the Basecamp release workflow is active and all four files are
verified on the latest full release. Until then those URLs return 404,
including on PR previews.
