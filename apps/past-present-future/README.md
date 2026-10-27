# past-present-future

A SvelteKit app served at `/past-present-future` on the public site. Every route is prerendered with `@sveltejs/adapter-static` ([`svelte.config.js`](svelte.config.js)), and the web build copies its output into the Next.js export with [`apps/web/scripts/copy-past-present-future.sh`](../web/scripts/copy-past-present-future.sh).

## Run

```bash
pnpm --filter past-present-future dev   # http://localhost:3006/past-present-future
```

`pnpm dev:web` starts this app too: [`apps/web/next.config.mjs`](../web/next.config.mjs) rewrites `/past-present-future` to the Vite server on port `3006`, set in [`vite.config.js`](vite.config.js). The proxy doesn't carry the HMR websocket, so the browser connects to port `3006` directly.

## Build

```bash
pnpm --filter past-present-future build
```

The build writes static HTML to `build/`. [`svelte.config.js`](svelte.config.js) sets the pages and assets directories explicitly because `adapter-static` otherwise detects Vercel and writes to `.vercel/output/static`. It also names the build after a hash of `src/` rather than SvelteKit's default timestamp, so unchanged sources produce identical output instead of renaming every hashed chunk on each deploy.

In a full web build, Turbo builds this app first because `apps/web` lists it as a workspace dependency, then the copy script drops `build/` into `apps/web/out/past-present-future`.

## Museum exhibit submissions

The museum's hero and footer buttons open [`ExhibitSubmissionModal.svelte`](src/lib/components/ExhibitSubmissionModal.svelte). The form collects an optional name (50 characters) and X handle (15), an exhibition, a historic event (300) and a primary source HTTP/HTTPS URL (100). Escape, the close button and the backdrop close the modal; unsent answers are retained while the page stays open.

[`museum-submission.js`](src/lib/museum-submission.js) posts JSON to the admin-acid `/api/forms/museum` endpoint. [`vite.config.js`](vite.config.js) resolves `NEXT_PUBLIC_API_MODE` at build time: `development` uses `http://localhost:3003`, `staging` uses `https://dev-admin-acid.logos.co`, and `production` uses `https://admin-acid.logos.co`. Vite dev defaults to development; builds default to production. Turbo includes the mode in this app's build inputs. Set it explicitly for staging builds.

The matching admin-acid endpoint must be deployed before enabling this flow publicly. It sends to `pressengine@logos.co` through its existing SMTP account. The modal shows completion only after the API confirms success, preserves answers on failure and never automatically retries. To test locally, run that backend on port 3003 with `IS_DEV_ENV=true` and a local SMTP sink.
