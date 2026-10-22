# AGENTS.md

Operating guide for AI coding agents. Keep changes minimal; prefer docs.

## Repo shape

pnpm + Turborepo monorepo. Node 24, pnpm 11.1.

| Path                       | Role                                   |
| -------------------------- | -------------------------------------- |
| `apps/web`                 | Public Next.js 16 site, static export. |
| `apps/cms`                 | Payload CMS 3.x admin (Postgres).      |
| `apps/api`                 | Public funnel intake endpoint.         |
| `apps/logos-crm`           | Internal CRM (Drizzle + Postgres).     |
| `apps/logos-demos`         | Logos stack demos.                     |
| `apps/past-present-future` | SvelteKit app, prerendered.            |
| `packages/content`         | Content schemas and loaders.           |
| `packages/funnel`          | Shared funnel form values.             |
| `packages/ui`              | React primitives + SVG icons.          |
| `packages/tokens`          | Design tokens.                         |
| `packages/types`           | Shared types, Payload-generated.       |
| `packages/config`          | ESLint / TypeScript / Prettier.        |
| `content/**`               | Source of truth for page copy.         |

## Commands

From repo root.

```bash
pnpm dev              # turbo: all apps (web 3000, cms 3001, api 3003, crm 3004, demos 3005, ppf 3006)
pnpm build            # turbo: web export + cms build
pnpm test             # turbo: all workspaces
pnpm lint             # eslint --max-warnings 0
pnpm check-types      # turbo: tsc --noEmit
pnpm generate-types   # cms only
```

`dev:*` filters run one app plus its dependencies (`dev:web`, `dev:cms`, `dev:api`, `dev:logos-crm`, `dev:past-present-future`). `test:release` is the full release gate.

## Architecture rules

1. `apps/web` reads `content/**` at build time and never calls the GitHub API at request time.
2. CMS edits are PRs, not DB writes. Payload's Postgres stores only users, sessions, drafts and PR cache; published content changes go through `develop` via GitHub PR.
3. Branch model: `develop` is default + staging, `master` is production. Direct commits to either are blocked. CMS-generated PRs target `develop`.

## Code conventions

- Repo files are English only; chat replies may be any language.
- British English for public paths and user-facing copy. Prefer `decentralised`, `programme`, `licence`. Keep third-party literals, external URLs and generated types.
- Icons are React SVG components from `@acid-info/logos-ui` (`packages/ui/src/icons`). If one is missing, ask for a Figma export; do not substitute Unicode or text.
- The λ mark is `<LogosMark />` from `@acid-info/logos-ui`; size via `size`, colour via `text-*`. Never `<img src=".svg" />` or `<span>λ</span>`.
- Every clickable element gets `cursor-pointer`.
- Visuals match Figma 1:1.
- Types on public APIs: `interface` for object shapes, `type` for unions; avoid `any`.
- Keep reusable code out of generated or oversized files; split files by feature when they grow.
- Immutability: spread/copy, never mutate.
- No `console.log` in committed code.

## Content + CMS

Schemas live in `packages/content/src/schemas/` (Zod); loaders in `packages/content/src/loaders/`. Follow the schema-change checklist in [`packages/content/AGENTS.md`](packages/content/AGENTS.md). Payload collections and the CMS env assertion live in [`apps/cms/AGENTS.md`](apps/cms/AGENTS.md).

## Testing

- Vitest is the unit test runner; add tests beside code in `__tests__/` folders.
- No UI contract tests asserting Tailwind classes, Figma measurements, spacing, motion or hover; verify in a browser.

## Git + PRs

- Never auto-commit or push without explicit instruction.
- Never add `Co-Authored-By` or AI attribution.
- Conventional commit prefixes: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`.
- PR base branch is `develop`.

## Docs map

- [docs/README.md](docs/README.md): index
- [docs/architecture.md](docs/architecture.md): workspaces
- [docs/deployment.md](docs/deployment.md): branches and CI
- [docs/components.md](docs/components.md): components
- [docs/funnel/README.md](docs/funnel/README.md): funnel end to end
- [docs/media-migration.md](docs/media-migration.md): blog redirects
- App rules: [apps/web](apps/web/AGENTS.md), [apps/cms](apps/cms/AGENTS.md), [apps/logos-demos](apps/logos-demos/AGENTS.md)

## Don't

- Don't add top-level packages or apps without checking with the user.
- Don't add backwards-compat shims or "removed in vX" comments; delete cleanly.
- Don't add error handling for impossible cases.
- Don't write comments that restate the code.
- Create docs only following the Documentation section below.
- Don't run destructive git operations (`reset --hard`, force push) without confirmation.

## Documentation

Docs are maintained by hand and by the ai-docs-sync workflow on every merge to `develop`. Follow
this layout so both stay in step:

- `README.md` (root and every app or package): for humans. What it is, how to run it, where to go
  next. Short. No agent rules.
- `AGENTS.md` (root and app or package roots only): rules and caveats for agents. Imperative, no
  reference material. Root at most 6,000 characters, others at most 3,500.
- `docs/` at the root: topics that span more than one app or package. `docs/README.md` is the index.
- `apps/<name>/docs/`, `packages/<name>/docs/`: detailed reference owned by one app or package,
  indexed by its own `docs/README.md`. Dated research notes go in `docs/research/` and are frozen.
- No `CLAUDE.md`: Claude Code ignores every `AGENTS.md` when one exists.

A doc lives in the narrowest app or package that owns all the code it describes. Each doc starts
with `# Title`, then one sentence of scope that links the code paths it covers. State each fact in
one place and link to it elsewhere. Use relative links, no en or em dashes, no AI attribution.
Update the matching doc in the same PR when you change behaviour, commands, env vars or routes.
