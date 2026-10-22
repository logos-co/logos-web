# Networks and endpoints

Which Logos networks and endpoints exist, and which of them a browser can
reach. The demos depend on this through
[`src/lib/chain-nodes.ts`](../src/lib/chain-nodes.ts),
[`src/lib/storage-fleet.ts`](../src/lib/storage-fleet.ts) and
[`src/lib/waku.ts`](../src/lib/waku.ts). Everything here was checked on
2026-09-04 unless a section gives another date; re-check before relying on it.

## Trust the browser, not curl

A missing `access-control-allow-origin` header looks like success in a terminal:
the status is 200 and the body is there. Only the browser enforces CORS. We once
wrote up `fleets.logos.co` as needing no proxy on the strength of a clean
`curl`, and the page then failed with a CORS error on first load. Open the page
and read the console before you record that something works from a browser.

## Fleets dashboard

https://fleets.logos.co/ is public and lists the team's fleets and hosts. It is
the fastest way to see what is actually running. There are two fleets:

| Fleet        | Services                                                                                                               |
| ------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `logos.test` | `logos-node-delivery`, `logos-node-storage` on `node-01/02.<region>.logos.test.status.im`                              |
| `logos.dev`  | `logos-node-delivery`, `logos-node-storage`, `logos-node-blockchain` on `<service>-01/02.<region>.logos.dev.status.im` |

Regions are `do-ams3`, `gc-us-central1-a` and `ac-cn-hongkong-c`.

The dashboard links each host's `config.toml` and its Consul health check. The
`config.toml` links returned nothing from outside the network when we tried, so
treat the per-host detail as internal.

https://fleets.logos.co/logos-test/storage-network.json is public and returns
the storage fleet as JSON with `host`, `role`, `peerId`, `spr`, `tcpSpr`,
`mixPubKey`, `libp2pPubKey`, `address` and `port`. A
`logos-dev/storage-network.json` exists too.

## Storage network

`logos.test` and `logos.dev` are both live. Their bootstrap sets, six records
each, are compiled into the node image and listed in
[`network_presets.json`](https://github.com/logos-storage/logos-storage-nim/blob/master/network_presets.json).

`logos-monitoring` describes `logos.test` as "currently the populated network",
and its crawler joins by running a node:

```
docker run logosstorage/logos-storage-nim --network=logos.test \
  --api-bindaddr=0.0.0.0 --api-port=8080 --disc-port=8090 --nat=none
```

Discovery is outbound UDP, so joining needs no public IP and no port
forwarding. The node's REST API is at `/api/storage/v1`, and the node accepts
`--api-cors-origin`.

**There is no public storage HTTP gateway.** All six `logos.test` fleet nodes
refuse connections on port 8080, and none of `storage.logos.co`,
`api.storage.logos.co`, `gateway.storage.logos.co`, `testnet.storage.logos.co`,
`storage.testnet.logos.co` or `codex.logos.co` resolve. Every consumer runs a
node. [research/browser-viability.md](./research/browser-viability.md) has the
full account and what would change it.

## Blockchain

### Testnet nodes: public, and what the demo uses

`deployment/.env.testnet` in `logos-blockchain` names
`PUBLIC_IP_ADDR=65.109.51.37` with node API ports 18080 to 18083. All four were
publicly reachable when checked on 2026-09-07.

```
http://65.109.51.37:18080/cryptarchia/info      chain tip, height, slot, lib, state, phase
http://65.109.51.37:18080/cryptarchia/headers   121 recent header hashes
http://65.109.51.37:18080/network/info          peer id, listen addresses, connected peers
http://65.109.51.37:18080/blend/info            node id, core info
http://65.109.51.37:18080/mempool/add/tx        405 to a GET; the only write surface
```

Everything else we probed returned 404.

The nodes send `access-control-allow-origin: *`, so CORS would let a browser
call them. Mixed content stops it instead: the nodes are plain HTTP and the demo
is HTTPS, so the browser blocks the request before it leaves the page. That is
why the demo has a route handler (see [blockchain.md](blockchain.md)).

The chain is live. On 2026-09-07 the height moved from 7687 to 7709 over about
forty minutes, a block every 30 to 90 seconds. `state: "Online"` reports the
process and not block production, so it says `Online` either way.

`height` and `slot` are Cryptarchia's base-chain counters and unrelated to LEZ
block numbers.

### LEZ block explorer: public, not used

https://explorer.testnet.lez.logos.co/ is public and works. The demo used it
before switching to the nodes, and it is still the only way to see LEZ
execution-zone blocks.

It is a Leptos WASM app. Its API is a set of server functions with a build hash
in the path, which you can recover from the WASM with `strings`. Request bodies
must be form-encoded; JSON gets `Args|missing field 'limit'`. It sends no CORS
headers, and `OPTIONS` returns 405.

Its index was last updated on 30 August at LEZ block 30017, while the base chain
kept producing. A stale LEZ indexer doesn't mean the chain has stalled.

### Other blockchain endpoints: not public

`testnet.blockchain.logos.co` sits behind an OAuth2 Proxy that requires GitHub
sign-in. The nginx config in `logos-blockchain/deployment/nginx/run.conf` shows
what is behind it: `/explorer/` with SSE block streaming, `/faucet-backend/`
and a protected `/otlp/`. That SSE stream would be a better data source than
polling if it were ever opened up.

`devnet.blockchain.logos.co` serves Grafana, and its `/explorer/` is a 404.

## Messaging

The messaging demo connects to the public Waku fleets, not to a Logos fleet.
`@waku/sdk` bootstraps through DNS discovery against the `SANDBOX` and `TEST`
enrtrees, whose nodes expose secure websockets a browser can dial.

The `logos.test` delivery nodes are a different network.
`node-configs/waku_config.json` shows the team using `clusterId: 16` with
`enrtree://...@boot.prod.status.nodes.status.im`. We have not verified whether
those nodes expose websockets a browser can reach. If they do, moving the demo
is a `networkConfig` change rather than a rewrite.

Until then, web visitors meet each other but not desktop Basecamp users, and the
demo page says so. Messages go to a public content topic on the public fleet, so
the demo is not private, and the page says that too.
