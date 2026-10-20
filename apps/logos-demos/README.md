# logos-demos

Self-contained browser demos of the Logos stack, at
https://logos-demos.vercel.app. No install, no account, no infrastructure for
us to run.

The entry point to Logos today is Basecamp, a desktop shell you download and
install. These demos put the same technology behind a link: each one is a
static page that talks to the network directly from your browser.

## Demos

| Route         | What it shows                                                                  |
| ------------- | ------------------------------------------------------------------------------ |
| `/messaging`  | Logos Messaging: this tab as a light node, exchanging messages with other tabs |
| `/blockchain` | Logos Blockchain: live blocks and consensus state from the testnet             |
| `/storage`    | Logos Storage: the address the network would give a file, plus the live roster |

The messaging demo has no server of ours in its path. The other two read
through read-only proxies for endpoints a browser cannot reach, and each page
says which it is. Nothing here stores anything on the Logos Storage network:
see [docs/research/browser-viability.md](docs/research/browser-viability.md)
for what a browser can and cannot do.

## Run

    pnpm --filter logos-demos dev            # http://localhost:3005
    pnpm turbo run build --filter=logos-demos
    pnpm --filter logos-demos test
    pnpm --filter logos-demos test:e2e

Build through turbo, never `pnpm --filter logos-demos build`:
`@acid-info/logos-ui` is a build dependency.

## Deploy

Vercel project `logos-demos`, built with the turbo command in `vercel.json`.
See [docs/deployment.md](docs/deployment.md).

## More

- [Docs](docs/README.md)
- [Agent guide](AGENTS.md)
