# Deployment

Which branch deploys where, and how each app gets there. It covers [`Jenkinsfile`](../Jenkinsfile), [`.github/workflows/site-publish.yml`](../.github/workflows/site-publish.yml), [`.github/workflows/test.yml`](../.github/workflows/test.yml), [`.github/workflows/e2e-daily.yml`](../.github/workflows/e2e-daily.yml), [`.github/dependabot.yml`](../.github/dependabot.yml), [`.github/workflows/playwright-reviewers.yml`](../.github/workflows/playwright-reviewers.yml), the per-app `vercel.json` files (for example [`apps/web/vercel.json`](../apps/web/vercel.json)) and [`docker-compose.prod.yml`](../docker-compose.prod.yml).

## Branches

| Branch           | Role                                                     |
| ---------------- | -------------------------------------------------------- |
| `develop`        | Default branch and staging. CMS content PRs target it.   |
| `master`         | Production.                                              |
| `deploy-develop` | Built static site for staging, served at `dev.logos.co`. |
| `deploy-master`  | Built static site for production, served at `logos.co`.  |

Branch protection blocks direct pushes to `develop` and `master`. The `deploy-*` branches are written by the build jobs below, never by hand.

Vercel deploys every pushed branch by default. Both publish jobs run [`scripts/site-publish/skip-vercel.mts`](../scripts/site-publish/skip-vercel.mts), which adds a `vercel.json` turning deployments off at each Vercel project's root directory, so `deploy-*` pushes don't start builds. The docs bot branch `docs/repo/sync` is skipped through `git.deploymentEnabled` in each app's `vercel.json`.

## Static site (apps/web)

The site is a static export of `apps/web/out`, built with `pnpm turbo run build --filter=web --force`. The `--force` is deliberate: Turbo hashes source files, and most of the media comes from an external CMS, so a cache hit could ship last week's articles. Builds that fetch that media run `scripts/capture-press-snapshot.ts` first and pass the result through `PRESS_CONTENT_SNAPSHOT`, so feeds, cards and article pages all use one fetch.

Every build takes the origin for canonical links, JSON-LD, robots and sitemap URLs from `canonicalUrl` in [`content/site/en/settings.json`](../content/site/en/settings.json) (`https://logos.co`). When `VERCEL_ENV` is `preview` and `VERCEL_URL` is set, the build uses `https://` plus the `VERCEL_URL` hostname for Open Graph page URLs and for Open Graph and X card images hosted on the canonical origin, so new share images work before production deploys. Card images hosted elsewhere, such as the CMS, keep their own URL. Other builds use the canonical origin for those tags. Canonical links and indexing rules are the same on every build. Keep Vercel's system environment variables enabled. A link preview service must be able to fetch the page and image without signing in.

A failed fetch from the blog CMS or the active circles API fails the build by default. Set `ALLOW_ACTIVE_CIRCLES_FETCH_FAILURE=1` to allow only Active Circles to reuse its committed snapshot on error. The release test workflow sets this option. The Active Circles page shows the date of the snapshot and excludes past events from its upcoming count.

Set `ALLOW_CONTENT_FETCH_FAILURE=1` to fall back to the snapshots committed in [`apps/web/lib/data/`](../apps/web/lib/data/) instead: `press.snapshot.json` for /media and `active-circles.snapshot.json` for the circles pages. Both are rewritten by every build that reaches its API (`generate:media-assets` and `sync:active-circles`), so commit them from a local build now and then to keep the fallback recent. In that mode the build skips image downloads and reuses the resized images in the Vercel build cache; images missing from it keep their CMS URL and stay broken until the CMS is back. Redeploy with the build cache enabled. The CMS requests time out after 20 seconds. Once the CMS proves unreachable (no key, a dropped or timed out request, a 5xx), the rest of that process reads the snapshot directly; other CMS errors fall back for the failed read only. A post the CMS listed but the snapshot lacks is left out of listings and its page renders the 404 page.

During a CMS outage, a preview can also use a previous `press-snapshot` workflow artifact through `PRESS_CONTENT_SNAPSHOT`. Check its date and draft status, reuse the available media image cache, then build with `vercel build --target preview` and upload with `vercel deploy --prebuilt`. Record the snapshot date in the PR because its media content stays frozen at that point. Homepage statistics requests time out after ten seconds and use their existing fallback values.

