# Architecture

How `apps/api` handles a funnel submission: the one route, the order its checks
run in, the Notion and n8n writers, CORS and the env vars behind them. The forms
and the Notion schema are in [docs/funnel/README.md](../../../docs/funnel/README.md);
this page stops at the endpoint. The app is a Next.js 16 route handler with no
pages and no database, and the dev server listens on port 3003. It needs Node 24
and pnpm 11.1, like the rest of the repo.

## Layout

```
apps/api/
├── src/
│   ├── app/api/public/afform-submit/
│   │   ├── route.ts              # validation, captcha, calls the writers
│   │   └── __tests__/route.test.ts
│   ├── lib/
│   │   ├── intake-submit-flags.ts  # FUNNEL_INTAKE_NOTION_DISABLED
│   │   ├── public-cors.ts          # allowed origins for /api/public/*
│   │   ├── notion/                 # property builder, page POST, template blocks
│   │   └── n8n/                    # steward payload and webhook POST
│   └── middleware.ts               # CORS headers and preflight on /api/public/*
├── next.config.mjs
├── vercel.json                     # build command for the Vercel project
└── vitest.config.ts
```

## Request handling

`POST /api/public/afform-submit` is the only handler. In order:

1. Parse the JSON body and reject a `formName` that is not
   `afformActivistBuilder`, `afformActivistLeaderSteward` or
   `afformCoalitionPartner`.
2. Reject a submission whose `hearAbout` does not resolve to a known option id,
   the same check `buildNotionProperties` uses before writing it. It runs
   whatever `FUNNEL_INTAKE_NOTION_DISABLED` says, so the requirement cannot lapse
   when the Notion write is off.
3. Reject a submission missing a field its form marks required, or whose `email`
   is not plausible. The list comes from `REQUIRED_FIELDS_BY_FORM` in
   `@repo/funnel`, which `apps/web` also builds its form schema from, and the
   `400` names the offending `fields`.
4. Verify the hCaptcha token when `HCAPTCHA_SECRET` is set: a missing token is a
   `400`, a failed check a `403`. Tokens are single-use, so this happens once and
   both writers use that one result.
5. Forward the steward application (`afformActivistLeaderSteward`) to the
   n8n/Baserow webhook. Best-effort: a failure is logged and the request
   continues.
6. Write the Notion page and answer `201`, or answer `201` without writing when
   `FUNNEL_INTAKE_NOTION_DISABLED` is truthy. A Notion failure is a `502`.

The handler drops a `fields` key from the body before it does anything else, so
a client that sends one cannot push it into the Notion or n8n payloads.

### Notion write

`submitToNotion` in `src/lib/notion/submit.ts` does four things:

1. Read `NOTION_API_TOKEN` and `NOTION_DB_ID`, returning `{ ok: false }` if
   either is missing.
2. Find the data source. `NOTION_DATA_SOURCE_ID` wins when set; otherwise a
   `GET /v1/databases/{id}` uses the database's only data source, and fails when
   there is none or more than one.
3. Build the properties with `buildNotionProperties`. The property table is in
   the funnel doc.
4. `POST /v1/pages` with `parent.data_source_id`, the properties and the blocks
   from `src/lib/notion/evaluation-template.ts`. Every request sends
   `Notion-Version: 2026-03-11`.

Empty optional properties are left out, so rows stay sparse. Text is clipped to
2000 characters, Notion's limit for one rich-text element.

### CORS

`src/middleware.ts` matches `/api/public/:path*`, answers `OPTIONS` with a `204`
and adds the CORS headers to every response. Whether an origin is allowed is
decided only in `src/lib/public-cors.ts`: `https://logos.co` and
`https://dev.logos.co` on every deployment, plus `http://localhost:<port>` and
`https://logos-co-web*.vercel.app` when the deployment is not production, plus
anything listed in `CORS_ALLOWED_ORIGINS`. Production means
`VERCEL_ENV=production`, or `NODE_ENV=production` for a local `next start`. A
disallowed origin gets no `Access-Control-Allow-Origin` at all, because
`next.config.mjs` sets no headers of its own.

## Environment variables

[`apps/api/.env.example`](../.env.example) holds the same list with comments.

| Variable                           | Purpose                                                            |
| ---------------------------------- | ------------------------------------------------------------------ |
| `HCAPTCHA_SECRET`                  | Verify captcha tokens; unset = captcha not verified                |
| `NOTION_API_TOKEN`, `NOTION_DB_ID` | Notion intake target                                               |
| `NOTION_DATA_SOURCE_ID`            | Pins writes when the database holds multiple data sources          |
| `FUNNEL_INTAKE_NOTION_DISABLED`    | Skip the Notion write                                              |
| `N8N_STEWARD_WEBHOOK_TOKEN`        | `X-Webhook-Token` for the steward webhook; unset = forward skipped |
| `CORS_ALLOWED_ORIGINS`             | Extra comma-separated origins for `/api/public/*`                  |

## Checks

    pnpm --filter api test
    pnpm --filter api lint
    pnpm --filter api check-types

ESLint comes from `@repo/config/eslint/next` and TypeScript from the shared base
in `packages/config/typescript`, the same as `apps/web`. Vitest runs in a node
environment and mocks the outbound side: `fetch` in the lib tests and the two
writers in the route test. The suites cover request handling, the Notion
property mapping, the n8n payload, the env flag and the CORS allowlist.
