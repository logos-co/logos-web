# api

`apps/api` is the endpoint the funnel forms on `apps/web` post to:
`POST /api/public/afform-submit`. It validates the submission, verifies the
hCaptcha token once and writes the answers to Notion; the steward application
is also forwarded to an n8n/Baserow webhook. Nothing else lives here, so there
are no pages, no database and no authenticated area.

## Run

    pnpm dev:api                  # http://localhost:3003

    pnpm --filter api test
    pnpm --filter api lint
    pnpm --filter api check-types

## Environment

Copy `.env.example` to `.env`. Notion writes need `NOTION_API_TOKEN` and
`NOTION_DB_ID`, captcha verification needs `HCAPTCHA_SECRET`, and steward
forwarding needs `N8N_STEWARD_WEBHOOK_TOKEN`. Every variable is commented in
[.env.example](.env.example).

Two values are worth knowing for local runs. Leaving `HCAPTCHA_SECRET` unset
turns verification off instead of failing, and setting
`FUNNEL_INTAKE_NOTION_DISABLED=1` skips the Notion write while still answering
`201`.

## Deploy

Vercel, built with the command in [vercel.json](vercel.json). The CORS
allowlist follows the deployment: production accepts `logos.co` and
`dev.logos.co`, previews also accept localhost and `logos-co-web*.vercel.app`.

## More

- [Architecture](docs/architecture.md): request handling, the Notion and n8n
  writers, CORS, env vars
- [Funnel reference](../../docs/funnel/README.md): the flow end to end and the
  Notion schema
- [Agent guide](AGENTS.md)
