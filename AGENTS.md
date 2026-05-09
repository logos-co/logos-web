# AGENTS.md

Operating guide for AI coding agents working in this repo. Keep changes minimal, match the conventions below, and prefer reading the linked docs over inferring intent.

## Repo shape

pnpm + Turborepo monorepo. Node `>=20.9`, pnpm `10.9`.

| Path | Role |
| --- | --- |
| `apps/web` | Public Next.js 16 site. Tailwind v4, `next-intl`, static export. Port `3000`. |
| `apps/cms` | Payload CMS 3.x admin app (Next.js 16 + Postgres). Port `3001`, admin at `/admin`. |
| `packages/content` | Content schemas, loaders for `content/**`, GitHub mutation helpers, locale registry. |
| `packages/ui` | Shared React primitives + SVG icon components. |
| `packages/tokens` | Design tokens. |
| `packages/types` | Shared types incl. Payload-generated (`generate-types`). |
| `packages/config` | Shared ESLint / TypeScript / Prettier config. |
| `content/**` | **Production source of truth** for page copy and structured data (pages, press, circles, builders-hub, site). |
| `docs/**` | Deployment, plan, page/component specs. Read before designing. |

Apps are entrypoints only. New shared logic goes in a package, not duplicated across apps.

## Commands

Run from repo root unless noted.

```bash
pnpm install
pnpm dev              # turbo: web on :3000, cms on :3001
pnpm build            # web static export + cms next build
pnpm test             # vitest in apps/web
pnpm lint             # eslint --max-warnings 0 across workspaces
pnpm check-types      # next typegen + tsc --noEmit
pnpm generate-types   # cms only — regenerates packages/types/src/payload.ts
```

`apps/web/start` is `python3 -m http.server` over the static `out/` build, not `next start`. Treat the web app as static.

## Architecture rules

1. **`apps/web` does not call the GitHub API at request time.** It reads `content/**` at build. Preview deploys build per PR; production deploys from `master`.
2. **CMS edits are PRs, not DB writes.** Payload's Postgres only stores users, sessions, drafts, and PR cache. All published content changes go through `develop` via GitHub PR (see `apps/cms/src/services/content-workflow/`).
3. **Branch model:** `develop` is the default + staging branch. `master` is production (created when production deploys spin up). Direct commits to either are blocked by branch protection. CMS-generated PRs target `develop`.
4. **Env access is typed.** Use `apps/web/lib/env.ts`; never reach into `process.env` from feature code. Add new vars to `env.ts`.
5. **The CMS refuses to boot in production-like envs without `NEXT_PUBLIC_SERVER_URL` / `NEXT_PUBLIC_WEB_URL`** — silent localhost fallback breaks CORS/cookies. Don't "fix" this by removing the assertion.

## i18n

- Active locales come from `apps/web/i18n/routing.ts` (today: `['en']`). `Language` type is pre-declared as `'en' | 'fr' | 'ko'` so adding a locale is a routing change, not a schema change.
- UI chrome → `apps/web/messages/<locale>.json` (`next-intl`).
- Page copy / structured data → `content/**/<locale>/...` JSON files.
- **All user-facing strings go through i18n keys.** Includes titles, descriptions, labels, and `createDefaultMetadata` args. Use `getTranslations` in server components, `useTranslations` in client components. Hardcoded strings will be rejected.
- A locale added to `routing.ts` makes its `<locale>.json` files required at build time — there is no silent fallback.
- After `next build`, `apps/web/scripts/strip-default-locale-prefix.sh` strips the `/en` prefix from the static export. Don't bypass it.

## Code conventions

- **Repo files are English only.** Committed code, comments, docs, copy. Chat replies can be in any language; files cannot.
- **Icons are React SVG components** exported from `@repo/ui` (`packages/ui/src/icons`). If a designed icon is missing, stop and ask for a Figma export — don't substitute Unicode/text.
- **The λ brand mark is `<LogosMark />`** from `@repo/ui`. Size via `size`, color via parent `text-*` (the SVG uses `currentColor`). Never `<img src=".svg" />` or `<span>λ</span>`.
- **Every clickable element gets `cursor-pointer`** in its Tailwind className: buttons, `onClick` handlers, anchors, clickable cards.
- **Visuals match Figma 1:1.** Pull the spec (font sizes, fills, gaps, padding) from Figma before implementing. See `docs/components.md` for canonical node IDs and `docs/web-pages.md` for per-page references.
- **Types on public APIs.** Exported functions, shared utilities, component props. Use `interface` for object shapes, `type` for unions/intersections. Avoid `any`; use `unknown` + narrowing for external input.
- **Immutability.** Spread/copy, never mutate. `Readonly<T>` on inputs where it clarifies intent.
- **No `console.log` in committed code.**
- **Follow existing file organization.** Many small focused files over large ones. Routes live under `apps/web/app/[locale]/<route>/`; section components under `apps/web/components/sections/<section>/`.

## Content + CMS

Schemas: `packages/content/src/schemas/` (Zod). Loaders: `packages/content/src/loaders/` (typed, fail loudly on missing required locale files).

When changing a schema:
1. Update the Zod schema in `packages/content/src/schemas/`.
2. Update / add the corresponding loader.
3. Update fixtures under `content/**`.
4. If the CMS edits this collection, update the matching Payload collection in `apps/cms/src/collections/` and the workflow service in `apps/cms/src/services/content-workflow/`.
5. Run `pnpm generate-types` (CMS) and `pnpm check-types`.

Payload collections: `Pages`, `Circles`, `Ideas`, `Rfps`, `ContentChangeRequests`, `Users`. The first four mutate via the GitHub PR workflow (see `save-as-pr.ts`, `save-idea-as-pr.ts`, `save-rfp-as-pr.ts`).

## Testing

- Vitest lives in `apps/web` (`pnpm test` from root or app). Add tests beside the code in `__tests__/` folders.
- Playwright is the standard for E2E if/when added.
- For UI/frontend changes, **start the dev server and verify in a browser** before reporting done. Type-check passing ≠ feature working.

## Git + PRs

- **Never auto-commit or push without explicit instruction.**
- **Never add co-author / `Co-Authored-By` lines** to commits in this repo.
- Conventional commit prefixes: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`.
- PR base branch is `develop`.

## Where to look first

- `docs/deployment.md` — env vars, Vercel dev/staging vs self-hosted prod, Postgres setup, troubleshooting.
- `docs/cms-github-content-plan.md` — canonical schema + workflow design.
- `docs/web-pages.md` — per-page Figma references and requirements.
- `docs/components.md` — shared component specs (Nav, Footer, etc.) with Figma node IDs.
- `docs/code-quality-followups.md` — known gaps awaiting design/infra decisions.
- `docs/seo.md` — SEO/metadata expectations.

## Don't

- Don't introduce new top-level packages or apps without checking with the user.
- Don't add backwards-compat shims, `_unused` renames, or "removed in vX" comments. Delete cleanly.
- Don't add error-handling for cases that can't occur, or fallbacks that hide misconfiguration.
- Don't write comments that restate the code. Comments explain *why*, only when non-obvious.
- Don't create new `.md` files unless explicitly asked.
- Don't run destructive git operations (`reset --hard`, force push, branch delete) without confirmation.
