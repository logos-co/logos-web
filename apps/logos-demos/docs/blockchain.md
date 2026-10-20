# The blockchain demo

How the Logos Blockchain demo reads the testnet, and the trap the proxy
introduces. Code covered: `src/app/api/chain/*`, `src/lib/chain-nodes.ts`,
`src/lib/cryptarchia.ts`, `src/components/use-chain*.ts`.

## The nodes, and why there is a proxy

The nodes come from `deployment/.env.testnet` in `logos-blockchain`:
`PUBLIC_IP_ADDR` with API ports 18080-18083. They are public and send
`access-control-allow-origin: *`.

The route handler exists because of mixed content, not CORS. The nodes are plain
HTTP and this app is HTTPS, so a browser blocks the request before it is sent.
If the nodes ever get TLS, delete the route and call them from the page. The
proxy stays read-only: the nodes expose write surfaces (`/mempool/add/tx` and
the wallet routes), and nothing here goes near them.

`/api/chain` drops an unreachable node and renders the rest, so one quiet node
does not take the view down. `/api/chain/stream` re-frames the node's
newline-delimited block stream as server-sent events. `/api/chain/search`
resolves one query against blocks, transactions and accounts, answering
`kind: "none"` when nothing matches.

## Two shapes, two parsers

`/api/chain` normalises what the nodes return before answering, so there are two
shapes for the same record and two parsers in `src/lib/cryptarchia.ts`:

- `parseNodeStatus` takes the node's shape. Only the route handler uses it.
- `parseChainView` takes the normalised shape. Only client code uses it.

Using the wrong one is silent: there is no type error (both take `unknown`) and
no runtime error (a parser that finds no fields returns null and the row is
dropped), so the list comes out empty. This happened twice on the
explorer-based version. If a panel renders empty while its route returns data,
check this first. The same applies to `parseChainTime` (node shape, route only)
versus `parseChainTimeSummary` (normalised shape, client only).

`/api/storage/fleet` avoids the trap by passing the roster through unchanged:
one shape, one parser (`parseFleet`), run on the client.

## Reading the chain

`state: "Online"` means the process is up, not that blocks are being produced.
Liveness is measured by watching when the height last changed. Measured cadence
is a block every 30 to 90 seconds, so the stall threshold is time-based
(`STALL_AFTER_MS`, five minutes) and set well above the longest observed gap;
anything poll-count based flaps between normal blocks.

Cryptarchia's `height` and `slot` are the base chain's own counters. They are
unrelated to LEZ block numbers, which come from a different layer and a
separate indexer. The demo shows the base chain, not LEZ; see
[network-access.md](network-access.md) for the explorer.
