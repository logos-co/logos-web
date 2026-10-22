# The blockchain demo

How the Logos Blockchain demo reads the testnet, and the parser trap its proxy
creates. Code: [`src/app/api/chain/`](../src/app/api/chain),
[`src/lib/chain-nodes.ts`](../src/lib/chain-nodes.ts),
[`src/lib/cryptarchia.ts`](../src/lib/cryptarchia.ts),
[`src/components/use-chain.ts`](../src/components/use-chain.ts) and
[`use-chain-stream.ts`](../src/components/use-chain-stream.ts).

## The nodes, and why there is a proxy

The demo reads the four testnet nodes named in `deployment/.env.testnet` in
`logos-blockchain`: `PUBLIC_IP_ADDR` with API ports 18080 to 18083. They are
public and send `access-control-allow-origin: *`.

The proxy exists because of mixed content. The nodes speak plain HTTP and this
app is served over HTTPS, so the browser blocks the request before sending it.
If the nodes ever get TLS, delete the route and call them from the page. Keep
the proxy read-only: the nodes also expose write surfaces (`/mempool/add/tx`
and the wallet routes), and nothing here should go near them.

There are three routes. `/api/chain` skips any node that doesn't answer and
renders the rest, so one quiet node doesn't take the view down.
`/api/chain/stream` turns the node's newline-delimited block stream into
server-sent events. `/api/chain/search` looks a query up against blocks,
transactions and accounts, and answers `kind: "none"` when nothing matches.

The block page at `/blockchain/block/[id]` is server-rendered and calls the lead
node directly, so it needs no route of its own.

## Two shapes, two parsers

`/api/chain` normalises what the nodes return, so the same record exists in two
shapes and `src/lib/cryptarchia.ts` has a parser for each. `parseNodeStatus`
reads the node's shape and only the route handler uses it. `parseChainView`
reads the normalised shape and only client code uses it. The time parsers split
the same way: `parseChainTime` takes the node's shape and runs on the server,
`parseChainTimeSummary` takes the normalised one.

Using the wrong parser fails silently. Both take `unknown`, so there is no type
error, and a parser that finds no fields returns null and the row is dropped, so
there is no runtime error either. You just get an empty list. This happened
twice on the earlier explorer-based version. If a panel renders empty while its
route returns data, check this first.

`/api/storage/fleet` avoids the trap by passing the roster through unchanged:
one shape, and one parser (`parseFleet`) on the client.

## Reading the chain

`state: "Online"` means the node process is up, and says nothing about whether
blocks are being produced. The demo measures liveness by watching when the
height last changed. We measured a block every 30 to 90 seconds, so the stall
threshold is time-based (`STALL_AFTER_MS`, five minutes) and well above the
longest gap we saw. A threshold counted in polls flapped between normal blocks.

Cryptarchia's `height` and `slot` are the base chain's own counters and have
nothing to do with LEZ block numbers, which come from a different layer and a
separate indexer. The demo shows the base chain only; the LEZ explorer is
covered in [network-access.md](network-access.md).