Vercel previews for `web/muster` and `web/railgun` use the published media snapshot from 5 November 2026 while the CMS is unavailable. Branch-specific `PRESS_PREVIEW_SNAPSHOT_URL` and `PRESS_CONTENT_SNAPSHOT` variables supply the archive and its extracted path. The install command downloads the archive only when its URL is set.

`generate:media-assets` keeps the resized images in `apps/web/.next/cache/media-images`, which Vercel keeps between builds. An image download fails after 10 seconds without data or 60 seconds in total, with no retry, and the image keeps its CMS URL. The cache then marks that URL as failed for 24 hours, so later builds skip it without a download; vector and animated files are marked as skipped for good. Delete the cache directory, or redeploy without the build cache, to retry them sooner. Jenkins starts from a clean workspace, so it pays the timeout on every run. The active circles requests time out after 10 seconds.

Two jobs can build and publish it.

[Jenkinsfile](../Jenkinsfile) builds the web app with `STRAPI_API_KEY` and `SIMPLECAST_ACCESS_TOKEN`, because the /media pages come from the blog CMS and Simplecast, then pushes `apps/web/out` to `deploy-develop` or `deploy-master` with `ghp-import`. Unless it runs in site publish mode, the same run also builds the CMS image (see below). Each stage runs on its own agent from a clean checkout: the build stage has no Docker socket and no SSH key, and hands `apps/web/out` to the publish stage as a stash, so code that ran during the build cannot touch the publishing scripts or the CMS sources.

[site-publish.yml](../.github/workflows/site-publish.yml) rebuilds only the static site and leaves the Payload image alone. It runs on a `site-publish` `repository_dispatch` (the CMS sends one from its dashboard) or by hand through `workflow_dispatch`, checks out the current `develop` commit for dev or the current `master` commit for production, builds, and publishes the export to the matching deploy branch with [`scripts/site-publish/publish.mts`](../scripts/site-publish/publish.mts). Jenkins has the same mode behind its `SITE_PUBLISH` parameter. The `build` job installs and builds with read-only tokens and uploads the export as an artifact. The `publish` job never installs or runs the site code: it downloads that artifact, mints the CMS App token and pushes. Only `publish` uses the `site-publish` environment, which holds `SITE_PUBLISH_APP_PRIVATE_KEY` and accepts runs from `develop` and `master` only.

Successful staging builds save the media they fetched as a `press-snapshot.json` artifact, kept 14 days in the workflow. A production publish names the latest successful staging run (`previewBuild` in the workflow, `PREVIEW_BUILD` in Jenkins), reuses its snapshot and checks the `site-publish.json` marker in `deploy-develop` before it starts. It fails unless `master` points at the commit that preview was built from, and builds that exact commit. That way logos.co shows the same media you reviewed on dev.logos.co, even if someone edited Strapi in between. An expired artifact means building a new staging preview.

[apps/web/vercel.json](../apps/web/vercel.json) sets the build command for Vercel preview deployments.

The web, API and CMS `vercel.json` files use [`scripts/vercel-ignore-build.mjs`](../scripts/vercel-ignore-build.mjs) as the ignored build step. It skips the build when nothing the app builds from changed since the last deployment of the branch, or since `develop` for a new branch. That covers the app, its workspace dependencies, `packages/config`, `content/` for apps using `@repo/content` and the root build files. Changes to docs folders, READMEs and tests are not counted. A redeploy, or a commit equal to the one it is compared with, always builds.

## API (apps/api)

Deployed on Vercel. [apps/api/vercel.json](../apps/api/vercel.json) sets the build command to `pnpm turbo run build --filter=api`.

- Staging: `https://logos-web-api-git-develop-status-im-web.vercel.app`
- Production: `https://logos-web-api.vercel.app`

## CMS (apps/cms)

The CMS ships as a Docker image. [Jenkinsfile](../Jenkinsfile) builds [`apps/cms/Dockerfile`](../apps/cms/Dockerfile) and pushes it to `harbor.status.im` as `logos-web/logos-cms`. `NEXT_PUBLIC_SERVER_URL` and `NEXT_PUBLIC_WEB_URL` are build args, so they are baked into the image: `cms.logos.co` in production and `dev-cms.logos.co` in staging. `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` is passed as a BuildKit secret rather than a build arg. The image is built in its own stage from a fresh checkout, the only one with the Docker socket, and always pushed with the `harbor-logos-web-robot` credential.

