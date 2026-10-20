# logos-web

pnpm + Turborepo monorepo for the Logos website and its content CMS, intake API and internal tools.

## Workspaces

| Path                       | Package                   | Purpose                                                                              | Port |
| -------------------------- | ------------------------- | ------------------------------------------------------------------------------------ | ---- |
| `apps/web`                 | `web`                     | Public Next.js 16 site (Tailwind v4, `next-intl`, static export).                    | 3000 |
| `apps/cms`                 | `cms`                     | Payload CMS 3.x admin (Next.js 16 + Postgres). Admin at `/admin`.                    | 3001 |
| `apps/api`                 | `api`                     | Public funnel intake endpoint (Next.js 16, no pages).                                | 3003 |
| `apps/logos-crm`           | `logos-crm`               | Internal CRM (Next.js 16, Drizzle + Postgres).                                       | 3004 |
| `apps/logos-demos`         | `logos-demos`             | Demos of the Logos stack (Next.js 16).                                               | 3005 |
| `apps/past-present-future` | `past-present-future`     | SvelteKit app served at `/past-present-future`, copied into the web export.          | 3006 |
| `packages/content`         | `@repo/content`           | Content schemas, loaders for `content/**`, GitHub mutation helpers, locale registry. | n/a  |
| `packages/funnel`          | `@repo/funnel`            | Shared funnel form values (questions, option ids, required-field lists).             | n/a  |
| `packages/ui`              | `@acid-info/logos-ui`     | Shared React primitives and SVG icons.                                               | n/a  |
| `packages/tokens`          | `@acid-info/logos-tokens` | Design tokens.                                                                       | n/a  |
| `packages/types`           | `@repo/types`             | Shared types, Payload-generated.                                                     | n/a  |
| `packages/config`          | `@repo/config`            | Shared ESLint / TypeScript / Prettier config.                                        | n/a  |

`content/**` is the production source of truth for page copy and structured data (pages, press, circles, builders-hub, site). Apps are entrypoints only; shared logic lives in packages.

## Requirements

Node 24, pnpm 11.1.0. See [`.node-version`](.node-version) and [`package.json`](package.json).

## Quick start

```bash
pnpm install
pnpm dev            # starts all apps: web :3000, cms :3001, api :3003, crm :3004, demos :3005, ppf :3006
```

`apps/cms` needs `PAYLOAD_SECRET` and `DATABASE_URL` (Postgres): copy `apps/cms/.env.example` to `apps/cms/.env` and fill it in. `apps/api` and `apps/logos-crm` also read a `.env` file. Payload Admin runs at <http://localhost:3001/admin>.

## Common scripts

```bash
pnpm build           # turbo: web static export + cms build + everything with a build script
pnpm test            # turbo: runs test in every workspace that has one
pnpm lint            # eslint --max-warnings 0 across workspaces
pnpm check-types     # turbo: tsc --noEmit across workspaces
pnpm generate-types  # cms only: regenerate packages/types/src/payload.ts
```

`dev:*` filters start one app plus its dependencies: `pnpm dev:web`, `dev:cms`, `dev:api`, `dev:logos-crm`, `dev:past-present-future`.

`pnpm test:release` runs the full release gate (repo health, lint, types, tests, content validation, a clean web deploy build, static and performance checks). Run it before marking release work done.

### Missing `dist/` directories

Apps consume internal packages through their compiled `dist/` outputs. Turborepo's `dev` task depends on `^build`, so `pnpm dev` builds upstream packages first. If a `dist/` directory goes missing (for example after `git clean -fdx`) and you start an app directly, you may see `Module not found: Can't resolve '@acid-info/logos-ui/client'`. Rebuild the affected package (`pnpm --filter @acid-info/logos-ui build`) or run `pnpm build` once to compile every package.

## Branch model

- `develop`: default branch + staging. CMS-generated content PRs target this.
- `master`: production, created when production deploys spin up.

Direct pushes to either are blocked by branch protection.

## Docs

- [docs/README.md](docs/README.md): index of all docs
- [docs/architecture.md](docs/architecture.md): workspaces, dependencies, content flow
- [docs/deployment.md](docs/deployment.md): branches, CI, what deploys where
- [AGENTS.md](AGENTS.md): rules for AI agents working in this repo
