# Storage: what was checked, and what is left

Storage has been investigated three times, and twice the conclusion "not
possible" was wrong in a way that only came out by digging further. This
records what has actually been established so nobody re-treads it, and names
the one lead still worth pulling.

Everything below was checked on **2026-09-08**.

## The method that works

Both blockchain breakthroughs came from the same move: **read the source's
route table before probing anything**. Guessing endpoint paths produced a
picture of a tiny API that did not exist. Reading `nodes/api-common/src/paths.rs`
produced the real one.

Storage has the same artefact: `openapi.yaml` in `logos-storage/logos-storage-nim`.

## The storage API, in full

Base path `/api/storage/v1`, from `openapi.yaml`:

```
GET  POST   /data                        list local manifest CIDs, upload a file (streaming)
GET  DELETE /data/{cid}                  download from the local node
POST        /data/{cid}/network          fetch content from the network
GET         /data/{cid}/network/stream   stream it
GET         /data/{cid}/network/manifest manifest for a CID
GET         /data/{cid}/exists
GET         /space  /spr  /peerid  /debug/info
GET         /connect/{peerId}
POST        /debug/chronicles/loglevel
```

The demo everyone imagines (drop a file, get a CID, fetch it elsewhere) is
fully specified by this. What is missing is a node to point it at.

## No node is reachable from here

Twelve nodes probed individually on port 8080, the API port:

- `logos.test`: six, from `fleets.logos.co/logos-test/storage-network.json`
- `logos.dev`: six, from `fleets.logos.co/logos-dev/storage-network.json`

All refuse the connection **from here**. See "The ports are open, just not to
us" below, which corrects what this originally concluded from that. **The
`port: 8080` in the roster is the node's
configured API port, not an open one**: it is bound locally or firewalled.
Two Hetzner hosts from the infra repo's Cloudflare DNS config refuse as well.

Hostnames, from `infra-logos-storage`:

| Host                                 | Result                                           |
| ------------------------------------ | ------------------------------------------------ |
| `api.demo.codex.storage`             | 401, Basic Auth, and it lives under `archive/`   |
| `api.codex.storage`                  | 200, but it is the rendered API docs, not a node |
| `marketplace.codex.storage`          | serves contract addresses only                   |
| `explorer.testnet.codex.storage`     | no DNS                                           |
| `storage.logos.co` and four siblings | no DNS                                           |

The cluster ingress in `infra-logos-storage` sits behind `oauth2-proxy`, the
same arrangement that gates `testnet.blockchain.logos.co`.

**This is the design, not an oversight.** `docs/storage` is entirely about
running your own node, and the introduction says parties who care about content
"operate their own nodes and curate the list of files they wish to replicate".

## The browser cannot join either

Discovery is discv5 over UDP and transfer is libp2p TCP. A browser has neither,
and "websocket" appears nowhere in the storage docs. This is the difference from
messaging, where a browser light client and a public `wss` fleet both existed.

`@codex-storage/sdk-js` cannot stand in. Its single dependency is `valibot` for
schema validation, every method calls a node's REST API, and nothing computes a
CID locally.

## The lead still worth pulling

Codex's storage marketplace is **Ethereum contracts**, and a browser can read an
Ethereum RPC directly. No node, no proxy. This is the closest storage has come
to being buildable.

```
Marketplace contract  0x5378a4EA5dA2a548ce22630A3AE74b052000C62D
  from https://marketplace.codex.storage/codex-testnet/latest

Chain                 Status Network Sepolia, chainId 1660990954
  from hardhat.config.js in logos-storage-contracts-eth
```

It fails on one thing. The only RPC for that chain, in the config and in the
public chain registry at `chainid.network`, is
`https://public.sepolia.rpc.status.network`, and it returns **NXDOMAIN**,
confirmed against Cloudflare's resolver, so it is not a local DNS problem.
`status.network` itself resolves; the RPC subdomain is gone.

**If someone knows the current RPC for chain 1660990954, a browser-native view
of live storage marketplace activity becomes possible immediately.** That is a
far smaller thing to ask than "may we run a Codex node", and it is the question
to put to the team.

## The ports are open, just not to us

An earlier version of this file said every node refuses its API port. That was
wrong, and the way it was wrong is worth keeping.

`echo.codex.storage/port/<port>` checks reachability from its own vantage, and
with the `X-Real-IP-Custom` header it checks a host you name. This is how the
official marketplace UI tests a node. Asked about the fleet nodes it answers
`reachable: true`, while a direct connection from here is refused. A port the
service knows is closed (`9999`) answers `false`, so it is not simply agreeing.

So the nodes filter by source address. The port is open; we are not on the
list. The practical conclusion is the same, no upload path for us, but
"closed" and "not open to you" are different facts.

## There is no public gateway

Searched the whole of `logos-storage` (118 repositories) and `codex-storage`
for anything that serves content by CID over HTTP. There is nothing.

- `api.codex.storage` serves a documentation page; every API path is a 404
- `api.demo.codex.storage` is behind HTTP Basic auth
- `app.codex.storage` is the marketplace UI, and its bundle points at
  `http://127.0.0.1:8080`, your own node
- `Podex`, the closest thing to what we wanted (upload media, share a link,
  announce over Waku), defaults to `localhost:8080` plus its own Go backend
  for downloads

Every published path runs through a node you operate. A hosted "upload and
share a link" service does not exist in either organisation.

## What is live and public

```
https://fleets.logos.co/logos-test/storage-network.json
https://fleets.logos.co/logos-dev/storage-network.json
```

And `echo.codex.storage`, which is the one storage service a browser may call
directly: `access-control-allow-origin: *`, and it allows `X-Real-IP-Custom`.
`/json?ip=` returns city, country and ASN for an address; `/port/<port>`
returns reachability. The demo uses both to show the roster located and
answering rather than as a static list.

The roster itself sends **no `access-control-allow-origin` header at all**, so a page cannot
read it directly and the demo proxies it through `/api/storage/fleet`. Checking
this with `curl -I` alone is not enough: the response is a plain 200 and the
missing header is easy to miss. The browser console is what settles it. Each
entry carries
`host`, `role`, `peerId`, `spr`, `tcpSpr`, `mixPubKey`, `libp2pPubKey`,
`address` and `port`. Six nodes per fleet across three regions.

The `role` values seen are `mp` and `rs`. **No source in any Logos repository
defines them**, so the demo prints them verbatim rather than inventing an
expansion.

Worth knowing: `docs/run-a-node` builds a **mix pool** out of this roster,
mapping every entry to a relay with its `mixPubKey`. These storage nodes double
as mix relays, and the roster is how a joining node finds them.

## Things not to touch

- `key.codex.storage` returns private keys on a plain GET. It is a testnet
  convenience; it has no place in a demo.
- `marketplace.codex.storage` is a config service for contract addresses.
