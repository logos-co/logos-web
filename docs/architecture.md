# Architecture

How the workspaces depend on each other and how a content edit reaches the live site. It covers [`pnpm-workspace.yaml`](../pnpm-workspace.yaml), [`turbo.json`](../turbo.json), the six apps in [`apps/`](../apps) and the six packages in [`packages/`](../packages). The list of workspaces, with ports, is in the [root README](../README.md#workspaces).

## Workspace dependencies

Apps are entrypoints; anything two apps need goes in a package. Internal packages are linked with `workspace:*` in each `package.json`:

| Workspace          | Depends on                                                                                               |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| `apps/web`         | `@acid-info/logos-ui`, `@acid-info/logos-tokens`, `@repo/content`, `@repo/funnel`, `past-present-future` |
| `apps/cms`         | `@repo/content`                                                                                          |
| `apps/api`         | `@repo/funnel`                                                                                           |
| `apps/logos-crm`   | `@acid-info/logos-ui`, `@acid-info/logos-tokens`                                                         |
| `apps/logos-demos` | `@acid-info/logos-ui`, `@acid-info/logos-tokens`                                                         |
| `packages/ui`      | `@acid-info/logos-tokens` (peer)                                                                         |

`packages/ui` is the only package that compiles: `tsup` writes `dist/`, and apps import that output through the package's `exports` map. The others ship source. `@repo/content` and `@repo/types` point at their TypeScript files, `@acid-info/logos-tokens` at its CSS, `@repo/config` at the shared ESLint, TypeScript and Prettier files.

This works only because `dev`, `build`, `test` and `check-types` all depend on `^build` in [`turbo.json`](../turbo.json), so `dist/` exists before any app starts. Start an app directly with `next dev` and you have to build `@acid-info/logos-ui` yourself.

## Content flow

`content/**` is the source of truth for page copy and for the structured data behind pages, press, circles, builders-hub, zines and site. `apps/web` reads it at build time through the `@repo/content` loaders and never calls the GitHub API at request time, so pages render without a round trip. The one build-time exception is the RFP listing, which fetches markdown from the `logos-co/rfp` repo ([`apps/web/lib/rfps-github.ts`](../apps/web/lib/rfps-github.ts)).

The CMS doesn't publish by writing to its database. An editor's save becomes a GitHub pull request against `develop` that changes files under `content/**`, opened by the workflow service in [`apps/cms/src/services/content-workflow/`](../apps/cms/src/services/content-workflow). Payload's Postgres holds only what the admin needs while the edit is in flight: users, sessions, drafts, a mirror of open content PRs and the site publish reservations. GitHub has the diff. Once the PR merges, the next build picks it up: `develop` builds staging, `master` builds production. [Deployment](deployment.md) covers those builds.

A schema change touches four things that have to move together: the schema, the loader, the fixtures and the CMS collection. The checklist is in [`packages/content/AGENTS.md`](../packages/content/AGENTS.md).

## past-present-future

`apps/past-present-future` is a separate SvelteKit app, fully prerendered under the `/past-present-future` base path. It is a dev dependency of `apps/web`, which is how Turborepo knows to build it first. The web build then runs [`apps/web/scripts/copy-past-present-future.sh`](../apps/web/scripts/copy-past-present-future.sh), copying the SvelteKit `build/` output into `apps/web/out/past-present-future` before the locale-prefix strip, so its pages get the same route normalisation as the rest of the export.

In dev, [`apps/web/next.config.mjs`](../apps/web/next.config.mjs) rewrites `/past-present-future` to the Vite server on port 3006. The rewrite doesn't carry the HMR websocket, so the browser connects to 3006 directly for hot reload (see [`apps/past-present-future/vite.config.js`](../apps/past-present-future/vite.config.js)).

## Funnel

Three public forms on `apps/web` post to one endpoint on `apps/api`, which writes to Notion; the steward form also goes to an n8n/Baserow webhook. Request flow, the Notion schema and the option maps are in [funnel/README.md](funnel/README.md).
