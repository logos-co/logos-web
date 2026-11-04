# e2e

Playwright end-to-end tests for the public site ([`apps/web`](../apps/web)). The suite starts no server: it tests whatever URL `LOGOS_WEB_URL` points at, so the same tests cover a local build, [dev.logos.co](https://dev.logos.co) and [logos.co](https://logos.co).

## Run it

Start the site, then run the suite from the repo root. `LOGOS_WEB_URL` defaults to `http://localhost:3000`.

```bash
pnpm --filter e2e exec playwright install chromium   # once
pnpm turbo run build --filter=web --force && pnpm --filter web start
pnpm test:e2e
LOGOS_WEB_URL=https://dev.logos.co pnpm test:e2e
```

`pnpm dev:web` works as a target too, but every route compiles on first visit and the media pages need `pnpm --filter web generate:media-assets` first. The intake form tests expect hCaptcha, so build with `NEXT_PUBLIC_HCAPTCHA_SITEKEY` set.

Inside `e2e/`: `pnpm test:e2e:headed`, `pnpm test:e2e:ui` and `pnpm test:e2e:report` (last HTML report). Settings go in `e2e/.env` or `e2e/.env.local`; [`.env.example`](.env.example) lists them.

## What it checks

| Spec                                 | Covers                                                                                                                         |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| [`pages`](tests/pages.spec.ts)       | Main routes and past-present-future: 200, `h1`, title, description, canonical, robots meta per environment, the not-found page |
| [`basecamp`](tests/basecamp.spec.ts) | Install button per OS and architecture, every download link is on the latest full release and answers 200                      |
| [`media`](tests/media.spec.ts)       | Article and podcast lists open, media search returns results                                                                   |
| [`movement`](tests/movement.spec.ts) | Circles map, zine reader, a Builders Hub RFP and idea                                                                          |
| [`forms`](tests/forms.spec.ts)       | Intake forms render behind hCaptcha, footer newsletter form renders                                                            |
| [`seo`](tests/seo.spec.ts)           | `robots.txt` per environment, sitemap entries answer 200                                                                       |

Every test also fails on an uncaught page error. On remote targets a `console.error` fails it too; on localhost set `E2E_STRICT_CONSOLE=1` for that. Analytics requests (Umami) are answered locally, so test runs are not counted.

## Daily run

[`e2e-daily.yml`](../.github/workflows/e2e-daily.yml) runs the suite every day at 05:47 UTC against dev.logos.co and logos.co, with the whole sitemap. A failure opens or comments on the issue labelled `e2e-daily`, and the next green run closes it. The report and traces are in the run artifacts for 14 days.

Against a deployed site the suite runs one test at a time, three seconds apart, because nginx answers 503 past about 10 requests a second from one IP. Same-origin requests carry an `x-e2e-bypass` header set from the `E2E_BYPASS_TOKEN` secret, so the server can exempt the run from that limit and from bot protection.
