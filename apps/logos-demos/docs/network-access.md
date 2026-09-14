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

### Testnet nodes: public, and what the demo uses

`deployment/.env.testnet` in `logos-blockchain` names `PUBLIC_IP_ADDR=65.109.51.37`
with node API ports 18080-18083. **All four are publicly reachable**, checked
2026-09-07.

```
http://65.109.51.37:18080/cryptarchia/info      chain tip, height, slot, lib, state, phase
http://65.109.51.37:18080/cryptarchia/headers   121 recent header hashes
http://65.109.51.37:18080/network/info          peer id, listen addresses, connected peers
http://65.109.51.37:18080/blend/info            node id, core info
http://65.109.51.37:18080/mempool/add/tx        405 to a GET; the only write surface
```

Everything else probed returned 404.

**They send `access-control-allow-origin: *`**, so a browser is welcome to call
them. It cannot: they are plain HTTP and the demo is HTTPS, so mixed-content
blocking stops the request before it leaves the page. That, not CORS, is why
the demo has a route handler.

**The chain is live.** Measured on 2026-09-07: height moved 7687 to 7709 over
about forty minutes, a block every 30 to 90 seconds. Note `state: "Online"`
reports the process, not production, so it says `Online` either way.

`height` and `slot` are Cryptarchia's base-chain counters and unrelated to LEZ
block numbers.

### LEZ block explorer: public, not used

**https://explorer.testnet.lez.logos.co/** is public and works. The demo used
it before moving to the nodes, and it is still the only way to see LEZ
execution-zone blocks.

It is a Leptos WASM app whose API is server functions with a build hash in the
path, recoverable from the WASM with `strings`. Bodies must be form-encoded;
JSON returns `Args|missing field 'limit'`. It sends **no CORS headers**, and
`OPTIONS` returns 405.

Its index was last updated 30 August, showing LEZ block 30017, while the base
chain has kept producing. A stale LEZ indexer is not a stalled chain.

### Other blockchain endpoints: not public

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