[docker-compose.prod.yml](../docker-compose.prod.yml) runs that image next to a self-hosted Postgres, and the container entrypoint applies SQL migrations on boot. Setup details are in [apps/cms/docs/deployment.md](../apps/cms/docs/deployment.md).

There is also an [apps/cms/vercel.json](../apps/cms/vercel.json) (region `iad1`, hourly cron on `/api/health`), but the production path in this repo is the Docker image.

## Demos (apps/logos-demos)

Deployed on Vercel. [apps/logos-demos/vercel.json](../apps/logos-demos/vercel.json) sets the build command to `pnpm turbo run build --filter=logos-demos`.

## CRM (apps/logos-crm)

Runs locally or in Docker with [apps/logos-crm/compose.yaml](../apps/logos-crm/compose.yaml) and [apps/logos-crm/Dockerfile](../apps/logos-crm/Dockerfile). This repo has no Jenkins or Vercel config for it, so where it runs in production isn't recorded here. See [apps/logos-crm/docs/deployment.md](../apps/logos-crm/docs/deployment.md).

## CI

[.github/workflows/test.yml](../.github/workflows/test.yml) runs `pnpm test:release` on every pull request and on pushes to `develop` and `master`. It runs with a read-only `GITHUB_TOKEN`, starts a Postgres 17 service and passes the token to the `test:release` step only, for the build-time RFP fetch. For media, it passes the committed press snapshot as `PRESS_CONTENT_SNAPSHOT` and two representative covers as `PRESS_MEDIA_IMAGE_FIXTURES_DIR`. The normal image generator resizes these covers, and the static checks still verify exported assets and search links. This fixture directory is used only by CI.

[.github/workflows/e2e-daily.yml](../.github/workflows/e2e-daily.yml) runs the Playwright suite in [`e2e/`](../e2e/README.md) every day at 05:47 UTC against dev.logos.co (staging) and logos.co (production), in both Chromium and Firefox, checking every sitemap entry. The matrix gives four jobs, one per site and browser; each job installs only its browser and runs `pnpm test:e2e --project=<browser>`. You can also start it by hand through `workflow_dispatch`. It also runs on pull requests that change `e2e/package.json` or the workflow file itself, so a Playwright upgrade is tested against both sites before merge. On the default branch, a failed run opens or comments on the issue labelled `e2e-daily`, and the next green run closes it; runs on other branches and on pull requests leave the issue alone. Each ref gets its own concurrency group (`e2e-daily-${{ github.ref }}`), so pull request runs do not queue behind the daily run. Each job keeps its HTML report and traces as the `e2e-daily-<environment>-<browser>` run artifact for 14 days. The workflow reads the optional `E2E_BYPASS_TOKEN` secret and sends it as the `x-e2e-bypass` header, so the server can exempt the run from bot protection and rate limits. It also passes the workflow's `GITHUB_TOKEN` to the tests, so the Basecamp test can look up the latest release through the authenticated GitHub API: anonymous requests to github.com time out when GitHub is under load.

[.github/dependabot.yml](../.github/dependabot.yml) checks npm every day at 04:00 for new releases of `@playwright/test` and `playwright`, and groups them (with `playwright-core`) into one PR with the `chore(e2e)` commit prefix. It skips releases younger than 3 days, which also keeps the lockfile update clear of pnpm 11's 1-day `minimumReleaseAge`. The suite runs on Playwright's own Chromium and Firefox builds, so these PRs keep both browsers current. [.github/workflows/playwright-reviewers.yml](../.github/workflows/playwright-reviewers.yml) requests reviews on these PRs from the logins in its `REVIEWERS` variable, since Dependabot no longer has a `reviewers` option. Merge them by hand once the E2E run passes. Security updates for other dependencies are unaffected. Dependabot PRs only read Dependabot secrets, so `E2E_BYPASS_TOKEN` needs a copy there too.

Every third-party action and reusable workflow is pinned to a commit SHA, with the tag it came from in a trailing comment. Bump both together.
