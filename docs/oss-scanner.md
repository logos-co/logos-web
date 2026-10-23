# OSS Scanner image

The offline source-analysis image, what it builds and what it leaves out. It covers [`.oss-scanner/Dockerfile`](../.oss-scanner/Dockerfile) and the matching entries in [`.dockerignore`](../.dockerignore).

The image was added in #237 so the repository can be enrolled in Anthropic's OSS Scanner. Enrolment is a separate step, and nothing in the image registers the repository.

## Building

The Dockerfile copies the whole build context into `/src`, so build it with the repo root as the context:

```bash
docker build -f .oss-scanner/Dockerfile .
```

The image starts from `node:24-bookworm-slim`, installs `ca-certificates`, `git` and `python3`, enables Corepack and runs `pnpm install --frozen-lockfile`. Once it is built, the API, CMS, content, demos and web tests pass inside it with networking disabled.

## Build coverage

After installing dependencies, the image runs:

```bash
pnpm turbo run build \
  --filter=api... \
  --filter=cms... \
  --filter=logos-crm... \
  --filter=logos-demos... \
  && pnpm --filter web check-types
```

That fully builds `apps/api`, `apps/cms`, `apps/logos-crm` and `apps/logos-demos`, and the `...` filters build the shared packages each of them depends on. `apps/web` is only type-checked, because its full static export needs external build credentials (see [deployment.md](deployment.md)). `apps/past-present-future` is copied into the image with the rest of the source but is neither built nor type-checked.

## Build-only environment values

The build step sets placeholder values that get past build-time checks. None of them is a real secret, and no database or server is reachable at those addresses during the build.

| Variable                             | Value                                              |
| ------------------------------------ | -------------------------------------------------- |
| `NEXT_TELEMETRY_DISABLED`            | `1` (set as an image `ENV`)                        |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | `AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=`     |
| `NEXT_PUBLIC_SERVER_URL`             | `http://localhost:3001`                            |
| `NEXT_PUBLIC_WEB_URL`                | `http://localhost:3000`                            |
| `DATABASE_URL`                       | `postgresql://build:build@localhost:5432/build`    |
| `PAYLOAD_SECRET`                     | `scanner-build-only-secret-at-least-32-characters` |

Only `NEXT_TELEMETRY_DISABLED` persists in the image; the others are scoped to the build command.

## Excluded and included files

The image has no ignore file of its own. It uses the repo-wide [`.dockerignore`](../.dockerignore), so a change there affects every Docker build that uses the repo root as its context, the CMS image included.

The published zine PDFs (`apps/web/public/zine/*.pdf`, see [zines.md](zines.md)) are excluded because source analysis and tests don't need them. Three files are kept as exceptions to broader rules: `apps/cms/.env.docker.example` (`.env*` files other than `.env.example` are dropped), `apps/cms/Dockerfile` (every other `Dockerfile` is dropped) and `docker-compose.prod.yml` (every other `docker-compose*.yml` is dropped). The rest of the list (`.git`, `.github`, `.env` files, build output, coverage, Vercel folders) still applies.
