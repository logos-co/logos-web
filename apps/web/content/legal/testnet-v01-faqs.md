---
title: 'Testnet v0.1 FAQs | Logos'
description: 'Frequently asked questions about the Logos Testnet v0.1 — what it is, its purpose, and how to take part.'
heading: 'Logos Testnet v0.1 FAQs'
---

## What is Logos Testnet?

The Logos Testnet v0.1 is an early, experimental development environment designed for early stage testing of the Logos technology stack. It's the first release uniting components including Logos Messaging, Logos Storage, and Logos Blockchain modules. This provides a sandbox for developers and node operators to interact with the core backend infrastructure and explore core infrastructure components.

This release focuses on backend functionality and architectural validation rather than polished UX or stability.

## What is the purpose of this testnet?

To validate core architectural assumptions, stress-test components, and collect feedback to guide future development. It allows pioneers, builders, and experienced node operators to explore the stack's capabilities hands-on.

## Is the Logos Testnet open source?

Yes, under the MIT Licence and Apache License 2.0 which cover relevant IP and usage matters. You can access the repositories on Github: https://github.com/logos-co/logos-app/releases

## Is this a real environment?

Yes. It's a real environment where messages are routed through a real functioning test network, files are processed through testnet storage components, and programs execute. However, it's early alpha with no guarantees on performance, persistence or reliability. Messages fail, delay or get lost. The Logos Blockchain runs strictly in a testnet environment mode.

## Is this blockchain?

The blockchain is just one of the modules in the stack. The overall stack includes:

- **Logos Blockchain (formerly Nomos):** scalable, trustless agreements layer built for sovereignty, modularity, and privacy preservation. It offers network-level privacy for users, developers, and infrastructure providers. It allows developers to build apps and validators to secure the network without exposing identifying information such as location and transaction details.
- **Logos Storage (formerly Codex):** privacy-preserving, decentralised storage system that provides censorship resistance and data durability. It prevents data manipulation and ensures that no single entity owns or controls the stored information. This functionality enables the delivery of frontends for Dapps, allowing truly decentralised, privacy-preserving deployment within the Logos ecosystem.
- **Logos Messaging (formerly Waku):** peer-to-peer communication layer. It delivers privacy-preserving online interactions without relying on trusted third parties, enabling efficient, scalable, and censorship-resistant communication. Built on the foundation of libp2p, it offers network-level protection from denial-of-service attacks, leveraging secure, permissionless light protocols to enable access to its p2p network on browsers and smartphones.
- **Logos Core** is the foundational, host runtime and modular SDK for developers to build, integrate and run decentralised, p2p applications and modules locally.

## Is this mainnet?

No. It's not a production network, mainnet preview or launch. It doesn't represent final or long-term design, and components may change significantly during ongoing development.

## What are testnet tokens?

Testnet tokens exist only for testing blockchain-specific features (e.g., transactions) in the environment. They have no value, aren't transferable outside the testnet, redeemable or convertible, and confer no rights to future benefits. See the [Logos Chain Testnet Terms & Conditions](/testnet-terms-and-conditions) for details.

## Do I need testnet tokens to participate?

No. You can explore most components without blockchain interaction. For testing blockchain-specific functionalities, you can obtain test tokens via the faucet:

If you choose to request or use testnet tokens, please refer to the [Logos Chain Testnet Terms & Conditions](/testnet-terms-and-conditions) which govern blockchain-specific testing activity.

## Is the testnet secure?

No. It's under active development, likely contains bugs or vulnerabilities, and hasn't been audited. Never use real assets, sensitive data, or anything of value in this environment.

## Can I build on the testnet?

Yes, the testnet is designed to be built upon by developers interested in experimenting with the Logos modular stack. Refer to the official documentation for guides on getting started: https://github.com/logos-co/logos-docs

## What about entitlements, expectations, rights or benefits for participating?

Participation creates no entitlements, expectations, rights to future tokens/benefits, or other claims. The testnet is provided "as is" with no warranties and you use it at your own risk. It does not form any broader contractual obligations beyond applicable terms.

## Is any service provided with the Logos testnet?

No service is provided; the testnet consists of open-source software that you run locally on your own hardware. You're fully responsible for setup, operation, and risks in this developer-oriented environment.
