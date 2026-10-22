# Deployment

How this app ships, and the traps in this monorepo. Current as of 2026-10-22.

## Vercel project

Project `logos-demos` on the **IFT** team (`status-im-web`).

| Setting               | Value                                                                            |
| --------------------- | -------------------------------------------------------------------------------- |
| Root Directory        | `apps/logos-demos`                                                               |
| Framework             | Next.js                                                                          |
| Build Command         | from `apps/logos-demos/vercel.json`: `pnpm turbo run build --filter=logos-demos` |
| Deployment Protection | off, so preview URLs are shareable without a Vercel account                      |

Protection is off to match `logos-crm` and `logos-co-web`. It means anyone with
the link can open a deployment, which is the point for a demo.

Production URL: **https://logos-demos.vercel.app**

## Git integration

The project is connected to `logos-co/logos-web` with production branch
`develop`. Pull requests get preview deployments, Vercel skips the ones that do
not affect the app, and merging to `develop` updates the production URL.

Keep Root Directory at `apps/logos-demos` and leave the Ignored Build Step
empty. The root-directory check runs before the ignore command, and moving the
Root Directory to the repo root fails with `No Next.js version detected`.

## Never run `vercel deploy` from the repo root

The repo root has its own `.vercel/project.json`, and it points at
**`logos-co-web`**, the project behind the live logos.co site. Running
`vercel deploy --prod` there deploys `apps/web` to that project.

This happened on 2026-09-03. `logos.co` itself was unaffected, but the
deployment took over `logos-co-web-alpha.vercel.app` and
`logos-co-web-status-im-web.vercel.app` until the previous production deployment
was promoted back:

```
POST /v10/projects/<projectId>/promote/<deploymentId>
```

Promotion reclaims the aliases. Note it only accepts a deployment whose target
is already `production`; a preview deployment cannot be promoted, so redeploy
the same commit with `target: production` instead.

**Check which project you are about to deploy to, every time:**

```sh
cat .vercel/project.json
```

Do not use `--prod` to test whether deploying works. Use a preview target.

`cd`-ing into `apps/logos-demos` does not help either: the CLI appends the
project's Root Directory again and fails on `apps/logos-demos/apps/logos-demos`.

## Build notes

Build through turbo, never `pnpm --filter logos-demos build`. `@acid-info/logos-ui`
is a build dependency and only the orchestrator builds it, so the app build alone
fails on a clean checkout.

Every page is prerendered (`○ prerendered as static content`). The only
server-rendered entries should be the read-only proxy routes (`ƒ`):

```
├ ƒ /api/chain
├ ƒ /api/chain/search
├ ƒ /api/chain/stream
├ ƒ /api/storage/fleet
├ ○ /blockchain
└ ○ /messaging
```

If a page route turns from `○` into `ƒ`, or an API route appears that is not one
of these proxies, something has quietly added a server dependency and the claims
on the pages need re-reading.

## Turbopack serves stale CSS

After editing `globals.css`, restart the dev server:

```sh
rm -rf apps/logos-demos/.next
```

This bit twice while building the dialog. Both times the symptom was "my fix did
nothing", and both times the fix was correct and simply not being served. If a
style change appears to have no effect, rule this out before debugging the CSS.

## Deployment facts are runtime facts, not build-time ones

A statically prerendered page freezes anything it reads from `process.env` at
build time, and the build does not even see most variables: `turbo.json`
declares an `env` allowlist and Turborepo strips the rest. Ask a route handler
instead, which runs per request and needs no declaration. `src/lib/site.ts`
holds the site URL and description as constants for exactly this reason.

## End-to-end against a deployment

`E2E_BASE_URL=<url> pnpm --filter logos-demos test:e2e` skips the dev server
and drives that deployment instead. Do this before calling a fix done: both
bugs the suite has caught so far only appeared on a real build, and a local
pass said nothing about either.

The suite starts a fresh dev server each run, so stop any dev server already on
port 3005 (the Browser pane runs one) or the run fails immediately. It used to
reuse a running one, and a run then reused a server started before the fix
under test and reported it broken. Set `E2E_REUSE_SERVER=1` to opt back in, but
not while judging whether a change worked.
