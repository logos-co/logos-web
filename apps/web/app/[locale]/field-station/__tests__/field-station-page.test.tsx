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
  BASECAMP_RELEASE_HREF,
  BASECAMP_RELEASE_PAGE,
  APPLY_BANNER_CTA,
  APPLY_HREF,
  COALITION,
  TRACKS,
  EVENT_DETAILS,
  EVENT_NAMES,
  HERO,
  LEGAL_LINKS,
  OG_IMAGE,
  SECTION_IDS,
  SEO,
  type TrackBlock,
} from '../_content'
import { resolveFieldStationDownloadTarget } from '../_sections/basecamp-install-button'
import FieldStationPage, { generateMetadata } from '../page'

const params = Promise.resolve({ locale: 'en' })

const pageHtml = async () =>
  renderToStaticMarkup(await FieldStationPage({ params }))

/** Every opening `<a …>` tag in the markup. */
const anchorTags = (html: string): string[] => html.match(/<a\s[^>]*>/g) ?? []

const attr = (tag: string, name: string): string | undefined =>
  tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1]

describe('field station page', () => {
  test('installs Basecamp 0.3.0 from Field Station and links its FAQ to the release', async () => {
    const html = await pageHtml()
    const install = anchorTags(html).find(
      (tag) =>
        attr(tag, 'data-umami-event-name') === EVENT_NAMES.applicationInstall
    )

    expect(install).toBeDefined()
    expect(attr(install!, 'href')).toBe(BASECAMP_RELEASE_HREF)
    expect(
      anchorTags(html).some(
        (tag) =>
          attr(tag, 'data-umami-event-name') ===
            'FAQ link - Latest release' &&
          attr(tag, 'href') === BASECAMP_RELEASE_PAGE
      )
    ).toBe(true)
    expect(
      resolveFieldStationDownloadTarget({
        platform: 'Linux',
        architecture: 'x86',
        bitness: '64',
      })
    ).toContain('/download/0.3.0/LogosBasecamp-Desktop-v0.3.0-')
    expect(
      resolveFieldStationDownloadTarget({
        platform: 'macOS',
        architecture: 'arm',
      })
    ).toMatch(/-aarch64\.dmg$/)
    expect(
      resolveFieldStationDownloadTarget({
        platform: 'Windows',
        architecture: 'x86_64',
      })
    ).toMatch(/-windows-setup\.exe$/)
    expect(resolveFieldStationDownloadTarget({ platform: 'Windows' })).toBe(
      BASECAMP_RELEASE_HREF
    )
  })

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

  test('step 04 carries the final copy and links the installation guide', async () => {
    const html = await pageHtml()
    const [guide] = APPLICATION_STEP_4.link

    expect(html).toContain(
      ') Add the blockchain module inside basecamp, and make a note of the block height.'
    )
    expect(
      anchorTags(html).some(
        (tag) =>
          attr(tag, 'href') === guide.href &&
          attr(tag, 'data-umami-event-name') === guide.eventName
      )
    ).toBe(true)
  })

  test('every Apply button and the note open the application form', async () => {
    const html = await pageHtml()
    const formLinks = anchorTags(html).filter(
      (tag) => attr(tag, 'href') === APPLY_BANNER_CTA.href
    )

    expect(APPLY_BANNER_CTA.href).toMatch(/^https:\/\/cryptpad\.fr\/form\//)
    expect(formLinks.map((tag) => attr(tag, 'data-umami-event-name'))).toEqual(
      expect.arrayContaining([
        'Apply now - Hero',
        'Application form - Application process',
        'Apply now - Application process',
        'Apply now - Apply banner',
      ])
    )
    expect(APPLY_HREF).toBe(APPLY_BANNER_CTA.href)
  })

  test('each track ends with its brief link', () => {
    const lastLinks = TRACKS.items.map(
      (item) => (item.details.at(-1) as TrackBlock | undefined)?.link?.href
    )

    expect(lastLinks).toEqual([
      'https://docs.logos.co/',
      'https://docs.logos.co/',
      expect.stringMatching(/^https:\/\/cryptpad\.fr\/doc\//),
      expect.stringMatching(/^https:\/\/cryptpad\.fr\/doc\//),
    ])
  })

  test('accordion toggles point at panel ids without whitespace', async () => {
    const buttons = (await pageHtml()).match(/<button\s[^>]*>/g) ?? []
    const controls = buttons
      .map((tag) => attr(tag, 'aria-controls'))
      .filter(Boolean)

    expect(controls.length).toBeGreaterThan(0)
    for (const id of controls) {
      expect(id).not.toMatch(/\s/)
    }
  })

  test('the coalition block lists every partner logo under its heading', async () => {
    const html = await pageHtml()
    const block = html.slice(html.indexOf(COALITION.heading))

    expect(block.length).toBeGreaterThan(COALITION.heading.length)
    for (const logo of COALITION.logos) {
      expect(block).toContain(`alt="${logo.name}"`)
      const link = anchorTags(block).find(
        (tag) => attr(tag, 'href') === logo.href
      )
      expect(link && attr(link, 'target')).toBe('_blank')
    }
  })

  test('lists the coalition partners in alphabetical order', () => {
    const names = COALITION.logos.map((logo) => logo.name)

    expect(names).toContain('Dhun')
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)))
  })

  test('the about copy offers the scholarship and links the application form', async () => {
    const html = await pageHtml()
    const about =
      html.match(
        new RegExp(`<section id="${SECTION_IDS.about}".*?</section>`, 's')
      )?.[0] ?? ''
    const formLink = anchorTags(about).find(
      (tag) => attr(tag, 'href') === APPLY_HREF
    )

    expect(about).toContain('30 selected residents receive a full scholarship')
    expect(attr(formLink ?? '', 'data-umami-event-name')).toBe(
      EVENT_NAMES.aboutApplication
    )
    expect(attr(formLink ?? '', 'target')).toBe('_blank')
  })

  test('the legal documents are linked below the coalition logos', async () => {
    const html = await pageHtml()
    const block = html.slice(html.indexOf(COALITION.heading))
    const lastLogo = block.lastIndexOf(`alt="${COALITION.logos.at(-1)?.name}"`)

    expect(LEGAL_LINKS.map((link) => link.href)).toEqual([
      ROUTES.fieldStationTerms,
      ROUTES.fieldStationPrivacy,
    ])
    for (const link of LEGAL_LINKS) {
      const tag = anchorTags(block).find(
        (candidate) => attr(candidate, 'href') === link.href
      )
      expect(tag).toBeDefined()
      expect(block.indexOf(tag ?? '')).toBeGreaterThan(lastLogo)
      expect(attr(tag ?? '', 'target')).toBeUndefined()
      expect(block).toContain(`>${link.label}</a>`)
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
