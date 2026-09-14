# What a browser can and cannot do

The constraint that shapes every demo in this app. Checked 2026-09-04.

## Summary

| Protocol | Browser-native? | What it takes |
| --- | --- | --- |
| Messaging | **Yes** | `@waku/sdk` light node over secure websockets. Nothing else |
| Blockchain | Read-only, **via a proxy** | Nodes allow browsers, but are HTTP while the app is HTTPS |
| Storage | Roster only, **via a proxy** | No browser transport and no public node. The published roster sends no CORS header |

## Messaging: genuinely browser-native

`@waku/sdk` is a real light client. The browser gets its own libp2p peer
identity, dials fleet nodes over `wss`, and pushes and receives messages itself.
No server of ours is in the path, and the page is prerendered as static
content. This demo alone needs no route handler.

This is the exception, not the rule, and it is why the messaging demo is the one
that makes the strongest claim. Two things had to be true at once: a browser
implementation exists, and there is a public fleet speaking a transport browsers
can use. Neither holds for the other two.

## Blockchain: read-only through a proxy, for an unexpected reason

The testnet nodes are public and send `access-control-allow-origin: *`, so
permission is not the obstacle. **They are served over plain HTTP while the
demo is HTTPS**, and a browser blocks mixed content before the request is
sent. The CORS header never gets a chance to matter.

So a route handler makes the call server side. If the nodes were ever put
behind TLS, that handler could be deleted and the page would talk to them
directly, which would put this demo in the same category as messaging.

The proxy stays narrow: public chain state, read only, no keys and no writes.
The nodes expose exactly one write surface, `/mempool/add/tx`, and nothing
goes near it.

An earlier version of this demo read the LEZ block explorer instead. That was
a worse arrangement in two ways. The explorer sends no CORS headers at all, so
the proxy was unavoidable rather than incidental, and its server-function URLs
carry a build hash that moves on every deploy. Reading the nodes is
first-hand, and it turned out the base chain was producing normally while the
explorer's index had been stuck since 30 August.

## Storage: the network cannot be joined from a browser

Checked exhaustively on 2026-09-04, because it kept looking like it should be
possible. It is not, and the reason is the transport layer rather than a
policy someone could change.

**The browser cannot join.** Discovery is discv5 over UDP and transfer is
libp2p TCP. A browser has neither. The word "websocket" does not appear
anywhere in `docs/storage`, so there is no browser-reachable transport to ask
for. This is the difference from messaging, where a browser light client and a
public `wss` fleet both existed.

**There is no public endpoint.** All six `logos.test` fleet nodes refuse
connections on the documented API port:

```
178.128.140.206  129.212.221.44   34.70.60.201
34.123.182.254   47.76.168.186    47.76.178.164     :8080 -> no connection
```

and none of `storage.logos.co`, `api.storage.logos.co`,
`gateway.storage.logos.co`, `testnet.storage.logos.co`,
`storage.testnet.logos.co` or `codex.logos.co` resolve.

**That is the design, not an oversight.** The whole of `docs/storage` is about
running your own node: NAT traversal, port forwarding, finding your public IP.
The introduction says parties who care about content "operate their own nodes
and curate the list of files they wish to replicate".

**The web UIs in the org are all local-node UIs.** `logos-storage-frontend`
shows "the status of a locally running codex node", `logos-storage-marketplace-ui`
and `codex-cloud` are the same shape, and `metrics` (metrics.codex.storage)
reads a Supabase table the team fills, not a node.

**The SDK cannot stand in for a node either.** `@codex-storage/sdk-js` has one
dependency, `valibot`, for schema validation. Every method is a call to a
node's REST API, and nothing computes a CID locally. Implementing Codex's
chunking and merkle structure by hand would be possible but unverifiable
without a node, and a demo that shows a CID Codex would not agree with is
worse than no demo.

### What would unlock it

Either the team exposes a gateway, or one container is allowed:

```
docker run logosstorage/logos-storage-nim --network=logos.test \
  --api-bindaddr=0.0.0.0 --api-port=8080 --nat=none \
  --api-cors-origin='<origin>'
```

Discovery is outbound UDP, so that needs no public IP and no port forwarding.
With a node in reach, the chunked upload API suits a browser well:

```
uploadInit(filename, chunkSize) -> uploadChunk(sessionId, base64) -> uploadFinalize() -> CID
downloadChunks(cid, local, chunkSize)
storageUploadProgress / storageUploadDone / storageDownloadProgress
```

It takes chunks rather than file paths, so nothing touches a disk of ours, and
the progress events drive a real progress bar. Until then there is nothing
honest to build.

## The rule this leaves behind

Before promising a demo, answer two questions:

1. Is there a client that runs in a browser?
2. Is there an endpoint it is allowed to talk to, over a transport it has?

Messaging answers yes to both. Blockchain answers yes then no, and a proxy
converts the no. Storage answers no to the first, and nothing in the page can
fix that, so the demo shows the published roster instead, which is a proxy
case for the ordinary reason that it sends no CORS header. See
[storage-research.md](./storage-research.md).

A third question follows from getting that last one wrong once: **a clean
`curl` does not mean a browser may read it.** CORS is enforced by the browser
and by nothing else, so check the console, not the status code.
