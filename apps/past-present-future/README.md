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
