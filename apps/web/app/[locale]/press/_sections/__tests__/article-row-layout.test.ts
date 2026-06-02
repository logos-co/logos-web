import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

const sectionDir = path.resolve(process.cwd(), 'app/[locale]/press/_sections')
const pressRouteDir = path.resolve(process.cwd(), 'app/[locale]/press')

const readSectionFile = (fileName: string) =>
  fs.readFileSync(path.join(sectionDir, fileName), 'utf8')
const readPressRouteFile = (fileName: string) =>
  fs.readFileSync(path.join(pressRouteDir, fileName), 'utf8')

describe('press article row layout', () => {
  test('keeps list rows aligned to the Figma article-entry metrics', () => {
    const articlesSource = readSectionFile('articles.tsx')
    const atomsSource = readSectionFile('press-atoms.tsx')
    const podcastsSource = readSectionFile('podcasts.tsx')

    expect(articlesSource).toContain('className="h-[107px]"')
    expect(articlesSource).toContain('className="h-[77px] w-[107px]')
    expect(podcastsSource).toContain('className="aspect-video h-auto w-[174px]')
    expect(atomsSource).toContain('width={107}')
    expect(atomsSource).toContain('height={77}')
    expect(articlesSource).not.toContain('size-[107px]')
    expect(podcastsSource).not.toContain('size-[107px]')
    expect(atomsSource).not.toContain("'absolute h-[77px]")
    expect(atomsSource).not.toContain('absolute aspect-video overflow-hidden')
    expect(articlesSource).toContain('md:grid-cols-[107px_607px_543px]')
    expect(podcastsSource).toContain('md:grid-cols-[190px_524px_573px]')
    expect(articlesSource).toContain('md:gap-33')
    expect(podcastsSource).toContain('md:gap-33')
  })

  test('renders the broadcast network panel as the Figma-linked route card', () => {
    const articlesSource = readSectionFile('articles.tsx')

    expect(articlesSource).toContain('BROADCAST_BACKGROUND_IMAGE')
    expect(articlesSource).toContain('href={href}')
    expect(articlesSource).toContain('rounded-[100px]')
    expect(articlesSource).toContain(
      'className="bg-accent-tan pt-3 text-brand-dark-green desktop:pt-25"'
    )
    expect(articlesSource).toContain('desktop:h-[406px]')
    expect(articlesSource).toContain('desktop:w-[702px]')
    expect(articlesSource).not.toContain('md:h-[406px]')
    expect(articlesSource).not.toContain('md:w-[702px]')
    expect(articlesSource).toContain('copy.latestEpisode')
    expect(articlesSource).not.toContain(
      'key={`${article.title}-broadcast-${index}`}'
    )
  })

  test('keeps section CTAs inside the page content width with the requested offset', () => {
    const atomsSource = readSectionFile('press-atoms.tsx')

    expect(atomsSource).toContain('mx-auto mt-3 flex h-24 max-w-[1440px]')
  })

  test('links the podcast hero card to the latest episode', () => {
    const podcastsSource = readSectionFile('podcasts.tsx')

    expect(podcastsSource).toContain('href={latestPodcast.href}')
    expect(podcastsSource).toContain('className="group block cursor-pointer"')
    expect(podcastsSource).toContain(
      'desktop:h-[380px] desktop:w-[453px] desktop:max-w-[453px]'
    )
    expect(podcastsSource).toContain(
      'top-[397px] flex h-[290px] w-[calc(100%-24px)]'
    )
    expect(podcastsSource).toContain(
      'desktop:right-3 desktop:top-3 desktop:block'
    )
    expect(podcastsSource).toContain('desktop:hidden')
    expect(podcastsSource).not.toContain('md:left-[356px]')
    expect(podcastsSource).toContain('const latestPodcast = podcasts[0]')
    expect(podcastsSource).toContain('const listPodcasts = podcasts.slice(1)')
    expect(podcastsSource).toContain('repeatToLength(listPodcasts, 8)')
    expect(podcastsSource).not.toContain('repeatToLength(podcasts, 8)')
    expect(podcastsSource).not.toContain('h-[2249px]')
  })

  test('scrolls the broadcast nav item to the in-page broadcast section', () => {
    const pageSource = readPressRouteFile('page.tsx')
    const articlesSource = readSectionFile('articles.tsx')

    expect(pageSource).toContain("navBroadcastHref: '#broadcast'")
    expect(articlesSource).toContain('id="broadcast"')
    expect(articlesSource).toContain('href={copy.navBroadcastHref}')
  })

  test('keeps featured cards in mobile layout until the desktop breakpoint', () => {
    const articlesSource = readSectionFile('articles.tsx')
    const podcastsSource = readSectionFile('podcasts.tsx')

    expect(articlesSource).toContain(
      'desktop:flex desktop:h-[1044px]'
    )
    expect(articlesSource).toContain('desktop:sticky desktop:top-10')
    expect(articlesSource).not.toContain('md:flex md:h-[1044px]')
    expect(articlesSource).not.toContain('md:sticky md:top-10')
    expect(podcastsSource).toContain('desktop:h-[430px]')
    expect(podcastsSource).toContain('desktop:h-[406px]')
    expect(podcastsSource).not.toContain('md:h-[430px]')
    expect(podcastsSource).not.toContain('md:h-[406px]')
  })
})
