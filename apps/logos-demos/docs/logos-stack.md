# The Logos stack

What the pieces are called, what they do, and which repository owns each one.

## Naming

Use the names logos.co uses. They are not always the names in the code.

| Layer | Public name | Modules | Note |
| --- | --- | --- | --- |
| Messaging | **Logos Messaging** | Delivery, Chat | `content/pages/en/technology-stack-messaging.json` in `logos-web` is the source of truth |
| Storage | **Logos Storage** | — | Content-addressed, CID-based |
| Blockchain | **Logos Blockchain** | Cryptarchia, LEZ, Blend | Privacy-first proof of stake |
| Networking | Discovery, peering, mixnet | libp2p, mix | Underneath the rest |

**"Waku" is not used in user-facing copy.** Logos Messaging is built on Waku
protocols and `logos-delivery` is a Nim implementation of them, but logos.co
keeps `waku` only as an SEO keyword. Library names keep their own names:
`@waku/sdk` is called `@waku/sdk` because that is what it is.

"Codex" has the same shape. The storage implementation descends from Codex and
the npm client is still `@codex-storage/sdk-js`, but the product is Logos
Storage.

## Runtime model

Logos is a module system, not a monolith. Two component types:

- **Logos Modules** are headless backend services. Each runs in its own
  `logos_host` process and talks to the others over a local socket with token
  auth. `chat_module`, `storage_module`, `delivery_module`, `capability_module`.
- **UI Apps** are Qt/QML plugins loaded into the shell process, which call
  modules for their backend.

Two front ends host them: **Basecamp** (desktop GUI) and **logoscore / logosctl**
(headless CLI daemon). Both link `liblogos`.

None of this runs in a browser. See [browser-viability.md](./browser-viability.md).

## Module contracts

Modules declare their interface in `.lidl` files, and codegen turns those into
typed clients per language. `chat_module.lidl` is the most complete example and
worth reading even if you never call it: it documents 1:1 and group
conversations, message history, delivery state, and the event set.

```
create_conversation(peer_address)        create_group_conversation(name, desc)
add_group_member(convo_id, peer_address) send_message(convo_id, content)
list_conversations()  get_messages(convo_id)  status()
event message_received / conversation_created / delivery_state_changed / ...
```

The peer address comes from `get_address()` and is exchanged out of band. On
desktop that means copy and paste, which is the single largest piece of friction
in the Basecamp chat flow. A web app does not have that problem: it already
knows both sides' addresses, so a room link is enough.

## Repositories worth knowing

| Repository | What |
| --- | --- |
| `logos-co/logos-basecamp` | Desktop shell. Read `docs/spec.md` for the runtime model |
| `logos-co/logos-logoscore-cli` | Headless daemon: `logoscore`, `logosctl` |
| `logos-co/logos-js-sdk` | Node SDK over the `lp_*` C ABI. Not browser-capable |
| `logos-co/logos-chat-module` | Chat module and its `.lidl` contract |
| `logos-co/logos-delivery-module` | Delivery module wrapping `liblogosdelivery` |
| `logos-messaging/logos-delivery` | Messaging protocols in Nim |
| `logos-storage/logos-storage-nim` | Storage node. `network_presets.json` holds the bootstrap sets |
| `logos-blockchain/logos-blockchain` | Node. `deployment/` holds the compose stack |
| `logos-co/node-configs` | Sample node configs |
| `logos-co/logos-monitoring` | DHT crawler; its README explains how to join the live storage network |

## logos-js-sdk, and why this app does not use it

`logos-js-sdk` is a koffi FFI wrapper over `liblogos_protocol`. It loads a
native `.so`/`.dylib` and speaks the `lp_*` C ABI over TCP or a Unix socket to a
running daemon.

It cannot run in a browser, and it cannot run on serverless: it needs a native
library, a long-lived TCP connection, and durable event subscriptions. Its
provider half does not work at all against `logos-protocol` master, where
`lp_provider_register` returns `LP_OK` and serves nothing.

It is the right tool for a Node service that sits beside a daemon. It is the
wrong tool for a static web app, which is why these demos talk to protocols
directly instead.
