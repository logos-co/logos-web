# logos-demos

Browser demos of the Logos stack. They run locally on http://localhost:3005.
Visitors need no install and no account, and we run no infrastructure for them.

Today you get into Logos through Basecamp, a desktop shell you download and
install. These demos put the same technology behind a link: each one is a page
that talks to the network from the visitor's browser.

| Route         | What it shows                                                            |
| ------------- | ------------------------------------------------------------------------ |
| `/messaging`  | Logos Messaging: the tab runs a light node and messages other tabs       |
| `/blockchain` | Logos Blockchain: live blocks and consensus state from the testnet       |
| `/storage`    | Logos Storage: the address the network would give a file, and the roster |

Messaging has no server of ours in its path. Blockchain and Storage read through
read-only proxies because a browser can't reach their endpoints, and each page
says which kind it is. Nothing here stores anything on the Logos Storage
network; [docs/research/browser-viability.md](docs/research/browser-viability.md)
explains what a browser can and can't do.

## Run

From the repo root:

    pnpm turbo run dev --filter=logos-demos...   # http://localhost:3005
    pnpm turbo run build --filter=logos-demos
    pnpm --filter logos-demos test
    pnpm --filter logos-demos test:e2e

Always build through turbo. `pnpm --filter logos-demos build` on its own fails
on a clean checkout, because `@acid-info/logos-ui` has to be built first.

## Environment

The app reads one optional variable at build time, `NEXT_PUBLIC_SITE_URL`, the
public URL used in metadata, `robots.txt` and the sitemap (default
`http://localhost:3005`, see `src/lib/site.ts`). The e2e suite takes `E2E_BASE_URL` and
`E2E_REUSE_SERVER`, described in [docs/deployment.md](docs/deployment.md).

## Deploy

There is no hosted deployment; the app runs locally. See
[docs/deployment.md](docs/deployment.md).

## More

- [docs/README.md](docs/README.md) lists the reference docs.
- [AGENTS.md](AGENTS.md) has the rules for coding agents.
