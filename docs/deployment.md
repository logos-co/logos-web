# Deployment

Which branch deploys where, and how each app gets there. It covers [`Jenkinsfile`](../Jenkinsfile), [`.github/workflows/site-publish.yml`](../.github/workflows/site-publish.yml), [`.github/workflows/test.yml`](../.github/workflows/test.yml), the per-app `vercel.json` files (for example [`apps/web/vercel.json`](../apps/web/vercel.json)) and [`docker-compose.prod.yml`](../docker-compose.prod.yml).

## Branches

| Branch           | Role                                                     |
| ---------------- | -------------------------------------------------------- |
| `develop`        | Default branch and staging. CMS content PRs target it.   |
| `master`         | Production.                                              |
| `deploy-develop` | Built static site for staging, served at `dev.logos.co`. |
| `deploy-master`  | Built static site for production, served at `logos.co`.  |

Branch protection blocks direct pushes to `develop` and `master`. The `deploy-*` branches are written by the build jobs below, never by hand.

## Static site (apps/web)

The site is a static export of `apps/web/out`, built with `pnpm turbo run build --filter=web --force`. The `--force` is deliberate: Turbo hashes source files, and most of the media comes from an external CMS, so a cache hit could ship last week's articles. Builds that fetch that media run `scripts/capture-press-snapshot.ts` first and pass the result through `PRESS_CONTENT_SNAPSHOT`, so feeds, cards and article pages all use one fetch.

Two jobs can build and publish it.

[Jenkinsfile](../Jenkinsfile) builds the web app with `STRAPI_API_KEY` and `SIMPLECAST_ACCESS_TOKEN`, because the /media pages come from the blog CMS and Simplecast, then pushes `apps/web/out` to `deploy-develop` or `deploy-master` with `ghp-import`. Unless it runs in site publish mode, the same run also builds the CMS image (see below).

[site-publish.yml](../.github/workflows/site-publish.yml) rebuilds only the static site and leaves the Payload image alone. It runs on a `site-publish` `repository_dispatch` (the CMS sends one from its dashboard) or by hand through `workflow_dispatch`, checks out `develop` for dev or `master` for production, builds, and publishes the export to the matching deploy branch with [`scripts/site-publish/publish.mts`](../scripts/site-publish/publish.mts). Jenkins has the same mode behind its `SITE_PUBLISH` parameter.

Successful staging builds save the media they fetched as a `press-snapshot.json` artifact, kept 14 days in the workflow. A production publish names the latest successful staging run (`previewBuild` in the workflow, `PREVIEW_BUILD` in Jenkins), reuses its snapshot and checks the `site-publish.json` marker in `deploy-develop` before it starts. That way logos.co shows the same media you reviewed on dev.logos.co, even if someone edited Strapi in between. An expired artifact means building a new staging preview.

[apps/web/vercel.json](../apps/web/vercel.json) sets the build command for Vercel preview deployments.

## API (apps/api)

Deployed on Vercel. [apps/api/vercel.json](../apps/api/vercel.json) sets the build command to `pnpm turbo run build --filter=api`.

- Staging: `https://logos-web-api-git-develop-status-im-web.vercel.app`
- Production: `https://logos-web-api.vercel.app`

## CMS (apps/cms)

The CMS ships as a Docker image. [Jenkinsfile](../Jenkinsfile) builds [`apps/cms/Dockerfile`](../apps/cms/Dockerfile) and pushes it to `harbor.status.im` as `logos-web/logos-cms`. `NEXT_PUBLIC_SERVER_URL` and `NEXT_PUBLIC_WEB_URL` are build args, so they are baked into the image: `cms.logos.co` in production and `dev-cms.logos.co` in staging.

[docker-compose.prod.yml](../docker-compose.prod.yml) runs that image next to a self-hosted Postgres, and the container entrypoint applies SQL migrations on boot. Setup details are in [apps/cms/docs/deployment.md](../apps/cms/docs/deployment.md).

There is also an [apps/cms/vercel.json](../apps/cms/vercel.json) (region `iad1`, hourly cron on `/api/health`), but the production path in this repo is the Docker image.

## Demos (apps/logos-demos)

Deployed on Vercel. [apps/logos-demos/vercel.json](../apps/logos-demos/vercel.json) sets the build command to `pnpm turbo run build --filter=logos-demos`.

## CRM (apps/logos-crm)

Runs locally or in Docker with [apps/logos-crm/compose.yaml](../apps/logos-crm/compose.yaml) and [apps/logos-crm/Dockerfile](../apps/logos-crm/Dockerfile). This repo has no Jenkins or Vercel config for it, so where it runs in production isn't recorded here. See [apps/logos-crm/docs/deployment.md](../apps/logos-crm/docs/deployment.md).

## CI

[.github/workflows/test.yml](../.github/workflows/test.yml) runs `pnpm test:release` on every pull request and on pushes to `develop` and `master`. It starts a Postgres 17 service and passes in `STRAPI_API_KEY` and `SIMPLECAST_ACCESS_TOKEN`, which the web build needs, plus `GITHUB_TOKEN` so the RFP fetch at build time isn't rate limited to 60 requests an hour.
