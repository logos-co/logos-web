# Logos website

The public Logos website: a Next.js 16 site with Tailwind v4 and `next-intl`,
exported to static HTML and served at https://logos.co.

## Run

    pnpm dev:web                 # http://localhost:3000

## Build

    pnpm turbo run build --filter=web
    pnpm --filter web start      # serve out/ with python3 -m http.server

Build through turbo, never `pnpm --filter web build`: `@acid-info/logos-ui` must
be built first and only the turbo orchestrator does that. Every build refreshes
the Basecamp download links from the latest full GitHub release; see
[docs/basecamp-release.md](docs/basecamp-release.md).

The build also refreshes active-circles data, generates media assets, exports
the static site, copies the past-present-future app, and strips the default
locale prefix.

## Environment

Copy [.env.example](.env.example) to `.env` (or `.env.local`). All env access
goes through `lib/env.ts`; add new variables there rather than reading
`process.env` directly.

## More

- [Agent guide](AGENTS.md)
- [Docs](docs/README.md)
