/**
 * Copy for the "Check everyone to catch no one" campaign landing page.
 *
 * Kept colocated with the route (rather than in `content/pages/en`) because the
 * page is a one-off campaign layout whose slug is expected to change; the same
 * pattern the `/ukdebt` campaign follows. Every string below is reproduced
 * verbatim from the Figma source so design review can diff copy in one place.
 */

/**
 * Search copy. Not from Figma — written for search results and social cards,
 * and reused by the page's structured data so there is one description of the
 * page rather than two.
 */
export const SEO = {
  title: 'Check everyone to catch no one | Logos',
  // Kept under ~160 characters so search results show it whole. The longer
  // framing lives in the page's own opening paragraph.
  description:
    'EU and UK child-safety proposals could come at a significant cost to privacy and security. Here’s what leading researchers have found.',
} as const

/** Identifies which route a CTA card points at. */
export type CtaCardKey = 'buildTheParallel' | 'joinACircle'

export type Exhibit = {
  quote: string
  lines: readonly string[]
}

export type ChartRow = {
  label: string
  value: string
  /** Arrow direction shown beside the value. */
  direction: 'down' | 'up'
  /** Bar fill as a share of the track, 0–1. `null` renders the hatched track. */
  fill: number | null
}

export type ChartGroup = {
  legend: string
  rows: readonly ChartRow[]
}

export const HERO = {
  headlineLine1: 'Check everyone',
  headlineLine2: 'to catch no one',
  intro:
    "Two measures being advanced in the EU and UK illustrate how governments promise to protect children by checking everyone's private communications or age. The cryptographers and security researchers at the forefront of digital security say the proposed systems will not catch the offenders they’re supposed to bring to justice and that everyone else bears the cost. This is their evidence, in their words.",
} as const

export const PROMISE = {
  heading: 'What the laws say they do',
  body: [
    "The EU's Child Sexual Abuse Regulation, the proposal widely known as Chat Control, would require messaging services to scan the contents of private messages for illegal images. But there’s a catch.",
    'A message protected by end-to-end encryption can only be read on the two devices at either end of the conversation, so the only place left to inspect it is your own phone, before message content is sealed and sent. That’s the proposed mechanism: software running on your device, reading your messages on behalf of the state, before you have sent them to anyone.',
    "The UK's under-16 social media ban rules arrive at the same destination from a different direction. To keep younger teenagers off a platform, the platform first has to establish how old every user is. There’s no way to confirm that a 15-year-old is 15 without also making a 40-year-old prove they are 40. An age gate aimed at children is, in practice, an identity gate for everyone who uses the service.",
    'Both measures are sold as a narrow, targeted tool, aimed squarely at predators, to protect children, with little cost to anyone else. That pitch rests on two promises. First, the tool actually catches the people it targets. Second, the price paid by everyone else is small.',
    'The research that follows was produced by the cryptographers, security engineers, and social scientists who build and test exactly the encryption systems under threat. It takes the two promises in order. Neither stands up against the evidence.',
  ],
} as const

