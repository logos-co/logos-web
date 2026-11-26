import { test } from 'node:test'
import assert from 'node:assert/strict'

import { activistBuilderCopySectionSchema, activistLeaderStewardCopySectionSchema, bookCopySectionSchema, coalitionPartnerCopySectionSchema, getStartedCopySectionSchema, movementCopySectionSchema, nodeProgrammeCopySectionSchema, operatorsCopySectionSchema, pageSectionSchema, researchCopySectionSchema } from '../pages'

test('getStartedCopy parses a minimal valid value and routes through the union', () => {
  const value = {
    componentType: 'getStartedCopy',
    key: 'getStarted.copy',
    heading: 'Get Started',
    intro: 'x',
    sections: {
      install: { number: '01', heading: 'h', cardTitle: 'c', body: 'b', cta: 'i', imageAlt: 'a' },
      docs: { number: '02', heading: 'h', items: { docs: { title: 't', body: 'b' } }, viewDocsCta: 'v', learnMoreCta: 'l', atomicSwapsCta: 'a', multisigCta: 'm' },
      community: { number: '04', heading: 'h', cta: 'c', items: { forum: 'f' } },
      build: { number: '04', heading: 'h', cta: 'c', nodeCta: 'n', messagingCta: 'm', deployCta: 'd', tryItOutCta: 't', scaffoldCta: 's', items: { node: { title: 't', body: 'b' } } },
    },
  }
  assert.equal(getStartedCopySectionSchema.parse(value).componentType, 'getStartedCopy')
  assert.equal(pageSectionSchema.parse(value).componentType, 'getStartedCopy')
})

test('movementCopy parses a minimal valid value and routes through the union', () => {
  const value = {
    componentType: 'movementCopy',
    key: 'movement.copy',
    heading: 'Movement',
    hero: { title: 't', kicker: 'k', body: 'b', primaryCta: 'p', secondaryCta: 's' },
    intro: { titleLine1: 'a', titleLine2: 'b', body: 'c' },
    actions: { activism: { title: 't', body: 'b', cta: 'c' }, coalition: { title: 't', body: 'b', cta: 'c' }, building: { title: 't', body: 'b', cta: 'c' } },
    campaign: { eyebrow: 'e', kicker: 'k', title: 't', body: 'b', primaryCta: 'p', secondaryCta: 's', tertiaryCta: 't' },
    find: { title: 't', body: 'b', cta: 'c' },
    activismSection: { title: 't', body: 'b', cta: 'c' },
    events: { title: 't', body: 'b', cta: 'c', day1: { date: 'd', weekday: 'w' }, day2: { date: 'd', weekday: 'w' }, day3: { date: 'd', weekday: 'w' }, card: { title: 't', time: 't', timezone: 'z', location: 'l', hosts: 'h' } },
    involved: { title: 't', body: 'b', primaryCta: 'p', secondaryCta: 's' },
    coalition: { title: 't', body: 'b', cta: 'c' },
    builder: { title: 't', body: 'b', primaryCta: 'p', secondaryCta: 's', tertiaryCta: 't', feature: { city: 'c', title: 't', cta: 'c' }, details: { problem: { label: 'l', body: 'b' }, solution: { label: 'l', body: 'b' }, stack: { label: 'l', body: 'b' } } },
    resources: { titleLine1: 'a', titleLine2: 'b', body: 'c', cta: 'd', rows: { start: { number: '01', title: 't', body: 'b', cta: 'c' } } },
  }
  assert.equal(movementCopySectionSchema.parse(value).componentType, 'movementCopy')
  assert.equal(pageSectionSchema.parse(value).componentType, 'movementCopy')
})

test('bookCopy parses a minimal valid value and routes through the union', () => {
  const value = {
    componentType: 'bookCopy',
    key: 'book.copy',
    heading: 'Farewell to Westphalia',
  }
  assert.equal(bookCopySectionSchema.parse(value).componentType, 'bookCopy')
  assert.equal(pageSectionSchema.parse(value).componentType, 'bookCopy')
})

test('researchCopy parses a minimal valid value and routes through the union', () => {
  const value = {
    componentType: 'researchCopy',
    key: 'research.copy',
    hero: {
      kicker: 'R&D across the Logos Network.',
      title: 'Logos\nResearch',
      description: 'Logos Research conducts innovative exploration.',
      ctas: [{ label: 'Specs/RFCs', href: 'https://lip.logos.co/' }],
    },
    overview: {
      title: 'Overview',
      body: { paragraphs: { p1: 'Paragraph one.' } },
      cta: { label: 'Join the Forum', href: 'https://forum.research.logos.co/' },
    },
    resources: {
      title: 'Resources',
      learnMore: 'Learn more',
      items: [{ number: '01', label: 'Specs/RFCs', href: 'https://lip.logos.co/' }],
    },
    contribute: {
      title: 'Contribute',
      copy: {
        howTitle: 'How to contribute',
        contact: 'Get in touch by <discord></discord>.',
        jobs: 'See <jobs></jobs>.',
        links: { discord: 'Discord', forum: 'Forum', github: 'GitHub', jobs: 'IFT jobs' },
        whatTitle: 'What to contribute',
        whatBody: 'Research and code contributions welcome.',
        codeIntro: 'See good first issues:',
        codeLinks: [{ label: 'nim-libp2p', href: 'https://github.com/vacp2p/nim-libp2p' }],
      },
    },
  }
  assert.equal(researchCopySectionSchema.parse(value).componentType, 'researchCopy')
  assert.equal(pageSectionSchema.parse(value).componentType, 'researchCopy')
})

