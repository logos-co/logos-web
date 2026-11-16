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

The build script runs `sync:basecamp-release`, `sync:active-circles` and `generate:media-assets` before `next build --webpack`, then copies the past-present-future export into `out/` and strips the `/en` prefix. The bundler choice is explained in [docs/fonts.md](docs/fonts.md#google-fonts). Basecamp install CTAs get their download URLs from the latest full GitHub release, and a rejected release fails the build. See [docs/basecamp-release.md](docs/basecamp-release.md).

[Article sharing metadata](app/[locale]/media/article/[slug]/page.tsx) uses the CMS OG image when it has positive width and height, otherwise the article cover. Open Graph, Twitter and Article JSON-LD use the same selection.

The public origin comes from `canonicalUrl` in [site settings](../../content/site/en/settings.json), currently `https://logos.co`. Canonical links, social metadata, structured data, sitemap entries and production robots directives use this origin in every deployment. Deployment hostnames do not override it; staging builds remain closed to crawlers through `NEXT_PUBLIC_API_MODE`.

## Environment

Copy [.env.example](.env.example) to `.env.local` (or `.env`). Add new variables to [`lib/env.ts`](lib/env.ts) instead of reading `process.env` from feature code.

The build needs `STRAPI_API_KEY`; `/media` pages are built from the Strapi blog CMS. `SIMPLECAST_ACCESS_TOKEN` is optional locally but production builds fail without it.

A failed blog CMS or active circles fetch fails the build. During an outage, set `ALLOW_CONTENT_FETCH_FAILURE=1` and the build uses the snapshots committed in `lib/data/` (`press.snapshot.json` and `active-circles.snapshot.json`) instead, so that content can be stale. A missing `STRAPI_API_KEY` counts as a failure too. A post the CMS lists but the snapshot lacks is left out of listings, and its page renders the 404 page. `generate:media-assets` rewrites `press.snapshot.json` when all of its media reads came from the live CMS, and leaves it alone when any read used a snapshot. See [docs/deployment.md](../../docs/deployment.md#static-site-appsweb).

## Deploy

Vercel builds previews from [`vercel.json`](vercel.json); Jenkins publishes `develop` to dev.logos.co and `master` to logos.co. [docs/deployment.md](../../docs/deployment.md) has the detail.

## More

- [docs/README.md](docs/README.md): the docs in this app
- [AGENTS.md](AGENTS.md): rules for coding agents