export const DOES_NOT_CATCH = {
  heading: 'It doesn’t catch them',
  intro:
    "Start with the scanning. In 2024, 14 of the world's most senior cryptographers published a peer-reviewed review of client-side scanning (CSS). Among the authors are Ronald Rivest and Whitfield Diffie, pioneers of the public-key cryptography that secures the modern internet, alongside Bruce Schneier and Susan Landau, whose work shapes how governments themselves reason about surveillance. These aren’t campaigners. They’re the people who would have to make the technology work. Having examined it closely, they concluded that, on its own terms, it fails.",
  exhibit01: {
    quote:
      '“CSS neither guarantees efficacious crime prevention nor prevents surveillance. Indeed, the effect is the opposite.”',
    lines: [
      'Abelson, Harold, et al. “Bugs in our pockets: the risks of client-side scanning”',
      'Journal of Cybersecurity 10.1 (2024): tyad020',
    ],
  },
  afterExhibit01: [
    "Their reasoning is concrete, not rhetorical. A scanner that reads everyone's messages doesn’t reliably find criminal material because the detectors may be defeated through methods like poisoning attacks or false positive attacks. While the people actually trafficking that material adapt and slip around the check, the scanner keeps reading the private messages of the entire population, i.e. people that were never a threat.",
    'The result is the surveillance of everyone, and almost none of the enforcement that was promised. Crucially, the report finds no design that escapes this outcome. The failure is structural, not a rough edge to be smoothed out in a future version.',
    'The age checks fail for the same underlying reason, and the objection is not a fringe position. In September 2025, 807 named scientists and security researchers from 37 countries signed a joint statement to the European Parliament and Council. Their assessment of age verification was unambiguous.',
  ],
  exhibit02: {
    quote: '“... age verification controls can be evaded with ease.”',
    lines: [
      'Joint statement of scientists & researchers',
      '807 signatories · 37 countries · September 2025 · incl. Green, Landau, Troncoso, Preneel',
    ],
  },
  afterExhibit02:
    "They weren’t speaking hypothetically. They pointed directly to the UK's own experience under the Online Safety Act, where the arrival of age checks pushed users towards services that don't run them and VPNs that let a person appear to be somewhere the rules don’t apply. This cannot be argued away. It already happened, on a national scale. A separate study from the US shows us how large such a behaviour shift may be.",
  studyHeading: 'With checks activated, did people stop or move?',
  studyBody: [
    "In 2023, more than 20 US states began forcing adult sites to verify visitors' ages. The two biggest sites differed in their response: the market leader blocked users in those states or pulled out entirely. Its main rival ignored the rules and stayed open.",
    'Researchers measured what people did next, comparing searches in the affected states against what would have happened without the law. In the three months after the laws were passed, there was a 51% decrease in searches for the most popular site which complied with state age verification laws. Searches for the second most popular site, which did not comply with state laws, increased 48.1%, while searches for VPN services increased 23.6%. Demand didn’t drop. It simply moved.',
  ],
  closingLines: [
    'The compliant site lost half its traffic.  Almost all',
    "of it reappeared somewhere the law couldn't reach.",
    '',
    "The rules didn't stop the behaviour. They relocated it.",
  ],
} as const

export const CHART: {
  readonly source: readonly string[]
  readonly groups: readonly ChartGroup[]
} = {
  source: [
    'Lang, David, et al. “Age verification and public adaptation: A pre-registered synthetic control multiverse.”',
  ],
  groups: [
    {
      legend: 'WHAT THE LAW WAS MEANT TO DO',
      rows: [
        {
          label: 'Search for the site that complied (mostly by blocking the state)',
          value: '-51%',
          direction: 'down',
          fill: null,
        },
      ],
    },
    {
      legend: 'WHERE USERS ACTUALLY WENT',
      rows: [
        {
          label: 'Searches for the non-compliant rival (that ignored the law)',
          value: '+48%',
          direction: 'up',
          fill: 550 / 621,
        },
        {
          label: 'Searches for VPNs (to hide location and bypass the check)',
          value: '+23%',
          direction: 'up',
          fill: 349 / 621,
        },
      ],
    },
  ],
} as const

export const WE_ALL_PAY = {
  heading: 'We all pay',
  standfirstLines: [
    'If the target walks around the checkpoint,',
    'it doesn’t stop operating.',
  ],
  bodyBeforeExhibit: [
    'It continues to invade the privacy of everyone who acted lawfully and passed through it. The second promise was that the cost to those people is small. Researchers have measured what actually happens to your data when you submit to an age check. At the 2026 IEEE Symposium on Security and Privacy, the leading venue in the field, a team from Georgia Tech and UC Irvine published the first large-scale study of how age verification is really deployed across the web. What they found contradicted the central assurance written into these laws.',
    "Most sites covered by age-verification laws don't actually enforce them. The ones that do often outsource the job to a small number of third-party verification companies, one of which handles an estimated 60% of the market.",
    'Depending on the method used, a single check can capture your face and browser fingerprinting, and pass identifying details to other firms, including credit-card processors and location services. The justification written into these laws is that verification companies are commercially motivated to protect what they collect. But the study found that such data may be entrusted not only to the contracted provider, but also to several “fourth parties” that are significantly less visible to users.',
    'This isn’t the failure of one badly run vendor or one careless country. A 2026 study evaluated deployed age-verification systems across several European jurisdictions, testing whether they actually deliver on their claims.',
  ],
  exhibit03: {
    quote:
      "“... the effectiveness of today's deployed systems is more often presumed than proven.”",
    lines: [
      'Lavermicocca, Carminati & Longari — “X-rated Compliance Theater”',
      'Multi-country study, 2026 · effectiveness fragile, privacy cost real',
    ],
  },
  bodyAfterExhibit: [
    'Not one of the tested systems held up against a realistic attempt to fool it, and verified access could be captured and passed to others. Yet every innocent user still handed over real personal data to use the services. The trade, in plain terms, is real exposure for everyone in return for protection that, on inspection, isn’t actually there.',
  ],
} as const

