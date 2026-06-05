# AGENTS.md

Guidance for agents working inside `apps/web`. The root `AGENTS.md` still applies; this file adds web-app-specific instructions for the nearest subtree.

## App Role

This is the public Next.js 16 site. It uses Tailwind v4, `next-intl`, and static export. The dev server runs on port `3000`.

The app reads `content/**` at build time. Do not add request-time GitHub API calls or runtime CMS dependencies to the public site.

## Commands

Run from the repo root unless a task explicitly needs the app directory:

```bash
pnpm --filter web dev
pnpm --filter web build
pnpm --filter web start
pnpm --filter web lint
pnpm --filter web check-types
pnpm --filter web test
```

`pnpm --filter web start` serves the static `out/` directory with `python3 -m http.server`; do not use `next start` for this app.

## Code Organization

- Routes live under `app/[locale]/<route>/`.
- Section components live under `components/sections/<section>/`.
- Shared, reusable UI should move to `@acid-info/logos-ui` when it belongs outside this app.
- Use `lib/env.ts` for environment access; do not read `process.env` directly from feature code.
- Keep Vitest tests beside the code in `__tests__/` folders.

### One section per file (required)

Never put multiple page sections in a single file. Each top-level page
section (hero, a feature band, a CTA strip, etc. — typically one `<section>`)
gets its own file.

- For a route, put sections in `app/[locale]/<route>/_sections/<section>.tsx`
  (kebab-case, one exported section component per file).
- The page/route composes them in a thin orchestrator that only imports the
  sections and arranges them — it should contain no section markup itself.
- Put shared copy/prop types in `_sections/types.ts` and shared presentational
  helpers in `_sections/atoms.tsx`; import them into each section.
- Rule of thumb: if a section file approaches ~200 lines or defines a second
  `<section>`, split it. Section files over ~400 lines are a smell.

Example: `app/[locale]/lambda-prize/_sections/` — `hero.tsx`,
`how-it-works.tsx`, `featured-prizes.tsx`, `about-programme.tsx`, `support.tsx`,
`types.ts`, `atoms.tsx`, with `lambda-prize-page.tsx` as the orchestrator.

## i18n and Content

- UI chrome belongs in `messages/<locale>.json` and must be accessed with `next-intl`.
- Page copy and structured data belong in `content/**`, loaded through `@repo/content`.
- User-facing strings, including metadata text, labels, titles, and descriptions, must use i18n keys or content files.
- Adding a locale in `i18n/routing.ts` makes its message and content files required at build time.

## Frontend Verification

For UI changes, read the relevant docs in `docs/web-pages.md` or `docs/components.md`, run the dev server, and verify the result in a browser before reporting done.

When working on sections that embed a full-bleed or frame-fitted image (aspect-ratio containers, `fill` images, breakpoint-derived heights), follow the pattern documented in `docs/responsive-image-frame-fitting.md`.

Do not add UI implementation contract tests for Tailwind class strings, Figma measurements, layout spacing, motion details, hover treatment, or component source structure. These tests churn during active UI iteration and should be replaced with browser verification or durable behavioural tests only.

After static builds, keep the default-locale stripping step intact: `scripts/strip-default-locale-prefix.sh`.
