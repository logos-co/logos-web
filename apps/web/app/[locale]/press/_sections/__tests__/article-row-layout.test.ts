import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

const sectionDir = path.resolve(
  process.cwd(),
  'app/[locale]/press/_sections'
)

const readSectionFile = (fileName: string) =>
  fs.readFileSync(path.join(sectionDir, fileName), 'utf8')

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
})