test('nodeProgrammeCopy parses a temporary page and rejects unsafe FAQ links', () => {
  const value = {
    componentType: 'nodeProgrammeCopy',
    key: 'nodeProgramme.copy',
    hero: {
      title: 'Logos Node Referral Programme',
      body: 'Coming soon.',
      image: { src: '/images/node-programme/hero.webp', alt: 'Misty forest' },
      discordCta: 'Join Discord',
    },
    signup: {
      emailLabel: 'Email address',
      emailPlaceholder: 'Email',
      submit: 'Sign up',
      submitting: 'Signing up',
      invalidEmail: 'Invalid email.',
      genericError: 'Failed to sign up.',
      success: 'Signed up.',
      successLink: 'Join Discord',
    },
    basecamp: {
      title: 'Basecamp runs your node.',
      body: 'Prepare for the programme.',
      privacy: 'No cloud.',
      installCta: {
        label: 'Install Basecamp',
        href: 'https://github.com/logos-co/logos-basecamp/releases/latest',
      },
      versionsCta: {
        label: 'View all versions',
        href: 'https://github.com/logos-co/logos-basecamp/releases',
      },
      guideCta: {
        label: 'Node guide',
        href: 'https://docs.logos.co/run-a-node',
      },
      platforms: 'Linux',
      versionLabel: 'Basecamp v{version}',
      testnetLabel: 'Testnet v0.3',
    },
    faqs: {
      title: 'Common questions.',
      cta: { label: 'See all questions', href: '/testnet-faqs' },
      items: [
        {
          question: 'Where do I get help?',
          answer: [
            { text: 'Discord', href: 'https://discord.gg/logosnetwork' },
          ],
        },
      ],
    },
  }
  assert.equal(
    nodeProgrammeCopySectionSchema.parse(value).componentType,
    'nodeProgrammeCopy'
  )
  assert.equal(
    pageSectionSchema.parse(value).componentType,
    'nodeProgrammeCopy'
  )
  assert.equal(
    nodeProgrammeCopySectionSchema.safeParse({
      ...value,
      faqs: {
        ...value.faqs,
        items: [
          {
            question: 'Help?',
            answer: [{ text: 'Unsafe', href: 'javascript:alert(1)' }],
          },
        ],
      },
    }).success,
    false
  )
})

test('operatorsCopy parses a minimal valid value and routes through the union', () => {
  const value = {
    componentType: 'operatorsCopy',
    key: 'operators.copy',
    banner: {
      title: 'Logos Operator programme',
      body: 'The operator programme is closing.',
    },
    documents: {
      terms: { label: 'Terms of Use', slug: 'operators-terms-of-use' },
      privacy: { label: 'Privacy Policy', slug: 'operators-privacy-policy' },
      disclaimer: { label: 'Disclaimer', slug: 'operators-disclaimer' },
    },
  }
  assert.equal(operatorsCopySectionSchema.parse(value).componentType, 'operatorsCopy')
  assert.equal(pageSectionSchema.parse(value).componentType, 'operatorsCopy')
})

test('activistBuilderCopy parses a minimal valid value and routes through the union', () => {
  const value = {
    componentType: 'activistBuilderCopy',
    key: 'activistBuilder.copy',
    heading: 'Activist Builder',
    intro: 'Intro copy.',
    privacy: 'Privacy copy.',
    privacyLink: 'https://logos.co/privacy-policy',
  }
  assert.equal(activistBuilderCopySectionSchema.parse(value).componentType, 'activistBuilderCopy')
  assert.equal(pageSectionSchema.parse(value).componentType, 'activistBuilderCopy')
})

test('activistLeaderStewardCopy parses a minimal valid value and routes through the union', () => {
  const value = {
    componentType: 'activistLeaderStewardCopy',
    key: 'activistLeaderSteward.copy',
    heading: 'Activist Leader / Steward',
    intro: 'Intro copy.',
    privacy: 'Privacy copy.',
    privacyLink: 'https://logos.co/privacy-policy',
  }
  assert.equal(activistLeaderStewardCopySectionSchema.parse(value).componentType, 'activistLeaderStewardCopy')
  assert.equal(pageSectionSchema.parse(value).componentType, 'activistLeaderStewardCopy')
})

test('coalitionPartnerCopy parses a minimal valid value and routes through the union', () => {
  const value = {
    componentType: 'coalitionPartnerCopy',
    key: 'coalitionPartner.copy',
    heading: 'Coalition Partner',
    intro: 'Intro copy.',
    privacy: 'Privacy copy.',
    privacyLink: 'https://logos.co/privacy-policy',
  }
  assert.equal(coalitionPartnerCopySectionSchema.parse(value).componentType, 'coalitionPartnerCopy')
  assert.equal(pageSectionSchema.parse(value).componentType, 'coalitionPartnerCopy')
})
