# e2e

Playwright end-to-end tests for the public site ([`apps/web`](../apps/web)). The suite starts no server: it tests whatever URL `LOGOS_WEB_URL` points at, so the same tests cover a local build, [dev.logos.co](https://dev.logos.co) and [logos.co](https://logos.co).

## Run it

Start the site, then run the suite from the repo root. `LOGOS_WEB_URL` defaults to `http://localhost:3000`.

```bash
pnpm --filter e2e exec playwright install chromium firefox   # once
pnpm turbo run build --filter=web --force && pnpm --filter web start
pnpm test:e2e
LOGOS_WEB_URL=https://dev.logos.co pnpm test:e2e
```

`pnpm dev:web` works as a target too, but every route compiles on first visit and the media pages need `pnpm --filter web generate:media-assets` first. The intake form tests expect hCaptcha, so build with `NEXT_PUBLIC_HCAPTCHA_SITEKEY` set.

The suite runs in two projects, `chromium` and `firefox`; run one with `pnpm test:e2e --project=firefox`.

Inside `e2e/`: `pnpm test:e2e:headed`, `pnpm test:e2e:ui` and `pnpm test:e2e:report` (last HTML report). Settings go in `e2e/.env` or `e2e/.env.local`; [`.env.example`](.env.example) lists them.

## What it checks

| Spec                                 | Covers                                                                                                                         |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| [`pages`](tests/pages.spec.ts)       | Main routes and past-present-future: 200, `h1`, title, description, canonical, robots meta per environment, the not-found page |
| [`basecamp`](tests/basecamp.spec.ts) | Install button per OS and architecture, every download link is an uploaded asset of the latest full release                    |
| [`media`](tests/media.spec.ts)       | Article and podcast lists open, media search returns results                                                                   |
| [`movement`](tests/movement.spec.ts) | Circles map, zine reader, an RFP, a Builders Hub idea                                                                          |
| [`forms`](tests/forms.spec.ts)       | Intake forms render behind hCaptcha, footer newsletter form renders                                                            |
| [`seo`](tests/seo.spec.ts)           | `robots.txt` per environment, sitemap entries answer 200                                                                       |

Every test also fails on an uncaught page error. On remote targets a `console.error` fails it too; on localhost set `E2E_STRICT_CONSOLE=1` for that. Analytics requests (Umami) are answered locally, so test runs are not counted.

## Daily run

[`e2e-daily.yml`](../.github/workflows/e2e-daily.yml) runs the suite every day at 05:47 UTC against dev.logos.co and logos.co, with the whole sitemap. A failure opens or comments on the issue labelled `e2e-daily`, and the next green run closes it. The report and traces are in the run artifacts for 14 days.

Before the first test, [`global-setup.ts`](global-setup.ts) requests a deployed `LOGOS_WEB_URL` up to three times, 10 seconds each, with the `x-e2e-bypass` header when `E2E_BYPASS_TOKEN` is set. If the site sends no response at all, the run stops there with one error instead of every test waiting out its 45-second navigation timeout. Any HTTP status counts as an answer.

Against a deployed site the suite runs one test at a time, three seconds apart, because nginx answers 503 past about 10 requests a second from one IP. Same-origin requests carry an `x-e2e-bypass` header set from the `E2E_BYPASS_TOKEN` secret, so the server can exempt the run from that limit and from bot protection. The Basecamp test reads the latest release through the GitHub API with the workflow's `GITHUB_TOKEN`, since GitHub answers anonymous github.com traffic with 504s when it is under load.

[`dependabot.yml`](../.github/dependabot.yml) checks every day and opens a PR when a new Playwright release is at least 3 days old, so the suite follows Playwright's Chromium build. [`playwright-reviewers.yml`](../.github/workflows/playwright-reviewers.yml) then requests reviews from the logins in its `REVIEWERS` variable, so they get notified. The PR runs the daily workflow against both sites; merge it by hand once it passes. Dependabot PRs only read Dependabot secrets, so once `E2E_BYPASS_TOKEN` exists, add it there too.
