# `@waku/sdk` notes

Behaviour that cost time and is not obvious from the types. Against
`@waku/sdk@0.0.36`.

## `defaultBootstrap` is required

```ts
const node = await createLightNode({ defaultBootstrap: true })
```

Without it the node registers **no peer discovery at all** and never finds a
peer. It starts cleanly, reports a peer id, and then sits at zero peers until
`waitForPeers` times out.

The types actively mislead here. `CreateNodeOptions.discovery` documents
`@default { peerExchange: true, dns: true, peerCache: true }`, but
`createLibp2pAndUpdateOptions` only applies those defaults **inside the
`defaultBootstrap` branch**:

```js
if (options?.defaultBootstrap) {
  peerDiscovery.push(...getPeerDiscoveries({ dns: true, peerExchange: true, peerCache: true, ...options.discovery }, options.peerCache))
} else {
  peerDiscovery.push(...getPeerDiscoveries(options.discovery, options.peerCache))
}
```

The symptom in the console is `waku:connection-limiter:warn No bootstrap
components found to trigger`, repeating every five seconds. Turn on debug
logging with `localStorage.debug = 'waku:*,libp2p:*'` and it is obvious;
without it, it looks like a network problem.

## Filter does not give you history

Filter delivers only what is published after you subscribe. A tab opened later
starts empty, which reads as broken.

Ask store nodes for the backlog:

```ts
await node.store.queryWithOrderedCallback([decoder], cb, {
  timeStart: new Date(Date.now() - 24 * 60 * 60 * 1000),
  paginationLimit: 100,
  paginationForward: false,
})
```

**Subscribe first, query second.** The other order drops anything published
during the query. De-duplicate the overlap: the demo puts a sender-generated id
in every message and keeps a `Set` of ids it has rendered, which also identifies
its own messages coming back off the network.

A failed store query should degrade to an empty backlog, not a broken page.

## Connecting takes seconds

DNS discovery, then dialling, then a filter subscription. Ten to twenty seconds
is normal. Design the empty state for it and do not treat a page that looks
inert on first paint as a failure.

`waitForPeers(undefined, timeoutMs)` needs a generous timeout.

## Import it lazily

```ts
const { createLightNode } = await import('@waku/sdk')
```

It reaches for browser APIs that do not exist during server rendering, and it
pulls in libp2p, which has no business in the initial bundle.

## `ReliableChannel` is worth knowing about

`@waku/sdk` ships a `ReliableChannel` built on `@waku/sds`: acknowledgements,
automatic retries, store queries for missing messages, and periodic sync between
participants.

```
sending-message -> message-sent -> message-possibly-acknowledged -> message-acknowledged
```

The demo does not use it yet, but it is the obvious next step. The event set maps
onto delivery ticks a normal person understands, while being, underneath,
probabilistic acknowledgement over bloom filters. The same UI reads as a product
feature to one audience and a protocol demonstration to another.

## Network configuration

`networkConfig` takes `clusterId` and either shards or content topics; the
default is The Waku Network. Keep it in configuration rather than scattered
through components, because moving to a Logos fleet later is a settings change
if and only if it stays in one place.

Content topics follow `/<app>/<version>/<topic>/<encoding>`. Bumping the version
segment is how a demo gets a clean room, since nothing published can be deleted.
