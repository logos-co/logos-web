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
- Shared, reusable UI should move to `@repo/ui` when it belongs outside this app.
- Use `lib/env.ts` for environment access; do not read `process.env` directly from feature code.
- Keep Vitest tests beside the code in `__tests__/` folders.

## i18n and Content

- UI chrome belongs in `messages/<locale>.json` and must be accessed with `next-intl`.
- Page copy and structured data belong in `content/**`, loaded through `@repo/content`.
- User-facing strings, including metadata text, labels, titles, and descriptions, must use i18n keys or content files.
- Adding a locale in `i18n/routing.ts` makes its message and content files required at build time.

## Frontend Verification

For UI changes, read the relevant docs in `docs/web-pages.md` or `docs/components.md`, run the dev server, and verify the result in a browser before reporting done.

After static builds, keep the default-locale stripping step intact: `scripts/strip-default-locale-prefix.sh`.

