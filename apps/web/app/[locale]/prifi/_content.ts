/**
 * Copy for the /prifi campaign page, colocated so it can be diffed against
 * Figma (Campaigns file Swn0WlZEeyL6jMIbgvh94C, frame 895:3330) in one place.
 *
 * Strings are verbatim from Figma. A `\n` marks a line break the design sets
 * by hand; it only applies at desktop widths, where the layout matches Figma,
 * and collapses to a space on narrower screens. `\u00a0` is a non-breaking
 * space Figma uses to steer a wrap.
 */
import { ROUTES } from '@/constants/routes'

export const SUPPLY_CHAIN_ID = 'transaction-supply-chain'

/**
 * Figma gives these CTAs no destination yet. Each points at the closest page
 * the site already has until the thesis and papers are published.
 */
export const LINKS = {
  thesis: ROUTES.research,
  supplyChain: `#${SUPPLY_CHAIN_ID}`,
  theoryPaper: ROUTES.research,
  messagingPaper: ROUTES.messaging,
  storagePaper: ROUTES.storage,
} as const

export const HERO = {
  heading: [
    'A parallel society needs an economy.',
    'PriFi protects its participants',
  ],
  body: [
    'PriFi combines secrecy and security: limiting what outsiders can learn and manipulate',
    'Blockchain secures settlement. But onchain transactions are not atomic events. Logos secures the whole transaction supply chain.',
  ],
  primaryCta: { label: 'Read the PriFi Thesis', href: LINKS.thesis },
  secondaryCta: {
    label: 'Explore the transaction supply chain',
    href: LINKS.supplyChain,
  },
} as const

