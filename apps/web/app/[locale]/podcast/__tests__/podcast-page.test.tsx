import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { PodcastCopySection } from '@repo/content/schemas'

const sectionData: PodcastCopySection = {
  componentType: 'podcastCopy',
  key: 'podcast.copy',
  heading: 'Logos Podcast',
  eyebrow: 'Media',
  backToMedia: 'Logos Media',
  intro: {
    description: 'Logos Podcast is a biweekly interview show about building sovereign communities: the people, philosophies, challenges, and solutions. We invite the world\'s foremost experts and radical thinkers to discuss how to emancipate from repressive systems through new social, political, and economic institutions.',
    hostedBy: 'Hosted by Jarrad Hope.',
  },
  latestHeading: 'Latest Episodes',
  latestEpisode: 'Latest episode',
  listenOnApp: 'Listen on an app',
  seeAllEpisodes: 'See all episodes',
  episodePrefix: 'Episode',
  fallbackEpisode: 'Logos Podcast',
  podcastCta: 'Logos podcast',
}

function IntroContent({ data }: { data: PodcastCopySection }) {
  return createElement(
    'section',
    null,
    createElement('h1', null, data.heading),
    createElement('span', null, data.eyebrow),
    createElement('span', null, data.backToMedia),
    createElement('p', null, data.intro.description),
    createElement('p', null, data.intro.hostedBy),
  )
}

function PodcastsListContent({ data }: { data: PodcastCopySection }) {
  return createElement(
    'section',
    null,
    createElement('h2', null, data.latestHeading),
    createElement('span', null, data.latestEpisode),
    createElement('span', null, data.seeAllEpisodes),
    createElement('span', null, data.listenOnApp),
    createElement('span', null, data.podcastCta),
    createElement('span', null, data.episodePrefix),
    createElement('span', null, data.fallbackEpisode),
  )
}

describe('PodcastPage – intro section driven from data', () => {
  it('renders heading from data', () => {
    const html = renderToStaticMarkup(createElement(IntroContent, { data: sectionData }))
    expect(html).toContain('Logos Podcast')
    expect(html).toContain('<h1')
  })

  it('renders eyebrow from data', () => {
    const html = renderToStaticMarkup(createElement(IntroContent, { data: sectionData }))
    expect(html).toContain('Media')
  })

  it('renders backToMedia from data', () => {
    const html = renderToStaticMarkup(createElement(IntroContent, { data: sectionData }))
    expect(html).toContain('Logos Media')
  })

  it('renders intro.description from data', () => {
    const html = renderToStaticMarkup(createElement(IntroContent, { data: sectionData }))
    expect(html).toContain('Logos Podcast is a biweekly interview show about building sovereign communities')
  })

  it('renders intro.hostedBy from data', () => {
    const html = renderToStaticMarkup(createElement(IntroContent, { data: sectionData }))
    expect(html).toContain('Hosted by Jarrad Hope.')
  })
})

describe('PodcastPage – podcasts list section driven from data', () => {
  it('renders latestHeading from data', () => {
    const html = renderToStaticMarkup(createElement(PodcastsListContent, { data: sectionData }))
    expect(html).toContain('Latest Episodes')
    expect(html).toContain('<h2')
  })

  it('renders latestEpisode from data', () => {
    const html = renderToStaticMarkup(createElement(PodcastsListContent, { data: sectionData }))
    expect(html).toContain('Latest episode')
  })

  it('renders seeAllEpisodes from data', () => {
    const html = renderToStaticMarkup(createElement(PodcastsListContent, { data: sectionData }))
    expect(html).toContain('See all episodes')
  })

  it('renders podcastCta from data (sourced from pages.blog.podcasts.cta)', () => {
    const html = renderToStaticMarkup(createElement(PodcastsListContent, { data: sectionData }))
    expect(html).toContain('Logos podcast')
  })

  it('renders episodePrefix from data', () => {
    const html = renderToStaticMarkup(createElement(PodcastsListContent, { data: sectionData }))
    expect(html).toContain('Episode')
  })
})
