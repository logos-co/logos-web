# AGENTS.md

Rules for agents working in `apps/web`. The root `AGENTS.md` also applies.

## Role

The public Next.js 16 site: Tailwind v4, `next-intl`, static export. Dev server
on port `3000`. It reads `content/**` at build time; never add request-time
GitHub API or CMS calls to the public site.

## Commands

Run from the repo root:

    pnpm --filter web dev
    pnpm turbo run build --filter=web
    pnpm --filter web start
    pnpm --filter web lint
    pnpm --filter web check-types
    pnpm --filter web test

Build through turbo, never `pnpm --filter web build`: `@acid-info/logos-ui` must
build first and only the turbo orchestrator does that. Vercel and Jenkins both
run the turbo command.

`pnpm --filter web start` serves the static `out/` directory with
`python3 -m http.server`. Never use `next start` for this app.

## Rules

- Every build refreshes all four Basecamp download URLs from GitHub's latest
  full release before compiling. Reject drafts, prereleases and RC tags; fail
  the build rather than reuse a stale snapshot; keep the web build uncached in
  Turbo. See [docs/basecamp-release.md](docs/basecamp-release.md).
- Unknown or unsupported clients fall back to `EXTERNAL_URLS.basecampRelease`.
  Content-level `external` flags must never bypass the resolver.
- Only switch to `releases/latest/download/` URLs once the Basecamp release
  workflow is active and all four files are verified on the latest full
  release; until then those URLs return 404, including on PR previews.
- Read env through `lib/env.ts`; never reach into `process.env` from feature
  code. Add new vars to `env.ts`.
- Active locales come from `i18n/routing.ts`. UI chrome lives in
  `messages/<locale>.json`; page copy and structured data live in `content/**`.
  All user-facing strings go through i18n keys or content files.
- After `next build`, `scripts/strip-default-locale-prefix.sh` strips the
  default locale prefix from the export. Do not bypass it.
- One section per file: each page section lives in
  `app/[locale]/<route>/_sections/<section>.tsx`, composed by a thin page that
  holds no section markup. Split a section file once it nears 200 lines.
- Keep Vitest tests beside the code in `__tests__/`. Do not add tests that
  assert Tailwind classes, Figma measurements or source structure; verify UI in
  a browser instead.

## Caveats

- A locale added to `routing.ts` makes its message and content files required
  at build time; there is no silent fallback.

## Docs

- [docs/basecamp-release.md](docs/basecamp-release.md): Basecamp download
  resolution and release parsing.
- [docs/media-calendar.md](docs/media-calendar.md): the `/media/calendar` page.
- [docs/fonts.md](docs/fonts.md): self-hosted and Google fonts.
- [docs/README.md](docs/README.md): index of the docs in this app.
