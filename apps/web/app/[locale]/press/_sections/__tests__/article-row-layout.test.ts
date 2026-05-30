import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

const sectionDir = path.resolve(
  process.cwd(),
  'app/[locale]/press/_sections'
)
const pressRouteDir = path.resolve(process.cwd(), 'app/[locale]/press')

const readSectionFile = (fileName: string) =>
  fs.readFileSync(path.join(sectionDir, fileName), 'utf8')
const readPressRouteFile = (fileName: string) =>
  fs.readFileSync(path.join(pressRouteDir, fileName), 'utf8')

describe('press article row layout', () => {
  test('keeps list rows aligned to the Figma article-entry metrics', () => {
    const articlesSource = readSectionFile('articles.tsx')
    const atomsSource = readSectionFile('press-atoms.tsx')

    expect(articlesSource).toContain('className="h-[107px]"')
    expect(atomsSource).toContain('width={107}')
    expect(atomsSource).toContain('height={77}')
    expect(atomsSource).not.toContain('absolute aspect-video overflow-hidden')
    expect(articlesSource).toContain('md:grid-cols-[595px_543px]')
    expect(articlesSource).toContain('md:gap-[132px]')
  })

  test('renders the broadcast network panel as the Figma-linked route card', () => {
    const articlesSource = readSectionFile('articles.tsx')

    expect(articlesSource).toContain('BROADCAST_BACKGROUND_IMAGE')
    expect(articlesSource).toContain('href={href}')
    expect(articlesSource).toContain('rounded-[100px]')
    expect(articlesSource).toContain('copy.latestEpisode')
    expect(articlesSource).not.toContain(
      'key={`${article.title}-broadcast-${index}`}'
    )
  })

  test('keeps section CTAs inside the page content width with the requested offset', () => {
    const atomsSource = readSectionFile('press-atoms.tsx')

    expect(atomsSource).toContain('mx-auto mt-3 flex h-24 max-w-[1440px]')
  })

  test('scrolls the broadcast nav item to the in-page broadcast section', () => {
    const pageSource = readPressRouteFile('page.tsx')
    const articlesSource = readSectionFile('articles.tsx')

    expect(pageSource).toContain("navBroadcastHref: '#broadcast'")
    expect(articlesSource).toContain('id="broadcast"')
    expect(articlesSource).toContain('href={copy.navBroadcastHref}')
  })
})
