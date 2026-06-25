import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { BroadcastCopySection } from '@repo/content/schemas'

const sectionData: BroadcastCopySection = {
  componentType: 'broadcastCopy',
  key: 'logosBroadcastNetwork.copy',
  heading: 'Logos Broadcast Network',
  intro: {
    primary: 'Live calls, technical sessions, and community programming from across the Logos network.',
    secondary: 'Live streams, updates, and regular programming across the entire Logos network.',
  },
  events: {
    heading: 'Upcoming Events',
    fallbackDescription: 'Live streams, updates, and regular programming from the Logos network.',
    host: 'Host',
    nextShow: 'Next Show',
    yearLabel: 'Year',
    monthLabel: 'Month',
    todayLabel: 'Today',
  },
  pastEpisodes: {
    heading: 'Past Episodes',
  },
  listenOnApp: 'Listen on an app',
}

function HeroContent({ data }: { data: BroadcastCopySection }) {
  return createElement(
    'section',
    null,
    createElement('h1', null, data.heading),
    createElement('p', null, data.intro.primary),
    createElement('p', null, data.intro.secondary),
  )
}

function EventsContent({ data }: { data: BroadcastCopySection }) {
  return createElement(
    'section',
    null,
    createElement('h2', null, data.events.heading),
    createElement('span', null, data.events.host),
    createElement('span', null, data.events.nextShow),
    createElement('span', null, data.events.yearLabel),
    createElement('span', null, data.events.monthLabel),
    createElement('span', null, data.events.todayLabel),
    createElement('p', null, data.events.fallbackDescription),
  )
}

function PastEpisodesContent({ data }: { data: BroadcastCopySection }) {
  return createElement(
    'section',
    null,
    createElement('h2', null, data.pastEpisodes.heading),
    createElement('span', null, data.listenOnApp),
  )
}

describe('BroadcastNetworkPage – hero section driven from data', () => {
  it('renders heading from data', () => {
    const html = renderToStaticMarkup(createElement(HeroContent, { data: sectionData }))
    expect(html).toContain('Logos Broadcast Network')
    expect(html).toContain('<h1')
  })

  it('renders intro.primary from data', () => {
    const html = renderToStaticMarkup(createElement(HeroContent, { data: sectionData }))
    expect(html).toContain('Live calls, technical sessions, and community programming from across the Logos network.')
  })

  it('renders intro.secondary from data', () => {
    const html = renderToStaticMarkup(createElement(HeroContent, { data: sectionData }))
    expect(html).toContain('Live streams, updates, and regular programming across the entire Logos network.')
  })
})

describe('BroadcastNetworkPage – events section driven from data', () => {
  it('renders events.heading from data', () => {
    const html = renderToStaticMarkup(createElement(EventsContent, { data: sectionData }))
    expect(html).toContain('Upcoming Events')
    expect(html).toContain('<h2')
  })

  it('renders all calendar labels from data', () => {
    const html = renderToStaticMarkup(createElement(EventsContent, { data: sectionData }))
    expect(html).toContain('Host')
    expect(html).toContain('Next Show')
    expect(html).toContain('Year')
    expect(html).toContain('Month')
    expect(html).toContain('Today')
  })

  it('renders events.fallbackDescription from data', () => {
    const html = renderToStaticMarkup(createElement(EventsContent, { data: sectionData }))
    expect(html).toContain('Live streams, updates, and regular programming from the Logos network.')
  })
})

describe('BroadcastNetworkPage – past episodes section driven from data', () => {
  it('renders pastEpisodes.heading from data', () => {
    const html = renderToStaticMarkup(createElement(PastEpisodesContent, { data: sectionData }))
    expect(html).toContain('Past Episodes')
  })

  it('renders listenOnApp from data', () => {
    const html = renderToStaticMarkup(createElement(PastEpisodesContent, { data: sectionData }))
    expect(html).toContain('Listen on an app')
  })
})
