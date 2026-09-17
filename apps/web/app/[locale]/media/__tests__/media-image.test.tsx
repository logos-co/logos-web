import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { MediaImage } from '../_components/media-image'

const SIZES = '(max-width: 767px) 100vw, 700px'

describe('MediaImage', () => {
  it('lets the browser pick a local variant', () => {
    const html = renderToStaticMarkup(
      <MediaImage
        image={{
          url: '/media-images/photo-750.webp',
          srcSet:
            '/media-images/photo-750.webp 750w, /media-images/photo-1400.webp 1400w',
          alt: 'Berlin clean-up',
          width: 1448,
          height: 1086,
        }}
        sizes={SIZES}
      />
    )

    expect(html).toContain('src="/media-images/photo-750.webp"')
    expect(html).toContain(
      'srcSet="/media-images/photo-750.webp 750w, /media-images/photo-1400.webp 1400w"'
    )
    expect(html).toContain(`sizes="${SIZES}"`)
    expect(html).toContain('width="1448"')
    expect(html).toContain('height="1086"')
    expect(html).toContain('alt="Berlin clean-up"')
    expect(html).toContain('loading="lazy"')
    expect(html).toContain('decoding="async"')
  })

  it('loads a hero image eagerly and first', () => {
    const html = renderToStaticMarkup(
      <MediaImage
        image={{ url: '/cover.webp', alt: '', width: 1200, height: 630 }}
        sizes={SIZES}
        priority
      />
    )

    expect(html).toContain('loading="eager"')
    expect(html).toContain('fetchPriority="high"')
  })

  it('keeps a CMS image without variants as a plain source', () => {
    const html = renderToStaticMarkup(
      <MediaImage
        image={{
          url: 'https://cms-press.logos.co/uploads/chart.gif',
          alt: 'Chart',
          width: 0,
          height: 0,
        }}
        sizes={SIZES}
        className="object-cover"
      />
    )

    expect(html).not.toContain('srcSet')
    expect(html).not.toContain('sizes=')
    expect(html).not.toContain('width=')
    expect(html).toContain('class="object-cover"')
  })
})
