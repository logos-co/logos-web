import { test } from 'node:test'
import assert from 'node:assert/strict'

import { bookCopySectionSchema, brandKitCopySectionSchema, getStartedCopySectionSchema, lambdaPrizeCopySectionSchema, movementCopySectionSchema, nodeProgrammeCopySectionSchema, pageSectionSchema, researchCopySectionSchema } from '../pages'

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
    builder: { title: 't', body: 'b', primaryCta: 'p', secondaryCta: 's', feature: { city: 'c', title: 't', cta: 'c' }, details: { problem: { label: 'l', body: 'b' }, solution: { label: 'l', body: 'b' }, stack: { label: 'l', body: 'b' } } },
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

test('brandKitCopy parses a minimal valid value and routes through the union', () => {
  const value = {
    componentType: 'brandKitCopy',
    key: 'brandKit.copy',
    heading: 'Brand Kit',
    intro: 'Some intro text.',
    downloads: {
      brandMarksLabel: 'Download Brand Marks',
      brandMarksHref: '/brand-kit/brand-marks.zip',
      guidelinesSection: 'Brand Guidelines',
      guidelinesLabel: 'Download Brand Guidelines',
      guidelinesHref: '/brand-kit/logos-brand-guidelines.pdf',
    },
  }
  assert.equal(brandKitCopySectionSchema.parse(value).componentType, 'brandKitCopy')
  assert.equal(pageSectionSchema.parse(value).componentType, 'brandKitCopy')
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

test('nodeProgrammeCopy parses a minimal valid value and routes through the union', () => {
  const value = {
    componentType: 'nodeProgrammeCopy',
    key: 'nodeProgramme.copy',
    hero: { eyebrow: 'Node Programme', title: 'Be the first', body: 'Sign up for early access.', cta: 'Sign up', secondaryCta: 'View the stack' },
    builders: { eyebrow: 'Operate', title: 'Calling builders', body: 'The node programme is for anyone.', imageAlt: 'Builders image' },
    stack: {
      title: 'The Logos technology stack.',
      titleMuted: 'Private-by-default.',
      items: [{ title: 'Blockchain', body: 'Advanced privacy.', icon: '/images/blockchain.png', alt: 'Blockchain' }],
    },
    useCases: {
      title: 'Use cases.',
      titleMuted: 'We build alternatives.',
      items: [{ title: 'Community governance', body: 'Self-organising groups.' }],
    },
    signup: {
      title: 'Sign up',
      emailLabel: 'Email address',
      emailPlaceholder: 'Enter email',
      roleLabel: 'Role',
      rolePlaceholder: 'Select role',
      roles: ['Node operator'],
      submit: 'Submit',
      submitting: 'Submitting',
      invalidEmail: 'Please enter a valid email address.',
      missingRole: 'Please select a role.',
      genericError: 'Failed to submit.',
      success: 'Thanks for stepping in early.',
      successLink: 'Join our server',
      imageAlt: 'Forest landscape',
    },
  }
  assert.equal(nodeProgrammeCopySectionSchema.parse(value).componentType, 'nodeProgrammeCopy')
  assert.equal(pageSectionSchema.parse(value).componentType, 'nodeProgrammeCopy')
})

test('lambdaPrizeCopy parses a minimal valid value and routes through the union', () => {
  const row = { label: 'l', body: 'b' }
  const value = {
    componentType: 'lambdaPrizeCopy',
    key: 'lambdaPrize.copy',
    hero: { label: 'Prize', heading: 'The frontier is open.', body: 'Build on Logos.', primaryCta: 'View Prizes', secondaryCta: 'Builder Hub' },
    howItWorks: { heading: 'How It Works', rows: [row] },
    evaluation: { heading: 'Evaluation Criteria', primaryCta: 'View Prizes', secondaryCta: 'Discord', rows: [row] },
    featured: {
      heading: 'Featured Prizes',
      status: 'Open',
      prizes: [{ meta: { id: 'LP-0001', effort: 'Effort: Small', prize: 'Prize: $100' }, title: 'Test Prize', body: 'Prize body.', url: 'https://github.com/logos-co/lambda-prize/blob/master/prizes/LP-0001.md' }],
    },
    about: { heading: 'About', body: 'About body.', primaryCta: 'View Prizes', secondaryCta: 'Start Building', rows: [row] },
    techStack: { startBuildingCta: 'Start Building', docsCta: 'View the docs' },
    support: { heading: 'Get Support', body: 'Find examples.', cta: 'Help Center', rows: [{ label: 'Sample Apps', body: 'Explore.', action: 'View' }] },
  }
  assert.equal(lambdaPrizeCopySectionSchema.parse(value).componentType, 'lambdaPrizeCopy')
  assert.equal(pageSectionSchema.parse(value).componentType, 'lambdaPrizeCopy')
})