export const SUPPLY_CHAIN = {
  heading: 'The transaction \nsupply chain.',
  lead: 'Settlement is just one of seven links in the chain.\u00a0Blockchain provides unprecedented settlement security. But transactions depend on infrastructure beyond settlement. Every exposed link creates another opportunity for surveillance or manipulation.',
  note: 'PriFi protects participants from two directions: limiting what an attacker can learn and what they can influence. Leaks cost billions annually. Even small cost reductions add up: a 0.1% drop in transaction costs can quadruple a nation’s wealth.',
  intro: 'Every transaction starts well before any value is ever exchanged.',
  factLabels: {
    exposes: 'What transparent Rails Expose',
    tools: 'Tools Used',
    threat: 'Threat Model',
  },
  statLabels: ['Cost of Leak in Crypto', 'Cost of leaks in the real world'],
  /**
   * One entry per link, from the Figma variant frames (850:2325 to 851:3190),
   * each of which shows that link's card as active. Figma numbers the links
   * 01 to 08 with no 06, reuses the Contracting diagram for Ordering and the
   * Settlement one for Enforcement, and gives Discovery the Ordering copy.
   */
  links: [
    {
      label: '01 Discovery',
      body: 'Finding a counterparty\nwho has what you want.',
      exposes: 'Pending order flow',
      tools: 'pools, RPC endpoints, relayer networks.',
      threat:
        "A visible mempool tells every bot watching exactly \nwhat's about to happen. Front-running and sandwich \nattacks run on that visibility alone.",
      outro: 'IP and timing expose proposers',
      stats: [
        [{ value: '$800M+', note: 'Sandwich & other attacks / 3yr' }],
        [
          {
            value: '$5B',
            note: 'year latency-arbitrage tax on global equities',
          },
        ],
      ],
      graph: {
        src: '/images/prifi/graph-discovery.webp',
        alt: "Identity leakage. Each leak looks small. Together they're a graph.",
        tall: false,
      },
    },
    {
      label: '02 Diligence',
      body: 'Verifying they are \nwho they claim',
      exposes: 'Address history, identity graph',
      tools: 'On-chain analytics, attestations, reserve and credit checks.',
      threat:
        'A counterparty can misrepresent reserves. An outsider can watch \ndiligence requests and infer intent before terms are even set.',
      outro:
        'Browser + wallet leaking IP, fingerprint, globally linkable identity graph',
      stats: [
        [
          { value: '$3B+', note: 'surveillance industry monetises the graph' },
          { value: '$84M', note: 'lost in address-poisoning' },
        ],
        [{ value: '$0.5B+', note: 'settlement for exposing 147M IDs' }],
      ],
      graph: {
        src: '/images/prifi/graph-diligence.webp',
        alt: 'Diligence. Two hazards, one request.',
        tall: true,
      },
    },
    {
      label: '03 Negotiation',
      body: 'Agreeing on price \nand terms',
      exposes: 'Size, terms, reservation price',
      tools: 'Chat applications, RFQ threads, term sheets.',
      threat:
        'Leaked terms let a predator position ahead of execution. \nA counterparty can also stall or renegotiate once terms are already known elsewhere.',
      outro: 'Telegram, Twitter, public mempools leak intent',
      stats: [
        [{ value: '~80%', note: 'of ETH DeFi routes through private RPCs' }],
        [{ value: '>50%', note: 'of US equity volume trades off-exchange' }],
      ],
      graph: {
        src: '/images/prifi/graph-negotiation.webp',
        alt: "Negotiation. Leaked terms don't wait for the deal to close.",
        tall: false,
      },
    },
    {
      label: '04 Contracting',
      body: 'Committing in \nenforceable form',
      exposes: 'Frontend and signing context',
      tools: 'Multisig wallets, contract code, signing interfaces.',
      threat:
        'A spoofed signing interface can show one transaction and execute another. \nThe signer authorizes something they never actually agreed to.',
      outro:
        'DNS, IPFS, AWS, RPCs, and centralised frontends \ncreate billion-dollar attack surfaces',
      stats: [
        [
          { value: '~$1.5B', note: 'stolen from Bybit' },
          { value: '~$0.5B/yr', note: 'lost to wallet-drainer phishing' },
        ],
        [
          {
            value: '$2.8B/yr',
            note: 'lost to manipulated payment instructions',
          },
        ],
      ],
      graph: {
        src: '/images/prifi/graph-contracting.webp',
        alt: "Contracting. The interface can lie. The signature can't take it back.",
        tall: true,
      },
    },
    {
      label: '05 Ordering',
      body: 'Deciding whose trade \ngoes when',
      exposes: 'Pending order flow',
      tools: 'Mempools, RPC endpoints, relayer networks.',
      threat:
        "A visible mempool tells every bot watching exactly what's \nabout to happen. Front-running and sandwich attacks run on that visibility alone.",
      outro: 'IP and timing expose proposers',
      stats: [
        [{ value: '$800M+', note: 'Sandwich & other attacks / 3yr' }],
        [
          {
            value: '$5B',
            note: 'year latency-arbitrage tax on global equities',
          },
        ],
      ],
      graph: {
        src: '/images/prifi/graph-ordering.webp',
        alt: "Contracting. The interface can lie. The signature can't take it back.",
        tall: false,
      },
    },
    {
      label: '07 Settlement',
      body: 'The only link where \nvalue moves',
      exposes: 'Balances, approvals, positions',
      tools: 'Consensus, execution clients. (BANKS?)',
      threat:
        "The chain executes exactly what it's given. \nWhatever risk exists here was already decided upstream.",
      outro: 'Balances, validators, and positions are visible',
      stats: [
        [
          {
            value: '$4.3B',
            note: 'lost across 49 cross-chain settlement attacks',
          },
        ],
        [
          {
            value: '$81M',
            note: 'stolen through a forged SWIFT payment instruction',
          },
        ],
      ],
      graph: {
        src: '/images/prifi/graph-settlement.webp',
        alt: "Settlement. The chain executes exactly what it's given.",
        tall: false,
      },
    },
    {
      label: '08 Enforcement',
      body: 'Making the \noutcome stick',
      exposes: 'Identifiable operators',
      tools: 'Litigation, asset freezes, on-chain governance votes.',
      threat:
        'A deal defaults after settlement, and recourse depends on \ncourts or goodwill that may not reach across borders or block explorers.',
      outro: 'Identifiable operators',
      stats: [
        [
          {
            value: '$4.2B',
            note: 'frozen post-settlement with \nselective enforcement',
          },
        ],
        [
          {
            value: '$2B+',
            note: 'Breaking offshore and Swiss bank secrecy \nintroduced $2B+ enforcement costs',
          },
        ],
      ],
      graph: {
        src: '/images/prifi/graph-settlement.webp',
        alt: "Settlement. The chain executes exactly what it's given.",
        tall: false,
      },
    },
  ],
} as const

export const EXPLOIT_BAND = {
  lines: [
    'Each exposed link is an opportunity for exploitation.',
    'Secure one link and the attacker moves to the next.',
  ],
  conclusion: 'PriFi secures the whole supply chain.',
} as const

export const HAZARDS = {
  heading:
    'Two hazard classes threaten transactions: \nThe counterparty and the outsider',
  classes: [
    {
      name: 'THE COUNTERPARTY',
      who: 'The person or institution you’re transacting with',
      risk: 'Counterparties need information to make a deal possible, creating opportunities for misrepresentation, concealment, default, or other opportunism.',
      bound:
        'Able to exploit information made available by necessity, but bound by the deal’s terms.',
    },
    {
      name: 'THE OUTSIDER',
      who: 'Everyone outside of the deal',
      risk: 'Thieves and extortionists can target your holdings and what you can pay. Frontrunners and competitors can exploit your positions and intentions. The state can see it all.',
      bound:
        'Outsiders are not party to the transaction. They signed nothing and cannot be bound by its terms, only denied of exploitable information.',
    },
  ],
} as const

