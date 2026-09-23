# `api` — Architecture Document

> Node ≥ 24, pnpm 11.1

---

## 1. Overview

`api` is a Next.js application in `apps/api` that hosts the public intake endpoint for the funnel forms on `apps/web`. It has no database, no pages and no authenticated area.

The funnel itself is documented in [`docs/funnel/AGENTS.md`](../funnel/AGENTS.md), which is the reference for anything about form submissions.

| Route | Purpose |
|---|---|
| `POST /api/public/afform-submit` | Public intake endpoint for the three funnel forms |

---

## 2. Tech Stack

| Concern | Choice | Rationale |
|---|---|---|
| Framework | Next.js 16 | Route Handlers plus middleware; no pages are rendered |
| Language | TypeScript (strict null checks, bundler module resolution) | Consistent with `packages/config/typescript/base.json` |
| Testing | Vitest | Mocks the outbound HTTP calls (Notion, n8n, hCaptcha) |
| Database | None | Submissions are forwarded to Notion and n8n |
| Linting | `@repo/config/eslint/next` | Same as `apps/web` |

Dev server runs on port **3003**.

---

## 3. File Architecture

```
apps/api/
├── src/
│   ├── app/
│   │   └── api/public/afform-submit/
│   │       ├── route.ts              # Orchestrator: validation, captcha, fan-out
│   │       └── __tests__/route.test.ts
│   ├── lib/
│   │   ├── intake-submit-flags.ts    # FUNNEL_INTAKE_NOTION_DISABLED
│   │   ├── public-cors.ts            # Allowed origins for /api/public/*
│   │   ├── notion/                   # Property builder + page POST
│   │   └── n8n/                      # Steward webhook payload + POST
│   └── middleware.ts                 # CORS headers on /api/public/*
├── next.config.mjs
├── vercel.json                       # Build command for the Vercel project
└── vitest.config.ts
```

---

## 4. Request Handling

`POST /api/public/afform-submit` is the only handler. In order:

1. Parse the body; reject a `formName` outside the three allowed funnel forms.
2. Reject a submission whose `hearAbout` answer is missing or is not a known option id. Enforced server-side so a tampered submission cannot skip the field.
3. Reject a submission missing any other field the form marks required, or whose `email` is not a plausible address. The list lives in `@repo/funnel` (`REQUIRED_FIELDS_BY_FORM`), which `apps/web` also builds its form schema from; the `400` names the offending `fields`.
4. Verify the hCaptcha token when `HCAPTCHA_SECRET` is set. Tokens are single-use, so this happens once and every destination write shares that one verification.
5. Forward the steward form to the n8n/Baserow webhook. Best-effort: a failure is logged and does not fail the request.
6. Write the Notion page unless `FUNNEL_INTAKE_NOTION_DISABLED` is truthy. A failure returns `502`.

A `fields[]` key in the body is dropped rather than forwarded, so a client that sends one cannot leak it into the Notion or n8n payloads.

### CORS

`src/middleware.ts` answers preflight requests and sets the response headers for `/api/public/*`, using the allowlist in `src/lib/public-cors.ts`: `logos.co` in production, plus `localhost` and `logos-co-web*.vercel.app` previews elsewhere, plus anything in `CORS_ALLOWED_ORIGINS`.

---

## 5. Environment Variables

See [`apps/api/.env.example`](../../apps/api/.env.example) for the full list with comments.

| Variable | Purpose |
|---|---|
| `HCAPTCHA_SECRET` | Verify captcha tokens; unset = captcha not verified |
| `NOTION_API_TOKEN`, `NOTION_DB_ID` | Notion intake target |
| `NOTION_DATA_SOURCE_ID` | Pins writes when the database holds multiple data sources |
| `FUNNEL_INTAKE_NOTION_DISABLED` | Skip the Notion write |
| `N8N_STEWARD_WEBHOOK_TOKEN` | `X-Webhook-Token` for the steward webhook; unset = forward skipped |
| `CORS_ALLOWED_ORIGINS` | Extra comma-separated origins for `/api/public/*` |

---

## 6. Testing

```bash
pnpm --filter api test
```

Vitest covers the endpoint behaviour, the Notion property mapping, the n8n payload building, the env flag, and the CORS allowlist.
