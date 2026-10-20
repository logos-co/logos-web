# Deployment

Branches, CI and what deploys where. Covers [`Jenkinsfile`](../Jenkinsfile), [`.github/workflows/site-publish.yml`](../.github/workflows/site-publish.yml), [`.github/workflows/test.yml`](../.github/workflows/test.yml), the per-app [`vercel.json`](../apps/web/vercel.json) files and [`docker-compose.prod.yml`](../docker-compose.prod.yml).

## Branches

| Branch           | Role                                                           |
| ---------------- | -------------------------------------------------------------- |
| `develop`        | Default branch + staging. CMS-generated content PRs target it. |
| `master`         | Production. Created when production deploys spin up.           |
| `deploy-develop` | Static site output for staging (`dev.logos.co`).               |
| `deploy-master`  | Static site output for production (`logos.co`).                |

Direct pushes to `develop` and `master` are blocked by branch protection.

## Static site: apps/web

Built with `pnpm turbo run build --filter=web` and published as a static export of `apps/web/out`.

- [Jenkinsfile](../Jenkinsfile) builds the web app (resolving media via `STRAPI_API_KEY` and `SIMPLECAST_ACCESS_TOKEN`), then pushes `apps/web/out` to `deploy-develop` or `deploy-master` with `ghp-import`. Staging serves `dev.logos.co`, production `logos.co`.
- [site-publish.yml](../.github/workflows/site-publish.yml) is a GitHub Actions path (triggered by `repository_dispatch` `site-publish` or `workflow_dispatch`) that rebuilds the static site from the CMS without rebuilding the Payload image. It checks out `develop` (dev) or `master` (production), builds, then publishes the export to the matching deploy branch via [`scripts/site-publish/publish.mts`](../scripts/site-publish/publish.mts).
- [apps/web/vercel.json](../apps/web/vercel.json) sets the Vercel build command for preview deployments.

## API: apps/api

Deploys to Vercel. [apps/api/vercel.json](../apps/api/vercel.json) sets the build command (`pnpm turbo run build --filter=api`).

- Staging: `https://logos-web-api-git-develop-status-im-web.vercel.app`
- Production: `https://logos-web-api.vercel.app`

## CMS: apps/cms

Deployed as a Docker image, not a static site.

- [Jenkinsfile](../Jenkinsfile) builds [`apps/cms/Dockerfile`](../apps/cms/Dockerfile) and pushes it to `harbor.status.im` as `logos-web/logos-cms`. `NEXT_PUBLIC_SERVER_URL` and `NEXT_PUBLIC_WEB_URL` are baked in at build time (`cms.logos.co` in production, `dev-cms.logos.co` in staging).
- [docker-compose.prod.yml](../docker-compose.prod.yml) runs the image with a self-hosted Postgres; its entrypoint applies SQL migrations on boot. See [apps/cms/docs/deployment.md](../apps/cms/docs/deployment.md).
- [apps/cms/vercel.json](../apps/cms/vercel.json) exists (region `iad1`, an hourly `/api/health` cron), but the in-repo production path is the Docker image.

## Demos: apps/logos-demos

Deploys to Vercel. [apps/logos-demos/vercel.json](../apps/logos-demos/vercel.json) sets the build command (`pnpm turbo run build --filter=logos-demos`).

## CRM: apps/logos-crm

Runs locally or in Docker via [apps/logos-crm/compose.yaml](../apps/logos-crm/compose.yaml) and [apps/logos-crm/Dockerfile](../apps/logos-crm/Dockerfile). No Jenkins or Vercel config exists in this repo, so the production deploy target is unknown. See [apps/logos-crm/docs/deployment.md](../apps/logos-crm/docs/deployment.md).

## CI

[.github/workflows/test.yml](../.github/workflows/test.yml) runs `pnpm test:release` on every pull request and on pushes to `develop` and `master`. It starts a Postgres 17 service and provides the secrets the build needs (`STRAPI_API_KEY`, `SIMPLECAST_ACCESS_TOKEN`).