export const PROTECTION = {
  heading: 'Two forms of protection: \nSecurity and secrecy',
  lead: 'The two hazard classes require different defences.',
  body: [
    'Security binds, making defection difficult or costly.',
    'Secrecy starves, denying information needed to identify, \ntarget, or exploit a transaction.',
  ],
  matrix: {
    columns: ['Security - Binds', 'Secrecy - Starves'],
    rows: [
      {
        hazard: 'Counterparty',
        cells: [
          {
            verdict: 'Works',
            reason:
              'Signed into the deal, so they cn be held to it after the fact.',
          },
          {
            verdict: 'Fails',
            reason:
              'Dealing with you requires knowing who you are. Can’t be starved.',
          },
        ],
      },
      {
        hazard: 'Outsider',
        cells: [
          {
            verdict: 'Works',
            reason:
              'Signed into the deal, so they cn be held to it after the fact.',
          },
          {
            verdict: 'Works',
            reason: 'No visibility into the asset means no target to pursue.',
          },
        ],
      },
    ],
  },
} as const

export const TRANSPARENCY = {
  heading:
    'Transparency is an institutional hazard, blocking capital moving onchain',
  body: 'These hazards are mitigated through organisations, institutions, and individuals making credible commitments. These commitments fall into two categories: motivational and imperative.',
} as const

const CREDIBILITY_BODY = [
  'An organisation can break a commitment but has reasons not to.',
  'Discretion is still there. It holds only for as long as the incentives do.',
] as const

const CREDIBILITY_NOTE =
  'Swiss commitment to secrecy fell in 2008 after the US squeezed one identifiable banker.'

export const CREDIBILITY = [
  {
    title: 'Motivational credibility',
    body: CREDIBILITY_BODY,
    note: CREDIBILITY_NOTE,
    image: '/images/prifi/motivational.webp',
  },
  {
    title: 'Imperative credibility',
    body: CREDIBILITY_BODY,
    note: CREDIBILITY_NOTE,
    image: '/images/prifi/imperative.webp',
  },
] as const

const STORAGE_ROLE =
  'Content-addressed, verifiable storage, so the contracting interface becomes \na commitment you can check rather than a server you must trust.'

const BLEND_ROLE =
  'Propagation co-designed with consensus, and private proof of stake, \nso producing a block no longer requires wearing a name tag.'

export const LOGOS_STACK = {
  heading: 'Logos secures the full transaction supply chain',
  body: 'Logos brings imperative credibility to the full transaction supply chain. A complete, unified stack providing unprecedented protection to every link.',
  /** Screen-reader column headers; the design shows the table without them. */
  columns: ['Component', 'What it does', 'Links it covers'],
  rows: [
    {
      component: 'Basecamp',
      role: 'A self-contained desktop application that bundles everything you need to \ninteract with the Logos stack – UI running locally on user controlled hardware',
      covers: 'Covers Discovery and Diligence',
    },
    {
      component: 'Logos Messaging',
      role: 'Anonymous communication and coordination, so discovery and negotiation \nstop leaking intentions before terms exist.',
      covers: 'Covers Negotiation',
    },
    {
      component: 'Logos Storage',
      role: STORAGE_ROLE,
      covers: 'Covers Contracting',
    },
    {
      component: 'Logos Blockchain – Blend',
      role: BLEND_ROLE,
      covers: 'Covers Ordering',
    },
    {
      component: 'Logos Blockchain –\u00a0Cryptarchia',
      role: STORAGE_ROLE,
      covers: 'Covers Settlement',
    },
    {
      component: 'Logos Blockchain – Zones',
      role: BLEND_ROLE,
      covers: 'Covers Enforcement',
    },
  ],
} as const

export const INSTITUTIONS = {
  heading: 'What institutions sold to a few, PriFi makes structural.',
  body: [
    'Security and secrecy have historically been expensive institutional services available through trusted intermediaries and favourable jurisdictions. PriFi extends access to anyone with an online device.',
    'Logos infrastructure elevates institutional commitments from strong motivational to structurally imperative to provide even stronger protections than those that were previously reserved only for the ultra wealthy.',
  ],
} as const

const PAPER_CTA = 'READ THE PAPER'

export const DEEPER_DIVES = {
  heading:
    'Deeper dives into the transaction supply chain and how Logos secures it',
  cards: [
    {
      title: 'Theory',
      subtitle:
        'Vaults of glass: why transparent blockchains \nare incomplete institutions',
      body: 'The full argument — commitment capacity, \nthe two hazard classes, and where the writ stops.',
      cta: PAPER_CTA,
      href: LINKS.theoryPaper,
    },
    {
      title: 'Logos Messaging',
      subtitle: 'Anonymous discovery without \na public broadcast',
      body: 'Metadata protection at the transport layer, and what it costs to keep intentions off the record.',
      cta: PAPER_CTA,
      href: LINKS.messagingPaper,
    },
    {
      title: 'Logos Storage',
      // Figma's trailing breaks hold this one-line placeholder to the same two
      // lines as its neighbours, so the three bodies share a baseline.
      subtitle: 'Lorem Ipsum \n\n',
      body: 'The full argument — commitment capacity, \nthe two hazard classes, and where the writ stops.',
      cta: PAPER_CTA,
      href: LINKS.storagePaper,
    },
  ],
} as const
