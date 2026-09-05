# What a browser can and cannot do

The constraint that shapes every demo in this app. Checked 2026-09-04.

## Summary

| Protocol | Browser-native? | What it takes |
| --- | --- | --- |
| Messaging | **Yes** | `@waku/sdk` light node over secure websockets. Nothing else |
| Blockchain | Read-only, **via a proxy** | The explorer API works but sends no CORS headers |
| Storage | **No** | No browser transport and no public endpoint. Needs a node we run |

## Messaging — genuinely browser-native

`@waku/sdk` is a real light client. The browser gets its own libp2p peer
identity, dials fleet nodes over `wss`, and pushes and receives messages itself.
No server of ours is in the path, and the page is prerendered as static
content. This demo alone needs no route handler.

This is the exception, not the rule, and it is why the messaging demo is the one
that makes the strongest claim. Two things had to be true at once: a browser
implementation exists, and there is a public fleet speaking a transport browsers
can use. Neither holds for the other two.

## Blockchain — read-only through a proxy

The explorer API returns real block data but rejects cross-origin browser calls:
`OPTIONS` gives `405` and no `Access-Control-Allow-Origin`.

Two ways forward:

1. **Ask for CORS.** One header on the explorer's nginx and the browser can call
   it directly, keeping the "no backend" claim intact for this demo too. This is
   a small request, but it depends on someone else.
2. **Proxy through a route handler.** A Next.js route handler calls the explorer
   server-side, where CORS does not apply, and returns the result to the page.
   This works today with nobody's permission.

The proxy is the pragmatic choice, but **it changes what the demo can claim**.
The page must not say "no backend" for a demo whose data comes through our
server. Scope the claim per demo rather than app-wide:

- Messaging: no backend, and that is literally true.
- Blockchain: a read-only view relayed through our proxy, because the explorer
  does not allow browsers to call it directly.

The risk is low, and worth stating plainly so nobody has to guess: the proxied
data is public block data, there are no keys, no user content, and no writes.
Keep it that way. A proxy that starts forwarding anything user-specific is a
different thing and needs a different conversation.

Also note the chain was not producing blocks when this was written, so confirm
it is live before building a view that implies motion.

## Storage — not possible from a browser at all

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
fix that.
