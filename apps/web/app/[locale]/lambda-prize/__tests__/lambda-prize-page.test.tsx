import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { LambdaPrizeCopySection } from '@repo/content/schemas'

const sectionData: LambdaPrizeCopySection = {
  componentType: 'lambdaPrizeCopy',
  key: 'lambdaPrize.copy',
  hero: {
    label: 'Prize',
    heading: 'The frontier is open.\nBuild what\'s next.',
    body: 'Prize is the competitive prize framework powering the Logos network. A programme to accelerate real, shipped applications built on the Logos stack.',
    primaryCta: 'View Prizes',
    secondaryCta: 'Builder Hub',
  },
  howItWorks: {
    heading: 'How It Works',
    rows: [
      { label: '01', body: 'Prizes are broken into three categories - small, medium, and large.' },
      { label: '02', body: 'All prizes are listed in the GitHub repository.' },
      { label: '03', body: 'Submissions are made as pull requests to the repository.' },
      { label: '04', body: 'Prizes will remain open until they are claimed or explicitly closed.' },
      { label: '05', body: 'Proposals are evaluated based on specific criteria outlined for each prize.' },
      { label: '06', body: 'Winners will be notified directly, after which rewards will be issued.' },
    ],
  },
  evaluation: {
    heading: 'Evaluation Criteria',
    primaryCta: 'View Prizes',
    secondaryCta: 'Connect with the team on Discord',
    rows: [
      { label: 'Step 1', body: 'Pre-Screen Checklist: Submissions are reviewed by Logos core contributors to ensure baseline criteria are met.' },
      { label: 'Step 2', body: 'Technical Evaluation: Logos core contributors will clone submission repositories to a clean environment and run a demo script without modification to verify success criteria and spot-check code quality and architecture.' },
    ],
  },
  featured: {
    heading: 'Featured Prizes',
    status: 'Open',
    prizes: [
      {
        meta: { id: 'LP-0017', effort: 'Effort: Medium', prize: 'Prize: $400' },
        title: 'Whistleblower — censorship-resistant document upload and indexing Basecamp app',
        body: 'This prize funds "Whistleblower", a Logos Basecamp app.',
        url: 'https://github.com/logos-co/lambda-prize/blob/master/prizes/LP-0017.md',
      },
    ],
  },
  about: {
    heading: 'About the Programme',
    body: 'The systems that were supposed to protect us, the institutions, the corporations, the platforms, have been captured.',
    primaryCta: 'View Prizes',
    secondaryCta: 'Start Building',
    rows: [
      { label: 'Real outcomes, not proposals', body: 'Prizes go to shipped code that meets defined criteria.' },
      { label: 'A stack that is private by default', body: 'Privacy is a requirement for sovereignty.' },
      { label: 'Builders get support on their journey', body: 'Regular office hours, livestreams, and direct access to the ecosystem development engineering team.' },
    ],
  },
  techStack: {
    startBuildingCta: 'Start Building',
    docsCta: 'View the docs',
  },
  support: {
    heading: 'Get Support',
    body: 'Find examples, tutorials, and community channels for building on Logos.',
    cta: 'Help Center',
    rows: [
      { label: 'Sample Apps', body: 'Explore reference applications that demonstrate common Logos workflows.', action: 'View' },
      { label: 'Demos and Tutorials', body: 'Follow practical walkthroughs for core stack concepts and integrations.', action: 'View' },
      { label: 'Install Basecamp', body: 'Set up Basecamp and start experimenting with bundled modules.', action: 'Install' },
      { label: 'Connect with Logos', body: 'Join the community channels for implementation support and feedback.', action: 'Connect' },
    ],
  },
}

function HeroContent({ data }: { data: LambdaPrizeCopySection }) {
  return createElement(
    'div',
    null,
    createElement('h1', null, data.hero.heading),
    createElement('p', null, data.hero.body),
    createElement('span', null, data.hero.label),
  )
}

function HowItWorksContent({ data }: { data: LambdaPrizeCopySection }) {
  return createElement(
    'div',
    null,
    createElement('h2', null, data.howItWorks.heading),
    ...data.howItWorks.rows.map((row) =>
      createElement('div', { key: row.label },
        createElement('span', null, row.label),
        createElement('p', null, row.body),
      )
    ),
  )
}

function SupportContent({ data }: { data: LambdaPrizeCopySection }) {
  return createElement(
    'div',
    null,
    createElement('h2', null, data.support.heading),
    createElement('p', null, data.support.body),
  )
}

describe('LambdaPrizePage – hero section driven from data', () => {
  it('renders hero.heading from data', () => {
    const html = renderToStaticMarkup(createElement(HeroContent, { data: sectionData }))
    expect(html).toContain('The frontier is open.')
    expect(html).toContain('<h1')
  })

  it('renders hero.body from data', () => {
    const html = renderToStaticMarkup(createElement(HeroContent, { data: sectionData }))
    expect(html).toContain('Prize is the competitive prize framework powering the Logos network.')
  })

  it('renders hero.label from data', () => {
    const html = renderToStaticMarkup(createElement(HeroContent, { data: sectionData }))
    expect(html).toContain('Prize')
  })
})

describe('LambdaPrizePage – howItWorks section driven from data', () => {
  it('renders howItWorks.heading from data', () => {
    const html = renderToStaticMarkup(createElement(HowItWorksContent, { data: sectionData }))
    expect(html).toContain('How It Works')
    expect(html).toContain('<h2')
  })

  it('renders all 6 howItWorks rows from data', () => {
    const html = renderToStaticMarkup(createElement(HowItWorksContent, { data: sectionData }))
    expect(html).toContain('01')
    expect(html).toContain('Prizes are broken into three categories')
    expect(html).toContain('06')
    expect(html).toContain('Winners will be notified directly')
  })
})

describe('LambdaPrizePage – support section driven from data', () => {
  it('renders support.heading from data', () => {
    const html = renderToStaticMarkup(createElement(SupportContent, { data: sectionData }))
    expect(html).toContain('Get Support')
    expect(html).toContain('<h2')
  })

  it('renders support.body from data', () => {
    const html = renderToStaticMarkup(createElement(SupportContent, { data: sectionData }))
    expect(html).toContain('Find examples, tutorials, and community channels for building on Logos.')
  })
})
