# Logos website

The public site at https://logos.co: Next.js 16 with Tailwind v4 and `next-intl`, built as a static export. Page copy and structured data come from [`content/**`](../../content) at build time.

## Run

```bash
pnpm dev:web     # http://localhost:3000
```

`dev:web` also starts the app's workspace dependencies, including the SvelteKit app on port 3006 that the Next dev server proxies at `/past-present-future`.

Routes live in `app/[locale]/<route>/`; shared UI is in `packages/ui`.

## Build

```bash
pnpm turbo run build --filter=web
pnpm --filter web start      # serves out/ on port 3000 with python3 -m http.server
```

Build through turbo, never `pnpm --filter web build`: `@acid-info/logos-ui` must be compiled first and only turbo's task graph does that. Vercel and Jenkins run the same command.

The build script runs `sync:basecamp-release`, `sync:active-circles` and `generate:media-assets` before `next build`, then copies the past-present-future export into `out/` and strips the `/en` prefix. Basecamp install CTAs get their download URLs from the latest full GitHub release, and a rejected release fails the build. See [docs/basecamp-release.md](docs/basecamp-release.md).

## Environment

Copy [.env.example](.env.example) to `.env.local` (or `.env`). Add new variables to [`lib/env.ts`](lib/env.ts) instead of reading `process.env` from feature code.

The build needs `STRAPI_API_KEY`; `/media` pages are built from the Strapi blog CMS and there is no other source. `SIMPLECAST_ACCESS_TOKEN` is optional locally but production builds fail without it.

## Deploy

Vercel builds previews from [`vercel.json`](vercel.json); Jenkins publishes `develop` to dev.logos.co and `master` to logos.co. [docs/deployment.md](../../docs/deployment.md) has the detail.

## More

- [docs/README.md](docs/README.md): the docs in this app
- [AGENTS.md](AGENTS.md): rules for coding agents
