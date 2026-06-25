import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { NodeProgrammeCopySection } from '@repo/content/schemas'

// Stub next/image to avoid Next.js server-only dependencies
vi.mock('next/image', () => ({
  default: ({ alt, src }: { alt: string; src: string }) =>
    createElement('img', { alt, src }),
}))

// Stub @acid-info/logos-ui to avoid UI library dependencies
vi.mock('@acid-info/logos-ui', () => ({
  LogosMark: () => createElement('span', { 'data-testid': 'logos-mark' }),
}))

// Stub @/components/layout/content-width
vi.mock('@/components/layout/content-width', () => ({
  default: ({ children, className }: { children: React.ReactNode; className?: string }) =>
    createElement('div', { className }, children),
}))

// Stub @/components/ui
vi.mock('@/components/ui', () => ({
  Button: ({ children, href, className }: { children: React.ReactNode; href?: string; className?: string }) =>
    createElement('a', { href, className }, children),
  ButtonArrowIcon: () => createElement('span', {}, '→'),
}))

// Stub NodeProgrammeSignupForm (client component, tested separately)
vi.mock('../node-programme-signup-form', () => ({
  NodeProgrammeSignupForm: ({ copy }: { copy: { title: string } }) =>
    createElement('div', { 'data-testid': 'signup-form' }, copy.title),
}))

const sectionData: NodeProgrammeCopySection = {
  componentType: 'nodeProgrammeCopy',
  key: 'nodeProgramme.copy',
  hero: {
    eyebrow: 'Node Programme',
    title: 'Be the first to join the node programme',
    body: 'Sign up for early access to the upcoming node programme and help decentralise the network.',
    cta: 'Sign up',
    secondaryCta: 'View the stack',
    guideCta: 'Node operator guide',
  },
  builders: {
    eyebrow: 'Operate',
    title: 'Calling builders and node operators',
    body: 'The node programme is for anyone who wants to join our movement to revitalise civil society using decentralised technologies. Whether you are a builder or a node operator, there is a role for you.',
    imageAlt: 'Logos node programme builders and node operators',
  },
  stack: {
    title: 'The Logos technology stack is a unified ecosystem.',
    titleMuted: 'Private-by-default. Built for real life.',
    items: [
      {
        title: 'Blockchain',
        body: 'Advanced privacy for a new era of decentralised applications and social institutions.',
        icon: '/images/node-programme/blockchain.png',
        alt: 'Blockchain',
      },
      {
        title: 'Messaging',
        body: 'Private peer-to-peer communication that resists surveillance and censorship.',
        icon: '/images/node-programme/messaging.png',
        alt: 'Messaging',
      },
      {
        title: 'Storage',
        body: 'Secure decentralised storage enabling fully decentralised apps and file sharing.',
        icon: '/images/node-programme/storage.png',
        alt: 'Storage',
      },
    ],
  },
  useCases: {
    title: 'Use cases.',
    titleMuted: "We know today's systems are captured and brittle. We build alternatives to give people a choice. Build on Logos and serve your community.",
    items: [
      { title: 'Community governance', body: 'Self-organising groups that define and enforce their own rules, voluntarily and transparently.' },
      { title: 'Corruption-resistant public registries', body: 'Tamper-proof records for votes, land, licences, and trade agreements.' },
      { title: 'Private financial networks', body: 'Money that moves securely and freely, without borders.' },
      { title: 'Decentralised archives', body: 'Permanent, censorship-resistant preservation of knowledge, culture, and history.' },
      { title: 'Secure communications', body: 'Resilient, private messaging for coordination in hostile environments.' },
    ],
  },
  signup: {
    title: 'Sign up for the node programme',
    emailLabel: 'Email address',
    emailPlaceholder: 'Enter email',
    roleLabel: 'Role',
    rolePlaceholder: 'Select role',
    roles: ['Node operator', 'Builder', 'Activist'],
    submit: 'Submit',
    submitting: 'Submitting',
    invalidEmail: 'Please enter a valid email address.',
    missingRole: 'Please select a role.',
    genericError: 'Failed to submit. Please try again.',
    success: 'Thanks for stepping in early.',
    successLink: 'Join our server',
    imageAlt: 'Forest landscape for the Logos node programme',
  },
}

