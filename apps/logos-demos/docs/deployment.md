# Deployment

How `apps/logos-demos` is built and run, and the build and dev server traps in
this monorepo. Config: [`playwright.config.ts`](../playwright.config.ts),
[`src/lib/site.ts`](../src/lib/site.ts) and the root `turbo.json`.

## No hosted deployment

The repo no longer configures a hosted deployment for the app: `vercel.json` is
gone, and the app runs locally on port 3005 (`pnpm dev`, or
`pnpm turbo run build --filter=logos-demos` then
`pnpm --filter logos-demos start`).

`SITE_URL` in `src/lib/site.ts` comes from `NEXT_PUBLIC_SITE_URL` at build time
and defaults to `http://localhost:3005`, so `robots.txt`, the sitemap and the
Open Graph metadata point at the local server unless you set it. If the demos
get a hosted home again, set the variable for that build and add Deployment
Protection or decide explicitly that previews are public.

## Never run `vercel deploy` from the repo root

The repo root has its own `.vercel/project.json`, and it points at
`logos-co-web`, the project behind the live logos.co site. Running
`vercel deploy --prod` there deploys `apps/web` to that project.

That happened on 2026-09-03. `logos.co` itself was fine, but the deployment took
over `logos-co-web-alpha.vercel.app` and
`logos-co-web-status-im-web.vercel.app` until we promoted the previous
production deployment back:

```
POST /v10/projects/<projectId>/promote/<deploymentId>
```

Promotion takes the aliases back. It only accepts a deployment whose target is
already `production`; you can't promote a preview, so redeploy the same commit
with `target: production` instead.

**Check which project you are about to deploy to, every time:**

```sh
cat .vercel/project.json
```

Don't use `--prod` to find out whether deploying works; use a preview target.
Running the CLI from `apps/logos-demos` doesn't help either: it appends the
project's Root Directory again and fails on `apps/logos-demos/apps/logos-demos`.

## Build notes

Build through turbo, never `pnpm --filter logos-demos build`.
`@acid-info/logos-ui` is a build dependency that only turbo builds, so building
the app alone fails on a clean checkout.

The demo pages (`/`, `/messaging`, `/blockchain`, `/storage`) are prerendered
(`○` in the build output). The server-rendered entries (`ƒ`) should be the four
read-only proxy routes and the block page:

```
ƒ /api/chain
ƒ /api/chain/search
ƒ /api/chain/stream
ƒ /api/storage/fleet
ƒ /blockchain/block/[id]
```

If a demo page turns from `○` into `ƒ`, or a new server route appears,
something has added a server dependency and the claims on the pages need
re-reading.

## Turbopack serves stale CSS

After editing `globals.css`, clear the cache and restart the dev server:

```sh
rm -rf apps/logos-demos/.next
```

This bit us twice while building the dialog. Both times the fix was correct and
just wasn't being served, so it looked like it did nothing. If a style change
seems to have no effect, rule this out before you debug the CSS.

## Deployment facts are runtime facts

A prerendered page freezes anything it reads from `process.env` at build time,
and the build doesn't see most variables anyway: `turbo.json` declares an `env`
allowlist and Turborepo strips the rest. If you need something about the
deployment, ask a route handler, which runs per request and needs no
declaration. The one exception is `NEXT_PUBLIC_SITE_URL`, which is declared in
`turbo.json` and meant to be frozen into the build.

## End-to-end against a deployment

`E2E_BASE_URL=<url> pnpm --filter logos-demos test:e2e` skips the dev server and
runs the suite against that deployment. Do this before calling a fix done: both
bugs the suite has caught so far showed up only on a real build, and the local
runs passed.

Without `E2E_BASE_URL`, the suite starts a fresh dev server on port 3005 each
run, so stop any dev server already on that port (the Browser pane runs one) or
the run fails straight away. It used to reuse a running server, until a run
reused one started before the fix under test and reported the fix broken. Set
`E2E_REUSE_SERVER=1` to reuse a server anyway, but not while judging whether a
change worked.
