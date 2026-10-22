# apps/web

Rules for agents working in `apps/web`. The root `AGENTS.md` also applies.

## Role

The public Next.js 16 site: Tailwind v4, `next-intl`, static export, dev server on port 3000. It reads `content/**` at build time, so never add request-time GitHub API or CMS calls to a public page.

## Commands

From the repo root:

```bash
pnpm dev:web
pnpm turbo run build --filter=web
pnpm --filter web start
pnpm --filter web lint
pnpm --filter web check-types
pnpm --filter web test
```

Build through turbo, never `pnpm --filter web build`: `@acid-info/logos-ui` must build first and only the turbo orchestrator does that. Vercel and Jenkins run the turbo command. `pnpm --filter web start` serves `out/` with `python3 -m http.server`; never use `next start` for this app.

## Rules

- Every build refreshes the four Basecamp download URLs from the latest full GitHub release. Reject drafts, prereleases and RC tags, fail the build rather than reuse a stale snapshot, and keep the web build task uncached in `apps/web/turbo.json`. [docs/basecamp-release.md](docs/basecamp-release.md) has the parsing rules.
- Unknown or unsupported clients fall back to `EXTERNAL_URLS.basecampRelease`. A content-level `external` flag must never bypass the resolver.
- Don't move the four download URLs to `releases/latest/download/` until the Basecamp release workflow is live and all four assets are verified on the latest full release. Until then those URLs return 404, PR previews included.
- Read env through `lib/env.ts`; add new variables there, not in feature code.
- Locales come from `i18n/routing.ts`. UI chrome lives in `messages/<locale>.json`; page copy and structured data live in `content/**`. Every user-facing string goes through an i18n key or a content file.
- `scripts/strip-default-locale-prefix.sh` runs after `next build` and strips the default locale prefix from the export. Don't bypass it.
- Put each page section in `app/[locale]/<route>/_sections/<section>.tsx` and keep the page file a thin composition with no section markup. Split a section file once it nears 200 lines.
- Vitest tests sit beside the code in `__tests__/`. Don't assert Tailwind classes, Figma measurements or source structure; verify UI in a browser.

## Caveats

- A locale added to `routing.ts` makes its message and content files required at build time. There is no silent fallback.

## Docs

- [docs/basecamp-release.md](docs/basecamp-release.md): Basecamp download resolution and release parsing
- [docs/media-calendar.md](docs/media-calendar.md): the `/media/calendar` page
- [docs/fonts.md](docs/fonts.md): self-hosted and Google fonts
- [docs/README.md](docs/README.md): index of the docs in this app
