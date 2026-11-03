import { describe, expect, it } from 'vitest'
import { wakuArticleHeroVisibility } from '../waku-article-presentation'

const article = {
  slug: 'railgun-waku-case-study',
  summary: 'Original introduction.',
  coverImage: { url: 'https://cms-press.logos.co/uploads/cover.png' },
  bodyHtml:
    '<p>Original introduction.</p><figure><img src="https://cms-press.logos.co/uploads/cover.png" alt="Original alt" /><figcaption>Original caption</figcaption></figure>',
}

describe('Waku article presentation', () => {
  it('shows the source image, caption and introduction only in the body', () => {
    expect(wakuArticleHeroVisibility(article)).toEqual({
      showCover: false,
      showSummary: false,
    })
    expect(article.bodyHtml).toContain('Original caption')
  })
  it('recognises summaries containing inline formatting', () => {
    expect(
      wakuArticleHeroVisibility({
        ...article,
        summary: 'TLDR: Original introduction.',
        bodyHtml:
          '<blockquote><p><strong>TLDR</strong>: Original introduction.</p></blockquote>',
      }).showSummary
    ).toBe(false)
  })
  it('keeps an independent cover or editorial summary', () => {
    expect(
      wakuArticleHeroVisibility({
        ...article,
        bodyHtml: '<p>Different body.</p>',
      })
    ).toEqual({ showCover: true, showSummary: true })
  })
  it('does not change unrelated articles or empty bodies', () => {
    expect(
      wakuArticleHeroVisibility({ ...article, slug: 'unrelated' })
    ).toEqual({ showCover: true, showSummary: true })
    expect(wakuArticleHeroVisibility({ ...article, bodyHtml: '' })).toEqual({
      showCover: true,
      showSummary: true,
    })
  })
})
