# What a browser can and cannot do

The constraint that shapes every demo in this app. Checked 2026-09-04.

## Summary

| Protocol | Browser-native? | What it takes |
| --- | --- | --- |
| Messaging | **Yes** | `@waku/sdk` light node over secure websockets. Nothing else |
| Blockchain | Read-only, **via a proxy** | The explorer API works but sends no CORS headers |
| Storage | **No** | Joining needs discv5 over UDP. A node must sit in between |

## Messaging — genuinely browser-native

`@waku/sdk` is a real light client. The browser gets its own libp2p peer
identity, dials fleet nodes over `wss`, and pushes and receives messages itself.
No server of ours is in the path, and the app builds to static output.

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

## Storage — needs a node

`@codex-storage/sdk-js` is an HTTP client for a storage node's REST API, not a
node. Every example in its README is `new Codex("http://localhost:8080")`. The
browser cannot be a participant: joining the network means discv5 over UDP,
which browsers do not have, and there is no public HTTP gateway.

So a storage demo needs one node we run:

```
docker run logosstorage/logos-storage-nim --network=logos.test \
  --api-bindaddr=0.0.0.0 --api-port=8080 --nat=none --api-cors-origin='<origin>'
```

Lighter than it sounds. It is a published image, discovery is outbound UDP so no
public IP or port forwarding is needed, and the node has a CORS flag. But it is
still infrastructure someone has to keep alive, and when it dies the demo dies
with it. That is a product decision, not a technical one.

The chunked upload API suits a browser well once a node exists:

```
uploadInit(filename, chunkSize) -> uploadChunk(sessionId, base64) -> uploadFinalize() -> CID
downloadChunks(cid, local, chunkSize)
storageUploadProgress / storageUploadDone / storageDownloadProgress
```

It takes chunks rather than file paths, so nothing has to touch a disk of ours,
and the progress events drive a real progress bar.

## The rule this leaves behind

Before promising a demo, answer two questions:

1. Is there a client that runs in a browser?
2. Is there an endpoint it is allowed to talk to, over a transport it has?

Messaging answers yes to both. Blockchain answers yes then no, and a proxy
converts the no. Storage answers no to the first, and nothing in the page can
fix that.
