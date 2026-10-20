# logos-demos docs

Working notes for `apps/logos-demos`: what the Logos stack actually is, which
parts of it a browser can reach, and what bit us. Most of this is not written
down in one place, so it is gathered here instead of re-derived each time.

| Doc                                                            | Read it when                                           |
| -------------------------------------------------------------- | ------------------------------------------------------ |
| [logos-stack.md](logos-stack.md)                               | You need the naming, modules, or repository ownership  |
| [demos.md](demos.md)                                           | You add or change a demo, its explainer, or its claims |
| [design-system.md](design-system.md)                           | You style anything, or write copy                      |
| [blockchain.md](blockchain.md)                                 | You touch the blockchain demo or its proxy             |
| [network-access.md](network-access.md)                         | You check what a browser can actually reach            |
| [storage-cid.md](storage-cid.md)                               | You touch the CID, mimetype, or proof code             |
| [waku-sdk-notes.md](waku-sdk-notes.md)                         | You touch `@waku/sdk` or the messaging demo            |
| [deployment.md](deployment.md)                                 | You deploy, or debug a build or dev-server problem     |
| [research/browser-viability.md](research/browser-viability.md) | You consider promising a new demo                      |
| [research/storage-research.md](research/storage-research.md)   | You revisit whether storage is reachable               |

## Reading these

Every network claim carries the date it was checked. Endpoints move, fleets are
redeployed, and access policy changes without notice. A statement here is
evidence that something was true once, not a guarantee that it is true now.
Re-check before building on one. Where something was inferred rather than
observed, it says so.
