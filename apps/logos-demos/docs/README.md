# logos-demos docs

Reference notes for [`apps/logos-demos`](..): what the Logos stack is, which
parts of it a browser can reach, and the problems we hit building the demos.
Little of this is written down anywhere else.

| Doc                                                            | Read it when                                         |
| -------------------------------------------------------------- | ---------------------------------------------------- |
| [logos-stack.md](logos-stack.md)                               | You need the names, modules or owning repositories   |
| [demos.md](demos.md)                                           | You add or change a demo, its explainer or claims    |
| [design-system.md](design-system.md)                           | You style anything or write copy                     |
| [blockchain.md](blockchain.md)                                 | You touch the blockchain demo or its proxy           |
| [network-access.md](network-access.md)                         | You check what a browser can reach                   |
| [storage-cid.md](storage-cid.md)                               | You touch the CID, mimetype or proof code            |
| [waku-sdk-notes.md](waku-sdk-notes.md)                         | You touch `@waku/sdk` or the messaging demo          |
| [deployment.md](deployment.md)                                 | You deploy, or debug a build or dev server problem   |
| [research/browser-viability.md](research/browser-viability.md) | You consider promising a new demo                    |
| [research/storage-research.md](research/storage-research.md)   | You revisit whether storage is reachable             |

Every network claim carries the date we checked it. Endpoints move, fleets get
redeployed and access policy changes without notice, so treat a claim as true
on that date and re-check before you build on it. Anything inferred rather than
observed says so.
