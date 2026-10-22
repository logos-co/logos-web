# `@waku/sdk` notes

Behaviour of `@waku/sdk@0.0.36` that cost us time and isn't obvious from the
types. The messaging demo uses it in
[`src/lib/waku.ts`](../src/lib/waku.ts) and
[`src/components/use-waku-node.ts`](../src/components/use-waku-node.ts).

## `defaultBootstrap` is required

```ts
const node = await createLightNode({ defaultBootstrap: true })
```

Without `defaultBootstrap` the node registers no peer discovery at all. It
starts cleanly, reports a peer id, then sits at zero peers until `waitForPeers`
times out.

The types mislead here. `CreateNodeOptions.discovery` documents
`@default { peerExchange: true, dns: true, peerCache: true }`, but
`createLibp2pAndUpdateOptions` only applies those defaults inside the
`defaultBootstrap` branch:

```js
if (options?.defaultBootstrap) {
  peerDiscovery.push(
    ...getPeerDiscoveries(
      { dns: true, peerExchange: true, peerCache: true, ...options.discovery },
      options.peerCache
    )
  )
} else {
  peerDiscovery.push(
    ...getPeerDiscoveries(options.discovery, options.peerCache)
  )
}
```

In the console the symptom is `waku:connection-limiter:warn No bootstrap
components found to trigger`, repeated every five seconds. With debug logging on
(`localStorage.debug = 'waku:*,libp2p:*'`) it's obvious; without it, it looks
like a network problem.

## Filter does not give you history

Filter delivers only what is published after you subscribe, so a tab opened
later starts empty and looks broken. Ask the store nodes for the backlog:

```ts
await node.store.queryWithOrderedCallback([decoder], cb, {
  timeStart: new Date(Date.now() - 24 * 60 * 60 * 1000),
  paginationLimit: 100,
  paginationForward: false,
})
```

Subscribe first and query second; the other order drops anything published
during the query. Then de-duplicate the overlap. The demo puts a
sender-generated id in every message and keeps a `Set` of the ids it has
rendered, which also lets it recognise its own messages coming back off the
network.

If the store query fails, show an empty backlog and keep the page working.

## Connecting takes seconds

The node runs DNS discovery, dials peers, then sets up a filter subscription.
Ten to twenty seconds is normal, so design the empty state for it and don't
treat a page that looks inert on first paint as a failure. Give
`waitForPeers(undefined, timeoutMs)` a generous timeout.

## Import it lazily

```ts
const { createLightNode } = await import('@waku/sdk')
```

The SDK touches browser APIs that don't exist during server rendering, and it
pulls in libp2p, which has no place in the initial bundle.

## `ReliableChannel` is worth knowing about

`@waku/sdk` ships a `ReliableChannel` built on `@waku/sds`, with
acknowledgements, automatic retries, store queries for missing messages and
periodic sync between participants. Its events run:

```
sending-message -> message-sent -> message-possibly-acknowledged -> message-acknowledged
```

The demo doesn't use it yet, but it is the obvious next step. The events map
onto the delivery ticks anyone recognises from a chat app, while underneath they
are probabilistic acknowledgement over bloom filters. The same UI then works as
a product feature for one audience and a protocol demonstration for another.

## Network configuration

`networkConfig` takes a `clusterId` and either shards or content topics, and
defaults to The Waku Network. Keep it in configuration instead of spreading it
through components: moving to a Logos fleet later is a settings change only if
it lives in one place.

Content topics follow `/<app>/<version>/<topic>/<encoding>`. Nothing published
can be deleted, so bumping the version segment is how a demo gets a clean room.
