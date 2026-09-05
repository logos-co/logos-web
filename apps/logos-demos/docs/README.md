# logos-demos notes

Working notes gathered while building the demos in this app: what the Logos
stack actually is, which parts of it a browser can reach, and what bit us.

They exist because most of this is not written down in one place. It is spread
across a dozen repositories, a fleets dashboard, and the behaviour of live
endpoints, and re-deriving it costs hours.

| File | What it covers |
| --- | --- |
| [logos-stack.md](./logos-stack.md) | The stack: naming, layers, modules, and which repository owns what |
| [network-access.md](./network-access.md) | The live networks and endpoints, and which are reachable from a browser |
| [browser-viability.md](./browser-viability.md) | Per protocol: can this run in a browser, and what does it need |
| [waku-sdk-notes.md](./waku-sdk-notes.md) | `@waku/sdk` behaviour that is not obvious from its types |
| [deployment.md](./deployment.md) | How this app deploys, and the Vercel traps in this monorepo |

## Reading these

**Every network claim carries the date it was checked.** Endpoints move, fleets
are redeployed, and access policy changes without notice. A statement here is
evidence that something was true once, not a guarantee that it is true now.
Re-check before building on one.

Where something was inferred rather than observed, it says so.
