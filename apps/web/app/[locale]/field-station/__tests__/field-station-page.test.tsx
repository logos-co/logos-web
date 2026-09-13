import { createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, test, vi } from 'vitest'

import { ROUTES } from '@/constants/routes'

vi.mock('@/i18n/navigation', () => ({
  // Forwards every prop, as the real Link does, so data attributes survive.
  Link: ({
    children,
    ...props
  }: {
    children: ReactNode
    href: string
  } & Record<string, unknown>) => createElement('a', props, children),
}))

import {
  APPLICATION_STEP_4,
  APPLY_BANNER_CTA,
  EVENT_DETAILS,
  HERO,
  OG_IMAGE,
  SECTION_IDS,
  SEO,
} from '../_content'
import FieldStationPage, { generateMetadata } from '../page'

const params = Promise.resolve({ locale: 'en' })

const pageHtml = async () =>
  renderToStaticMarkup(await FieldStationPage({ params }))

/** Every opening `<a …>` tag in the markup. */
const anchorTags = (html: string): string[] => html.match(/<a\s[^>]*>/g) ?? []

const attr = (tag: string, name: string): string | undefined =>
  tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1]

describe('field station page', () => {
  test('is registered on the canonical route', () => {
    expect(ROUTES.fieldStation).toBe('/field-station')
  })

  test('ships the campaign title, description and OG image', async () => {
    const metadata = await generateMetadata({ params })

    expect(metadata.title).toBe(SEO.title)
    expect(metadata.description).toBe(SEO.description)
    expect(metadata.openGraph?.images).toEqual([
      expect.objectContaining({
        url: expect.stringMatching(new RegExp(`${OG_IMAGE.src}$`)),
        width: OG_IMAGE.width,
        height: OG_IMAGE.height,
      }),
    ])
    expect(metadata.twitter?.images).toEqual([
      expect.stringMatching(new RegExp(`${OG_IMAGE.src}$`)),
    ])
  })

  test('describes the residency as a schema.org Event', async () => {
    const html = await pageHtml()
    const scripts = [
      ...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g),
    ].map((match) => JSON.parse(match[1]))

    const event = scripts.find((data) => data['@type'] === 'Event')
    expect(event).toMatchObject({
      name: EVENT_DETAILS.name,
      startDate: EVENT_DETAILS.startDate,
      endDate: EVENT_DETAILS.endDate,
    })
    expect(scripts.some((data) => data['@type'] === 'BreadcrumbList')).toBe(
      true
    )
  })

  test('every hero link lands on a section rendered on the page', async () => {
    const html = await pageHtml()

    for (const link of HERO.links) {
      const id = link.href.slice(1)
      expect(Object.values(SECTION_IDS)).toContain(id)
      expect(html).toContain(`id="${id}"`)
    }
  })

  test('the apply banner is just its title and an Apply Now button', async () => {
    const html = await pageHtml()
    const banner =
      html.match(/<section id="logos-app".*?<\/section>/s)?.[0] ?? ''
    const links = anchorTags(banner)

    expect(links).toHaveLength(1)
    expect(attr(links[0], 'href')).toBe(APPLY_BANNER_CTA.href)
    expect(banner).toContain(APPLY_BANNER_CTA.label)
    expect(banner).not.toContain('Install')
  })

  test('step 04 links the install guide and holds the video link until it lands', async () => {
    const html = await pageHtml()
    const [guide, video] = APPLICATION_STEP_4.link

    expect(
      anchorTags(html).some(
        (tag) =>
          attr(tag, 'href') === guide.href &&
          attr(tag, 'data-umami-event-name') === guide.eventName
      )
    ).toBe(true)
    if (!video.href) {
      expect(html).toContain('(see here for a video tutorial)')
    }
  })

  test('external links open in a new tab', async () => {
    const external = anchorTags(await pageHtml()).filter((tag) =>
      /^https?:\/\//.test(attr(tag, 'href') ?? '')
    )

    expect(external.length).toBeGreaterThan(0)
    for (const tag of external) {
      expect(attr(tag, 'target')).toBe('_blank')
      expect(attr(tag, 'rel')).toContain('noopener')
    }
  })

  test('every CTA and toggle carries its own Umami event name', async () => {
    const html = await pageHtml()
    const clickable = [
      ...anchorTags(html),
      ...(html.match(/<button\s[^>]*>/g) ?? []),
    ]
    const names = clickable.map((tag) => attr(tag, 'data-umami-event-name'))

    expect(names.every(Boolean)).toBe(true)
    expect(new Set(names).size).toBe(names.length)
  })
})
