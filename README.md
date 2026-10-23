# logos-web

This monorepo holds the public Logos website (logos.co), the Payload CMS that edits its content, the API behind its signup forms and a few internal tools. It uses pnpm workspaces and Turborepo

## Workspaces

| Path                       | Package                   | What it is                                                         | Port |
| -------------------------- | ------------------------- | ------------------------------------------------------------------ | ---- |
| `apps/web`                 | `web`                     | Public Next.js 16 site, built as a static export                   | 3000 |
| `apps/cms`                 | `cms`                     | Payload CMS 3.x admin on Postgres, at `/admin`                     | 3001 |
| `apps/api`                 | `api`                     | Funnel intake endpoint (Next.js 16, no pages)                      | 3003 |
| `apps/logos-crm`           | `logos-crm`               | Internal CRM (Next.js 16, Drizzle, Postgres)                       | 3004 |
| `apps/logos-demos`         | `logos-demos`             | Demos of the Logos stack (Next.js 16)                              | 3005 |
| `apps/past-present-future` | `past-present-future`     | SvelteKit app served at `/past-present-future` inside the web site | 3006 |
| `packages/content`         | `@repo/content`           | Schemas and loaders for `content/**`, GitHub helpers, locales      |      |
| `packages/funnel`          | `@repo/funnel`            | Funnel questions, option ids and required fields                   |      |
| `packages/ui`              | `@acid-info/logos-ui`     | React primitives and SVG icons                                     |      |
| `packages/tokens`          | `@acid-info/logos-tokens` | Design tokens as CSS                                               |      |
| `packages/types`           | `@repo/types`             | Shared types, including the Payload-generated ones                 |      |
| `packages/config`          | `@repo/config`            | ESLint, TypeScript and Prettier presets                            |      |

Page copy and structured data (pages, press, circles, builders-hub, zines, site) live in `content/**`, and that folder is what production builds from. Apps are thin entrypoints; shared logic goes in a package.

## Run it

You need Node 24 ([`.node-version`](.node-version)) and pnpm 11.1.0 (pinned in [`package.json`](package.json)).

```bash
pnpm install
pnpm dev            # every app: web :3000, cms :3001, api :3003, crm :3004, demos :3005, ppf :3006
pnpm dev:web        # one app plus the packages it needs; also dev:cms, dev:api, dev:logos-crm, dev:past-present-future
```

The CMS won't start without `PAYLOAD_SECRET` and a Postgres `DATABASE_URL`. Copy `apps/cms/.env.example` to `apps/cms/.env` and fill it in; the admin is then at <http://localhost:3001/admin>. `apps/web`, `apps/api` and `apps/logos-crm` each have their own `.env.example` too.

## Scripts

```bash
pnpm build           # web static export, cms build and every other workspace with a build script
pnpm test            # tests in every workspace that has them
pnpm lint            # eslint --max-warnings 0
pnpm check-types     # tsc --noEmit everywhere
pnpm generate-types  # regenerate packages/types/src/payload.ts from the CMS config
pnpm test:release    # the full release gate
```

`test:release` is what CI runs on every pull request: repo health checks, lint, types, tests, content validation, a clean web build, the full build, then static export and performance checks. Run it before you call release work done.

## Missing `dist/` folders

Apps import `@acid-info/logos-ui` from its compiled `dist/`. `pnpm dev` and `pnpm build` build upstream packages first, but if you start an app some other way after `dist/` has gone (say, after `git clean -fdx`), you'll get `Module not found: Can't resolve '@acid-info/logos-ui/client'`. Run `pnpm --filter @acid-info/logos-ui build`, or `pnpm build` once to rebuild every package.

## Branches

`develop` is the default branch and deploys to staging; CMS content PRs target it. `master` is production. Branch protection blocks direct pushes to both, so everything lands through a PR. [docs/deployment.md](docs/deployment.md) covers what deploys where.

## More

- [docs/README.md](docs/README.md): index of every doc in the repo
- [docs/architecture.md](docs/architecture.md): how the workspaces depend on each other and how content flows
- [docs/deployment.md](docs/deployment.md): branches, CI and deploy targets
- [AGENTS.md](AGENTS.md): rules for AI agents working in this repo