export const RIGHT_QUESTION = {
  heading: 'Ask the right question',
  standfirstLines: [
    'The debate was framed by the agencies',
    'that want the capability.',
  ],
  intro:
    "In 2022, the technical directors of GCHQ and the UK's National Cyber Security Centre published the state's case for scanning. Ross Anderson, professor of security engineering at Cambridge and Edinburgh, answered them directly, not with a plea for privacy over safety, but with an argument that we have been shown the problem from the wrong end.",
  exhibit04: {
    quote:
      '“... we should view the child safety debate from the perspective of children at risk of violence, rather than from that of the security and intelligence agencies and the firms that sell surveillance software.”',
    lines: [
      'Ross Anderson, “Chat Control or Child Protection?”',
      'Universities of Cambridge and Edinburgh, 2022 · a direct response to GCHQ and the NCSC',
    ],
  },
  body: [
    "The paper argues most violence against children is family violence, committed at home by someone the child already knows. Abuse that begins online, with a stranger, is the minority of cases. A scanner reading everyone's messages is aimed at the smallest part of the problem.",
    "Meanwhile, the people who actually protect children have been defunded. Child protection is done by teachers, GPs, social workers, and local police who know the family, and they have been starved of resources while the money is spent on flawed central technical systems. The proposal fails to help and crowds out what works. Meanwhile, the agencies promising to catch predators by inspecting everyone's messages have, as Anderson notes, historically faced no penalty when they fail to prevent harm.",
  ],
} as const

export const WHAT_IT_TAKES = {
  heading: 'The Logos approach: Private tech and civic resilience',
  standfirstLines: [
    'Privacy-preserving technology and institutions',
    'that serve the communities they belong to.',
    'Both strengthen one another.',
  ],
  body: [
    'Logos is building them both.',
    'The Logos stack. Peer-to-peer communications, storage and a blockchain layer, decentralised and privacy-preserving by construction. No central point to hand data to, no gate where a booth could be installed, no operator who could be compelled to open one. Privacy here is not secrecy. It is a right made enforceable by cryptography rather than policy.',
    "Logos Circles. Technology alone won't save us. Logos Circles are self-organised local groups that translate the tools and values of Logos into collective action. By tackling winnable issues that matter locally, from cleanups and community fundraising to advocacy against measures that threaten our freedoms, Circles build the trust, solidarity, and parallel civic capacity that a resilient, people-powered network requires.",
  ],
  cards: [
    { key: 'buildTheParallel', title: 'Build the Parallel', cta: 'Get Started' },
    { key: 'joinACircle', title: 'Join a Circle', cta: 'Join the movement' },
  ],
} as const

export const CASE_FILE = {
  heading: 'The case file',
  noteLines: [
    'Each quoted line above is reproduced verbatim from its source. The findings are paraphrased,',
    'and the full argument behind each is in the sources below. They are worth reading in full.',
  ],
  sources: [
    {
      index: '01',
      href: 'https://academic.oup.com/cybersecurity/article/10/1/tyad020/7590463',
      text: 'Abelson, Harold, et al. “Bugs in our pockets: the risks of client-side scanning.” Journal of Cybersecurity 10.1 (2024): tyad020.',
    },
    {
      index: '02',
      href: 'https://csa-scientist-open-letter.org/Sep2025',
      text: 'Joint statement of scientists and researchers on the EU CSA Regulation, September 2025. 807 signatories, 37 countries.',
    },
    {
      index: '03',
      href: 'https://mikespecter.com/assets/pdf/AgeVerification.pdf',
      text: 'Minocha, Shreyas, et al. “Papers, Please: A First Look at Age Verification on the Web.” 2026 IEEE Symposium on Security and Privacy (SP). IEEE, 2026.',
    },
    {
      index: '04',
      href: 'https://arxiv.org/pdf/2606.08667',
      text: 'Lavermicocca, Simone, Michele Carminati, and Stefano Longari. “X-rated Compliance Theater: An Empirical Evaluation of European Age Verification Systems in Adult Websites.” arXiv preprint arXiv:2606.08667 (2026).',
    },
    {
      index: '05',
      href: 'https://journals.sagepub.com/doi/10.1177/2755323X251415424',
      text: 'Lang, David, et al. “Age verification and public adaptation: A pre-registered synthetic control multiverse.” Journal of Law & Empirical Analysis 3.1 (2026): 23-50.',
    },
    {
      index: '06',
      href: 'https://arxiv.org/pdf/2210.08958',
      text: 'Anderson, Ross. “Chat control or child protection?” arXiv preprint arXiv:2210.08958 (2022).',
    },
  ],
} as const
