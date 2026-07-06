import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  broadcastCopySectionSchema,
  mediaCopySectionSchema,
  pageSectionSchema,
  podcastCopySectionSchema,
} from '../pages'

const MINIMAL_MEDIA_SECTION = {
  componentType: 'mediaCopy' as const,
  key: 'media.copy',
  hero: { line1: 'Logos', line2: 'Media', tagline: 'Articles, news, podcasts.' },
  nav: { label: 'Blog sections', articles: 'Articles', podcasts: 'Podcasts', broadcast: 'Logos Broadcast Network' },
  articles: { heading: 'Articles', readArticle: 'Read Article', seeMore: 'See more articles' },
  podcasts: {
    heading: 'Podcasts',
    media: 'Media',
    heroTitle: 'Logos Podcast',
    heroDescription: 'A bi-weekly interview show.',
    latestEpisode: 'Latest episode',
    seeAllEpisodes: 'See all episodes',
    listenOnApp: 'Listen on an app',
    cta: 'Logos podcast',
    episodePrefix: 'Episode',
    fallbackEpisode: 'Logos Podcast',
  },
  broadcast: {
    heading: 'Logos Broadcast Network',
    description: 'Regular programming.',
    media: 'Media',
    latestEpisode: 'Latest episode',
    cta: 'Learn more',
  },
}

const MINIMAL_PODCAST_SECTION = {
  componentType: 'podcastCopy' as const,
  key: 'podcast.copy',
  heading: 'Logos Podcast',
  eyebrow: 'Media',
  backToMedia: 'Logos Media',
  intro: {
    description: 'A biweekly interview show.',
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

const MINIMAL_BROADCAST_SECTION = {
  componentType: 'broadcastCopy' as const,
  key: 'logosBroadcastNetwork.copy',
  heading: 'Logos Broadcast Network',
  intro: {
    primary: 'Live calls, technical sessions.',
    secondary: 'Live streams, updates.',
  },
  events: {
    heading: 'Upcoming Events',
    fallbackDescription: 'Live streams from the Logos network.',
    host: 'Host',
    nextShow: 'Next Show',
    yearLabel: 'Year',
    monthLabel: 'Month',
    todayLabel: 'Today',
  },
  pastEpisodes: { heading: 'Past Episodes' },
  listenOnApp: 'Listen on an app',
}

describe('blog family section schemas', () => {
  describe('mediaCopySectionSchema', () => {
    it('parses a valid mediaCopy section', () => {
      const result = mediaCopySectionSchema.parse(MINIMAL_MEDIA_SECTION)
      assert.equal(result.componentType, 'mediaCopy')
      assert.equal(result.hero.line1, 'Logos')
      assert.equal(result.hero.line2, 'Media')
      assert.equal(result.nav.articles, 'Articles')
      assert.equal(result.articles.readArticle, 'Read Article')
      assert.equal(result.podcasts.cta, 'Logos podcast')
      assert.equal(result.broadcast.cta, 'Learn more')
    })

    it('is accepted by the pageSectionSchema discriminated union', () => {
      const result = pageSectionSchema.parse(MINIMAL_MEDIA_SECTION)
      assert.equal(result.componentType, 'mediaCopy')
    })

    it('rejects when a required string is empty', () => {
      assert.throws(() =>
        mediaCopySectionSchema.parse({
          ...MINIMAL_MEDIA_SECTION,
          hero: { ...MINIMAL_MEDIA_SECTION.hero, line1: '' },
        })
      )
    })
  })

  describe('podcastCopySectionSchema', () => {
    it('parses a valid podcastCopy section', () => {
      const result = podcastCopySectionSchema.parse(MINIMAL_PODCAST_SECTION)
      assert.equal(result.componentType, 'podcastCopy')
      assert.equal(result.heading, 'Logos Podcast')
      assert.equal(result.eyebrow, 'Media')
      assert.equal(result.backToMedia, 'Logos Media')
      assert.equal(result.intro.hostedBy, 'Hosted by Jarrad Hope.')
      assert.equal(result.latestHeading, 'Latest Episodes')
      assert.equal(result.podcastCta, 'Logos podcast')
    })

    it('is accepted by the pageSectionSchema discriminated union', () => {
      const result = pageSectionSchema.parse(MINIMAL_PODCAST_SECTION)
      assert.equal(result.componentType, 'podcastCopy')
    })

    it('rejects when podcastCta is missing', () => {
      const { podcastCta: _removed, ...withoutCta } = MINIMAL_PODCAST_SECTION
      assert.throws(() => podcastCopySectionSchema.parse(withoutCta))
    })
  })

  describe('broadcastCopySectionSchema', () => {
    it('parses a valid broadcastCopy section', () => {
      const result = broadcastCopySectionSchema.parse(MINIMAL_BROADCAST_SECTION)
      assert.equal(result.componentType, 'broadcastCopy')
      assert.equal(result.heading, 'Logos Broadcast Network')
      assert.equal(result.intro.primary, 'Live calls, technical sessions.')
      assert.equal(result.events.heading, 'Upcoming Events')
      assert.equal(result.events.todayLabel, 'Today')
      assert.equal(result.pastEpisodes.heading, 'Past Episodes')
      assert.equal(result.listenOnApp, 'Listen on an app')
    })

    it('is accepted by the pageSectionSchema discriminated union', () => {
      const result = pageSectionSchema.parse(MINIMAL_BROADCAST_SECTION)
      assert.equal(result.componentType, 'broadcastCopy')
    })

    it('rejects when a required string is empty', () => {
      assert.throws(() =>
        broadcastCopySectionSchema.parse({
          ...MINIMAL_BROADCAST_SECTION,
          listenOnApp: '',
        })
      )
    })
  })
})
