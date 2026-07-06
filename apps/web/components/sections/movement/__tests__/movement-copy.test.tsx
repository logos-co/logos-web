import { createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { MovementCopySection } from '@repo/content/schemas'

// Stub next/image to avoid Next.js image optimization in Node tests
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    className,
  }: {
    src: string
    alt: string
    className?: string
  }) => createElement('img', { src, alt, className }),
}))

// Stub logos-ui to avoid ESM/browser-only issues
vi.mock('@acid-info/logos-ui', () => ({
  LogosMark: ({ size }: { size?: number }) =>
    createElement('span', { 'data-logos-mark': true, 'data-size': size }),
}))

// Stub navigation to avoid Next.js router dependency
vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href }: { children: ReactNode; href: string }) =>
    createElement('a', { href }, children),
}))

// Stub icon-mask to avoid SVG/browser-only dependency
vi.mock('@/components/icons/icon-mask', () => ({
  IconMask: ({ src, className }: { src: string; className?: string }) =>
    createElement('span', { 'data-icon-mask': src, className }),
}))

// Stub circles-map to avoid heavy map dependencies
vi.mock('@/components/sections/circles/circles-map', () => ({
  default: () => createElement('div', { 'data-testid': 'circles-map' }),
}))

// Stub shared sections that depend on circle records
vi.mock('@/components/sections/shared/upcoming-events-section', () => ({
  UpcomingEventsSection: () =>
    createElement('div', { 'data-testid': 'upcoming-events-section' }),
}))

vi.mock('@/components/sections/shared/circle-resources-section', () => ({
  CircleResourcesSection: () =>
    createElement('div', { 'data-testid': 'circle-resources-section' }),
}))

import { MovementPageView } from '../movement-page'

const fixture: MovementCopySection = {
  componentType: 'movementCopy',
  key: 'movement.copy',
  heading: 'Movement',
  hero: {
    title: 'Logos Movement',
    kicker: 'Local action',
    body: 'Logos is a movement of builders, activists, and community organisers rebuilding civil society.',
    primaryCta: 'Join a circle',
    secondaryCta: 'Start a new circle',
  },
  intro: {
    titleLine1: 'The Movement',
    titleLine2: 'to Rebuild Society',
    body: 'Technology alone will not save us. Join activists working to rebuild civil society.',
  },
  actions: {
    activism: {
      title: 'Activism',
      body: 'Join a Circle to meet fellow activists.',
      cta: 'Take action',
    },
    coalition: {
      title: 'Coalition',
      body: 'Collaborate with organisations.',
      cta: 'Join the coalition',
    },
    building: {
      title: 'Impact Building',
      body: 'Build tech that creates real impact.',
      cta: 'Build for impact',
    },
  },
  campaign: {
    eyebrow: 'Movement',
    kicker: 'Activism starts local',
    title: 'Join an Activist Circle',
    body: 'Logos Circles are self-organised groups.',
    primaryCta: 'Join an upcoming circle',
    secondaryCta: 'Propose a new circle',
    tertiaryCta: 'Join the community',
  },
  find: {
    title: 'Find a Circle near you.',
    body: 'Activist leaders are organising around the world.',
    cta: 'Find a circle near you',
  },
  activismSection: {
    title: 'Activism in Action',
    body: 'Local Circles are solving winnable issues every week.',
    cta: 'Submit an issue',
  },
  events: {
    title: 'Upcoming Events',
    body: 'Ideas from our community.',
    cta: 'See full calendar',
    day1: { date: 'January 21', weekday: 'Wednesday' },
    day2: { date: 'January 22', weekday: 'Thursday' },
    day3: { date: 'January 23', weekday: 'Friday' },
    card: {
      title: 'Logos Circle Florianopolis #2',
      time: '12:00 PM - 6:00 PM',
      timezone: 'GMT+1',
      location: 'Florianopolis, Santa Catarina',
      hosts: 'By InfinityBase',
    },
  },
  involved: {
    title: 'Get involved.',
    body: 'Chat with fellow activists every week.',
    primaryCta: 'Join the conversation on X',
    secondaryCta: 'Join the community',
  },
  coalition: {
    title: 'Join the Coalition.',
    body: 'It takes a village.',
    cta: 'Join the coalition',
  },
  builder: {
    title: 'Become an Activist Builder',
    body: 'Every movement needs its tools.',
    primaryCta: 'Build for impact',
    secondaryCta: 'Build on Logos stack',
    feature: {
      city: 'Benin',
      title: 'Regenerative Social DeFi Fundraising Platform',
      cta: 'View issue',
    },
    details: {
      problem: {
        label: 'Problem',
        body: 'Grassroots projects struggle to access funding.',
      },
      solution: {
        label: 'Solution',
        body: 'Build a regenerative fundraising platform.',
      },
      stack: {
        label: 'Stack',
        body: 'React, Node.js, Aave/Morpho.',
      },
    },
  },
  resources: {
    titleLine1: 'Circles',
    titleLine2: 'Resources',
    body: 'Ideas from our community.',
    cta: 'Help Center',
    rows: {
      start: {
        number: '01',
        title: 'Start your own Circle',
        body: 'Advanced privacy.',
        cta: 'Learn More',
      },
      forum: {
        number: '02',
        title: 'Forum',
        body: 'Advanced privacy.',
        cta: 'Learn More',
      },
      discord: {
        number: '03',
        title: 'Discord',
        body: 'Advanced privacy.',
        cta: 'Learn More',
      },
    },
  },
}

