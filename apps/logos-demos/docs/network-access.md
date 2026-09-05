# Networks and endpoints

Everything below was checked on **2026-09-04** unless stated otherwise. Re-check
before relying on any of it.

## Fleets dashboard

**https://fleets.logos.co/** is public and lists the team's fleets and hosts.
This is the fastest way to see what is actually running.

Two fleets, three service types:

| Fleet | Services |
| --- | --- |
| `logos.test` | `logos-node-delivery`, `logos-node-storage` on `node-01/02.<region>.logos.test.status.im` |
| `logos.dev` | `logos-node-delivery`, `logos-node-storage`, `logos-node-blockchain` on `<service>-01/02.<region>.logos.dev.status.im` |

Regions: `do-ams3`, `gc-us-central1-a`, `ac-cn-hongkong-c`.

The dashboard links each host's `config.toml` and its Consul health check. The
`config.toml` links returned nothing from outside the network when tried, so
treat the per-host detail as internal.

**https://fleets.logos.co/logos-test/storage-network.json** is public and
returns the storage fleet as JSON: `host`, `role`, `peerId`, `spr`, `tcpSpr`,
`mixPubKey`, `libp2pPubKey`, `address`, `port`. `logos-dev/storage-network.json`
exists too.

## Storage network

`logos.test` and `logos.dev` are live. The bootstrap sets are compiled into the
node image and listed in
[`network_presets.json`](https://github.com/logos-storage/logos-storage-nim/blob/master/network_presets.json),
six records each.

`logos-monitoring` describes `logos.test` as "currently the populated network",
and its own crawler joins by running a node:

```
docker run logosstorage/logos-storage-nim --network=logos.test \
  --api-bindaddr=0.0.0.0 --api-port=8080 --disc-port=8090 --nat=none
```

Discovery is **outbound UDP**, so joining needs no public IP and no port
forwarding. The node's REST API is at `/api/storage/v1`, and the node accepts
`--api-cors-origin`.

**There is no public storage HTTP gateway, and this was checked properly.** All
six `logos.test` fleet nodes refuse connections on port 8080, and none of
`storage.logos.co`, `api.storage.logos.co`, `gateway.storage.logos.co`,
`testnet.storage.logos.co`, `storage.testnet.logos.co` or `codex.logos.co`
resolve. Every consumer runs a node; see
[browser-viability.md](./browser-viability.md) for the full account and for what
would change it.

## Blockchain

### LEZ block explorer — public

**https://explorer.testnet.lez.logos.co/** is public, needs no login, and works.
It is a Leptos WASM app. Its API is a set of Leptos server functions whose paths
carry a hash suffix; extract them from the WASM with `strings`:

```
POST /api/get_blocks<hash>
POST /api/get_block_by_id<hash>      POST /api/get_block_by_hash<hash>
POST /api/get_transaction<hash>      POST /api/get_account<hash>
POST /api/get_transactions_by_account<hash>   POST /api/search<hash>
```

**The body must be form-encoded.** JSON returns `Args|missing field 'limit'`
even when the JSON contains `limit`.

```sh
curl -X POST https://explorer.testnet.lez.logos.co/api/get_blocks<hash> \
  -H 'Content-Type: application/x-www-form-urlencoded' -d 'limit=3'
```

Returns real block data: `header` with `block_id`, `prev_block_hash`, `hash`,
`timestamp`, `signature`, and `body.transactions`.

The hash suffix is a build artefact of Leptos server functions. **It will change
when the explorer is rebuilt**, so resolve it at runtime from the WASM rather
than hard-coding it, or accept that it needs updating.

All seven take form-encoded bodies. Their arguments, discovered from the error
messages they return when called empty:

| Function | Arguments |
| --- | --- |
| `get_blocks` | `limit` |
| `get_block_by_id` | `block_id` |
| `get_block_by_hash` | `block_hash` |
| `get_transaction` | `tx_hash` |
| `get_account` | `account_id` |
| `get_transactions_by_account` | `account_id`, `offset`, `limit` |
| `search` | `query` |

`search` returns `{blocks, transactions, accounts}` and works out for itself
whether a query is a block id, a transaction hash or an account address. Note
its accounts arrive as `[id, account]` tuples, while `get_account` returns the
account alone.

**No CORS.** `OPTIONS` on a server function returns `405 Method Not Allowed`
with no `Access-Control-Allow-Origin`, so a browser on another origin cannot
call it. Server-to-server calls are unaffected, which is why the demo proxies
through a route handler. See [browser-viability.md](./browser-viability.md).

**The chain was stalled when checked.** The newest block was 30017 at
`2026-08-30 09:55:07 UTC`, five days before this was written. Confirm the chain
is producing blocks before presenting a live view of it.

### Other blockchain endpoints — not public

- `testnet.blockchain.logos.co` is behind an **OAuth2 Proxy requiring Github
  sign-in**. The nginx config in `logos-blockchain/deployment/nginx/run.conf`
  shows what sits behind it: `/explorer/` with SSE block streaming,
  `/faucet-backend/`, and a protected `/otlp/`. The SSE stream would be the
  better data source if it were ever opened.
- `devnet.blockchain.logos.co` serves Grafana; `/explorer/` is 404.
- `deployment/.env.testnet` names `PUBLIC_IP_ADDR=65.109.51.37` with node APIs
  on 18080-18083. Not verified as reachable, and not intended to be.

## Messaging

The demo in this app connects to the **public Waku fleets**, not to a Logos
fleet. `@waku/sdk` bootstraps over DNS discovery against the `SANDBOX` and
`TEST` enrtrees, which expose secure websockets that a browser can dial.

`logos.test` delivery nodes are a different network. `node-configs/waku_config.json`
shows the team using `clusterId: 16` with
`enrtree://...@boot.prod.status.nodes.status.im`. Whether those nodes expose
websockets a browser can reach was **not verified**. If they do, moving the demo
is a `networkConfig` change, not a rewrite.

Until then, web visitors meet each other but not desktop Basecamp users, and the
demo page says so.
