# past-present-future

A SvelteKit app rendered at `/past-present-future` on the public site. Every
route is prerendered with `@sveltejs/adapter-static`; the static output is
copied into the Next.js export by `apps/web`.

## Run

    pnpm --filter past-present-future dev   # http://localhost:3006

## Build

    pnpm --filter past-present-future build

The build writes static HTML to `build/` (see [`svelte.config.js`](svelte.config.js)
for the adapter and base path). In a full web build, Turbo builds this app first
because it is a workspace dependency of `apps/web`, then
[`apps/web/scripts/copy-past-present-future.sh`](../web/scripts/copy-past-present-future.sh)
copies `build/` into `apps/web/out/past-present-future`.

## Dev proxy

[`apps/web/next.config.mjs`](../web/next.config.mjs) rewrites
`/past-present-future` to this app's Vite server (port `3006`, set in
[`vite.config.js`](vite.config.js)) in development. The HMR websocket connects
directly to that port, not through the proxy.

## More

- [`svelte.config.js`](svelte.config.js): adapter, base path, deterministic
  version hash
