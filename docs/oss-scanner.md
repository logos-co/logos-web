# OSS Scanner image

How the offline source-analysis image is built, what it covers and what it leaves out. It covers [`.oss-scanner/Dockerfile`](../.oss-scanner/Dockerfile) and the matching entries in [`.dockerignore`](../.dockerignore).

The image exists so the repository can be enrolled in the OSS Scanner. Enrolment is a separate step: the image does not register the repository anywhere.

## Building

The Dockerfile copies the whole build context into `/src`, so build it with the repo root as the context:

```bash
docker build -f .oss-scanner/Dockerfile .
```

The image starts from `node:24-bookworm-slim`, installs `ca-certificates`, `git` and `python3`, enables Corepack and runs `pnpm install --frozen-lockfile`. With the image built, the API, CMS, content, demos and web tests pass with networking disabled.

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

The `...` filters also build the shared packages each app depends on.

| Workspace          | What the image does    |
| ------------------ | ---------------------- |
| `apps/api`         | Full build.            |
| `apps/cms`         | Full build.            |
| `apps/logos-crm`   | Full build.            |
| `apps/logos-demos` | Full build.            |
| `apps/web`         | Type check only.       |
| Shared packages    | Built as dependencies. |

`apps/web` is only type-checked because its full static export needs external build credentials (see [deployment.md](deployment.md)). `apps/past-present-future` is copied into the image with the rest of the source but is not built or type-checked.

## Build-only environment values

The build step sets placeholder values that satisfy build-time checks without granting access to any service. None of them are real secrets, and no database or server is reachable at those addresses during the build.

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

The image uses the repo-wide [`.dockerignore`](../.dockerignore), so these entries apply to every Docker build that uses the repo root as its context.

- Published zine PDFs (`apps/web/public/zine/*.pdf`) are excluded. They are not needed for source analysis or tests. See [zines.md](zines.md) for what they are.
- `apps/cms/.env.docker.example` is kept, as an exception to the rule that drops `.env*` files other than `.env.example`.
- `apps/cms/Dockerfile` is kept, as an exception to the rule that drops every `Dockerfile`.
- `docker-compose.prod.yml` is kept, as an exception to the rule that drops `docker-compose*.yml`.

The other existing exclusions (`.git`, `.github`, `.env` files, build output, coverage, Vercel folders) still apply.
