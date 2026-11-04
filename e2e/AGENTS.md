# e2e

Rules for agents working in `e2e/`. The root [AGENTS.md](../AGENTS.md) applies too. These are Playwright tests for `apps/web`; they run against `LOGOS_WEB_URL` and never start a server.

## Commands

- `pnpm test:e2e` from the root runs the suite against `LOGOS_WEB_URL` (default `http://localhost:3000`). Start the site first.
- `pnpm --filter e2e lint` and `pnpm --filter e2e check-types` run in `pnpm test:release`; the suite itself does not.

## Rules

- The suite runs daily against production. Keep it read-only: open forms and dialogs, never submit them. The intake forms reach the CRM and the footer form signs people up to the newsletter.
- Assert on structure, not on copy or CMS content that editors change (article titles, headline text, counts).
- A known site bug that logs a console error goes in `src/constants/logos-web.ts` with a comment saying what is broken. Delete the entry when the bug is fixed.
- Keep `src/fixtures/site.fixture.ts` in step with the copy in status-web (`e2e/src/fixtures/site.fixture.ts`); the two suites share its behaviour.
- Do not name a script `test`: turbo would run it in `pnpm test`, which has no site to test.

## Caveats

- dev.logos.co and logos.co rate-limit each IP and answer 503. Remote runs use one worker and `testIntervalMs`; keep new API checks sequential.
- Unknown routes answer 200 on both deployed sites (a soft 404). The not-found test records it as an annotation instead of failing.
- Chromium reports the host platform through `navigator.userAgentData`, so the Basecamp tests override it with an init script.

## Docs

- [README.md](README.md): setup, what each spec covers and the daily run.
- [playwright.config.ts](playwright.config.ts): workers, retries and reporters.
