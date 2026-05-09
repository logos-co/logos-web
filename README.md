# logos-co

pnpm + Turborepo monorepo for the Logos website and its content CMS.

- `apps/web` — public Next.js 16 site (Tailwind v4, `next-intl`, static export)
- `apps/cms` — Payload CMS 3.x admin (Postgres-backed; edits ship as GitHub PRs)
- `packages/content` — content schemas, loaders for `content/**`, GitHub mutation helpers
- `packages/ui` — shared React primitives and SVG icons (`<LogosMark />`, etc.)
- `packages/tokens` — design tokens
- `packages/types` — shared types incl. Payload-generated
- `packages/config` — shared ESLint / TypeScript / Prettier config
- `content/**` — production source of truth (pages, press, circles, builders-hub, site)

Apps are entrypoints only. Shared logic lives in packages. The web app reads `content/**` at build time and never calls GitHub at request time.

## Requirements

Node `>=20.9`, pnpm `10.9.0`.

## Quick start

```bash
pnpm install
pnpm dev            # web → http://localhost:3000, cms → http://localhost:3001
```

Payload Admin: <http://localhost:3001/admin>.

`apps/cms` requires `PAYLOAD_SECRET` and `DATABASE_URL` (Postgres). Copy `apps/cms/.env.example` to `apps/cms/.env` and fill it in. See [docs/deployment.md](./docs/deployment.md) for the full env matrix.

## Common scripts

```bash
pnpm build           # web static export + cms build
pnpm test            # vitest (apps/web)
pnpm lint            # eslint --max-warnings 0
pnpm check-types     # next typegen + tsc --noEmit
pnpm generate-types  # regenerate packages/types/src/payload.ts from Payload schema
```

## Branch model

- `develop` — default branch + staging. CMS-generated content PRs target this.
- `master` — production (created when production deploys spin up).

Direct pushes to either are blocked by branch protection.

## Documentation

- [AGENTS.md](./AGENTS.md) — conventions and rules for AI agents working in this repo
- [docs/deployment.md](./docs/deployment.md) — env vars, Vercel dev/staging, self-hosted production
- [docs/cms-github-content-plan.md](./docs/cms-github-content-plan.md) — schema + GitHub workflow design
- [docs/web-pages.md](./docs/web-pages.md) — per-page web requirements (Figma references)
- [docs/components.md](./docs/components.md) — shared component specs
- [docs/seo.md](./docs/seo.md) — SEO and metadata expectations
- [docs/code-quality-followups.md](./docs/code-quality-followups.md) — known gaps awaiting decisions
