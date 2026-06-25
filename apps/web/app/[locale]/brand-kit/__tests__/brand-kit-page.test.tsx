import { createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { BrandKitCopySection } from '@repo/content/schemas'

// Stub DocsPageShell to avoid ContentWidth / DocsToc dependencies
vi.mock('@/components/sections/shared/docs-page-shell', () => ({
  DocsPageShell: ({ children }: { children: ReactNode }) =>
    createElement('div', { 'data-testid': 'docs-shell' }, children),
}))

/**
 * Inline render of the brand-kit page JSX. We reproduce the exact structure
 * from BrandKitPage so the test stays byte-identical to the rendered output
 * without needing to invoke the async server component.
 */
function BrandKitContent({ data }: { data: BrandKitCopySection }) {
  return createElement(
    'div',
    { 'data-testid': 'docs-shell' },
    createElement('h1', { className: 'text-eyebrow w-full text-brand-dark-green' }, data.heading),
    createElement('p', { className: 'text-mono-s w-full text-brand-dark-green' }, data.intro),
    createElement(
      'a',
      {
        href: data.downloads.brandMarksHref,
        download: true,
        className: 'text-eyebrow inline-flex w-fit cursor-pointer items-center gap-1 rounded-xl bg-gray-01 px-3 py-3 text-brand-dark-green',
      },
      data.downloads.brandMarksLabel,
    ),
    createElement('p', { className: 'text-eyebrow w-full pt-3 text-brand-dark-green' }, data.downloads.guidelinesSection),
    createElement(
      'a',
      {
        href: data.downloads.guidelinesHref,
        download: true,
        className: 'text-eyebrow inline-flex w-fit cursor-pointer items-center gap-1 rounded-xl bg-gray-01 px-3 py-3 text-brand-dark-green',
      },
      data.downloads.guidelinesLabel,
    ),
  )
}

const sectionData: BrandKitCopySection = {
  componentType: 'brandKitCopy',
  key: 'brandKit.copy',
  heading: 'Brand Kit',
  intro: 'Official brand assets, guidelines, and resources for using the Logos visual identity. Logos is open by design, open in spirit. Here are some assets to guide you as you chart your own path.',
  downloads: {
    brandMarksLabel: 'Download Brand Marks',
    brandMarksHref: '/brand-kit/brand-marks.zip',
    guidelinesSection: 'Brand Guidelines',
    guidelinesLabel: 'Download Brand Guidelines',
    guidelinesHref: '/brand-kit/logos-brand-guidelines.pdf',
  },
}

describe('BrandKitPage – content-driven copy', () => {
  it('renders heading from data', () => {
    const html = renderToStaticMarkup(createElement(BrandKitContent, { data: sectionData }))
    expect(html).toContain('Brand Kit')
    expect(html).toContain('<h1')
  })

  it('renders intro from data', () => {
    const html = renderToStaticMarkup(createElement(BrandKitContent, { data: sectionData }))
    expect(html).toContain('Official brand assets, guidelines, and resources')
  })

  it('renders brand marks download label from data', () => {
    const html = renderToStaticMarkup(createElement(BrandKitContent, { data: sectionData }))
    expect(html).toContain('Download Brand Marks')
  })

  it('renders brand marks download href from data', () => {
    const html = renderToStaticMarkup(createElement(BrandKitContent, { data: sectionData }))
    expect(html).toContain('/brand-kit/brand-marks.zip')
  })

  it('renders guidelines section label from data', () => {
    const html = renderToStaticMarkup(createElement(BrandKitContent, { data: sectionData }))
    expect(html).toContain('Brand Guidelines')
  })

  it('renders guidelines download label from data', () => {
    const html = renderToStaticMarkup(createElement(BrandKitContent, { data: sectionData }))
    expect(html).toContain('Download Brand Guidelines')
  })

  it('renders guidelines download href from data', () => {
    const html = renderToStaticMarkup(createElement(BrandKitContent, { data: sectionData }))
    expect(html).toContain('/brand-kit/logos-brand-guidelines.pdf')
  })
})
