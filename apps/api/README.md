# api

Public intake endpoint for the funnel forms on `apps/web`. A Next.js app with no
pages, no database and no authenticated area: `POST /api/public/afform-submit`
validates a submission, verifies the captcha and forwards it to Notion, plus an
n8n/Baserow webhook for the steward form.

## Run

    pnpm dev:api                   # http://localhost:3003
    pnpm --filter api test         # Vitest
    pnpm --filter api lint
    pnpm --filter api check-types

## Environment

Copy `.env.example` to `.env`. Notion intake needs `NOTION_API_TOKEN` and
`NOTION_DB_ID`; captcha verification needs `HCAPTCHA_SECRET`. The full list with
comments is in [.env.example](.env.example).

## Deploy

Vercel. The build command lives in [vercel.json](vercel.json).

## More

- [Architecture](docs/architecture.md): routes, request handling, env vars
- [Funnel reference](../../docs/funnel/README.md): the end-to-end flow and the Notion schema
- [Agent guide](AGENTS.md)