const circlesSettings = {
  eventsSection: { title: 'Events', body: 'Events body', cta: 'See events' },
  resourcesSection: {
    title: 'Resources',
    body: 'Resources body',
    cta: 'See resources',
  },
}

describe('MovementPageView – content-driven copy', () => {
  it('renders hero body from data prop', () => {
    const html = renderToStaticMarkup(
      createElement(MovementPageView, {
        data: fixture,
        circlesSettings: circlesSettings as never,
        mapMarkers: [],
        upcomingEvents: [],
        initiatives: [],
        resources: [],
        locale: 'en',
      }),
    )
    expect(html).toContain(
      'Logos is a movement of builders, activists, and community organisers rebuilding civil society.',
    )
  })

  it('renders campaign title from data prop', () => {
    const html = renderToStaticMarkup(
      createElement(MovementPageView, {
        data: fixture,
        circlesSettings: circlesSettings as never,
        mapMarkers: [],
        upcomingEvents: [],
        initiatives: [],
        resources: [],
        locale: 'en',
      }),
    )
    expect(html).toContain('Join an Activist Circle')
  })

  it('renders builder title from data prop', () => {
    const html = renderToStaticMarkup(
      createElement(MovementPageView, {
        data: fixture,
        circlesSettings: circlesSettings as never,
        mapMarkers: [],
        upcomingEvents: [],
        initiatives: [],
        resources: [],
        locale: 'en',
      }),
    )
    expect(html).toContain('Become an Activist Builder')
  })

  it('renders activismSection title from data prop', () => {
    const html = renderToStaticMarkup(
      createElement(MovementPageView, {
        data: fixture,
        circlesSettings: circlesSettings as never,
        mapMarkers: [],
        upcomingEvents: [],
        initiatives: [],
        resources: [],
        locale: 'en',
      }),
    )
    expect(html).toContain('Activism in Action')
  })

  it('renders find.title from data prop', () => {
    const html = renderToStaticMarkup(
      createElement(MovementPageView, {
        data: fixture,
        circlesSettings: circlesSettings as never,
        mapMarkers: [],
        upcomingEvents: [],
        initiatives: [],
        resources: [],
        locale: 'en',
      }),
    )
    expect(html).toContain('Find a Circle near you.')
  })
})
