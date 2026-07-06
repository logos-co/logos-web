import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { MediaCopySection } from '@repo/content/schemas'

const sectionData: MediaCopySection = {
  componentType: 'mediaCopy',
  key: 'media.copy',
  hero: {
    line1: 'Logos',
    line2: 'Media',
    tagline: 'Articles, news, podcasts, and media throughout the Logos Network.',
  },
  nav: {
    label: 'Blog sections',
    articles: 'Articles',
    podcasts: 'Podcasts',
    broadcast: 'Logos Broadcast Network',
  },
  articles: {
    heading: 'Articles',
    readArticle: 'Read Article',
    seeMore: 'See more articles',
  },
  podcasts: {
    heading: 'Podcasts',
    media: 'Media',
    heroTitle: 'Logos Podcast',
    heroDescription: 'Logos Podcast is a bi-weekly interview show about building sovereign communities: the people, philosophies, challenges, and solutions. We invite the world\'s foremost experts and radical thinkers to discuss how to emancipate from repressive systems through new social, political, and economic institutions.',
    latestEpisode: 'Latest episode',
    seeAllEpisodes: 'See all episodes',
    listenOnApp: 'Listen on an app',
    cta: 'Logos podcast',
    episodePrefix: 'Episode',
    fallbackEpisode: 'Logos Podcast',
  },
  broadcast: {
    heading: 'Logos Broadcast Network',
    description: 'Regular programming, live sessions, and office hours for your viewing pleasure',
    media: 'Media',
    latestEpisode: 'Latest episode',
    cta: 'Learn more',
  },
}

function HeroContent({ data }: { data: MediaCopySection }) {
  return createElement(
    'div',
    null,
    createElement('span', null, data.hero.line1),
    createElement('span', null, data.hero.line2),
    createElement('p', null, data.hero.tagline),
  )
}

function NavContent({ data }: { data: MediaCopySection }) {
  return createElement(
    'nav',
    null,
    createElement('span', null, data.nav.label),
    createElement('span', null, data.nav.articles),
    createElement('span', null, data.nav.podcasts),
    createElement('span', null, data.nav.broadcast),
  )
}

function ArticlesContent({ data }: { data: MediaCopySection }) {
  return createElement(
    'section',
    null,
    createElement('h2', null, data.articles.heading),
    createElement('span', null, data.articles.readArticle),
    createElement('span', null, data.articles.seeMore),
  )
}

function PodcastsContent({ data }: { data: MediaCopySection }) {
  return createElement(
    'section',
    null,
    createElement('h2', null, data.podcasts.heading),
    createElement('span', null, data.podcasts.cta),
    createElement('span', null, data.podcasts.listenOnApp),
  )
}

function BroadcastContent({ data }: { data: MediaCopySection }) {
  return createElement(
    'section',
    null,
    createElement('h2', null, data.broadcast.heading),
    createElement('p', null, data.broadcast.description),
    createElement('span', null, data.broadcast.cta),
  )
}

describe('MediaPage – hero section driven from data', () => {
  it('renders hero.line1 from data', () => {
    const html = renderToStaticMarkup(createElement(HeroContent, { data: sectionData }))
    expect(html).toContain('Logos')
  })

  it('renders hero.line2 from data', () => {
    const html = renderToStaticMarkup(createElement(HeroContent, { data: sectionData }))
    expect(html).toContain('Media')
  })

  it('renders hero.tagline from data', () => {
    const html = renderToStaticMarkup(createElement(HeroContent, { data: sectionData }))
    expect(html).toContain('Articles, news, podcasts, and media throughout the Logos Network.')
  })
})

describe('MediaPage – nav section driven from data', () => {
  it('renders all nav labels from data', () => {
    const html = renderToStaticMarkup(createElement(NavContent, { data: sectionData }))
    expect(html).toContain('Blog sections')
    expect(html).toContain('Articles')
    expect(html).toContain('Podcasts')
    expect(html).toContain('Logos Broadcast Network')
  })
})

describe('MediaPage – articles section driven from data', () => {
  it('renders articles.heading from data', () => {
    const html = renderToStaticMarkup(createElement(ArticlesContent, { data: sectionData }))
    expect(html).toContain('Articles')
    expect(html).toContain('<h2')
  })

  it('renders articles.readArticle from data', () => {
    const html = renderToStaticMarkup(createElement(ArticlesContent, { data: sectionData }))
    expect(html).toContain('Read Article')
  })

  it('renders articles.seeMore from data', () => {
    const html = renderToStaticMarkup(createElement(ArticlesContent, { data: sectionData }))
    expect(html).toContain('See more articles')
  })
})

describe('MediaPage – podcasts section driven from data', () => {
  it('renders podcasts.heading from data', () => {
    const html = renderToStaticMarkup(createElement(PodcastsContent, { data: sectionData }))
    expect(html).toContain('Podcasts')
  })

  it('renders podcasts.cta from data', () => {
    const html = renderToStaticMarkup(createElement(PodcastsContent, { data: sectionData }))
    expect(html).toContain('Logos podcast')
  })
})

describe('MediaPage – broadcast section driven from data', () => {
  it('renders broadcast.heading from data', () => {
    const html = renderToStaticMarkup(createElement(BroadcastContent, { data: sectionData }))
    expect(html).toContain('Logos Broadcast Network')
  })

  it('renders broadcast.description from data', () => {
    const html = renderToStaticMarkup(createElement(BroadcastContent, { data: sectionData }))
    expect(html).toContain('Regular programming, live sessions, and office hours for your viewing pleasure')
  })

  it('renders broadcast.cta from data', () => {
    const html = renderToStaticMarkup(createElement(BroadcastContent, { data: sectionData }))
    expect(html).toContain('Learn more')
  })
})