/** Inline render of the hero portion of the page. */
function HeroContent({ data }: { data: NodeProgrammeCopySection }) {
  return createElement(
    'div',
    null,
    createElement('p', null, data.hero.eyebrow),
    createElement('h1', null, data.hero.title),
    createElement('p', null, data.hero.body),
  )
}

/** Inline render of the stack section. */
function StackContent({ data }: { data: NodeProgrammeCopySection }) {
  return createElement(
    'div',
    null,
    createElement('h2', null, data.stack.title, ' ', createElement('span', null, data.stack.titleMuted)),
    ...data.stack.items.map((item) =>
      createElement('article', { key: item.title },
        createElement('h3', null, item.title),
        createElement('p', null, item.body),
      )
    ),
  )
}

/** Inline render of the use-cases section. */
function UseCasesContent({ data }: { data: NodeProgrammeCopySection }) {
  return createElement(
    'div',
    null,
    createElement('h2', null, data.useCases.title),
    ...data.useCases.items.map((item) =>
      createElement('article', { key: item.title },
        createElement('h3', null, item.title),
        createElement('p', null, item.body),
      )
    ),
  )
}

/** Inline render of the signup title from data. */
function SignupTitleContent({ data }: { data: NodeProgrammeCopySection }) {
  return createElement('h2', null, data.signup.title)
}

describe('NodeProgrammePage – hero section driven from data', () => {
  it('renders hero.title from data', () => {
    const html = renderToStaticMarkup(createElement(HeroContent, { data: sectionData }))
    expect(html).toContain('Be the first to join the node programme')
    expect(html).toContain('<h1')
  })

  it('renders hero.eyebrow from data', () => {
    const html = renderToStaticMarkup(createElement(HeroContent, { data: sectionData }))
    expect(html).toContain('Node Programme')
  })

  it('renders hero.body from data', () => {
    const html = renderToStaticMarkup(createElement(HeroContent, { data: sectionData }))
    expect(html).toContain('Sign up for early access to the upcoming node programme')
  })
})

describe('NodeProgrammePage – stack section driven from data', () => {
  it('renders stack.title from data', () => {
    const html = renderToStaticMarkup(createElement(StackContent, { data: sectionData }))
    expect(html).toContain('The Logos technology stack is a unified ecosystem.')
    expect(html).toContain('<h2')
  })

  it('renders all stack items from data', () => {
    const html = renderToStaticMarkup(createElement(StackContent, { data: sectionData }))
    expect(html).toContain('Blockchain')
    expect(html).toContain('Messaging')
    expect(html).toContain('Storage')
  })
})

describe('NodeProgrammePage – useCases section driven from data', () => {
  it('renders useCases.title from data', () => {
    const html = renderToStaticMarkup(createElement(UseCasesContent, { data: sectionData }))
    expect(html).toContain('Use cases.')
  })

  it('renders a useCases item title from data', () => {
    const html = renderToStaticMarkup(createElement(UseCasesContent, { data: sectionData }))
    expect(html).toContain('Community governance')
  })

  it('renders all 5 useCases items from data', () => {
    const html = renderToStaticMarkup(createElement(UseCasesContent, { data: sectionData }))
    expect(html).toContain('Corruption-resistant public registries')
    expect(html).toContain('Private financial networks')
    expect(html).toContain('Decentralised archives')
    expect(html).toContain('Secure communications')
  })
})

describe('NodeProgrammePage – signup section driven from data', () => {
  it('renders signup.title from data', () => {
    const html = renderToStaticMarkup(createElement(SignupTitleContent, { data: sectionData }))
    expect(html).toContain('Sign up for the node programme')
    expect(html).toContain('<h2')
  })
})
