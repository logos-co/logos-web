import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

import { MediaSearchFilters } from '../media-search-filters'

const noop = () => {}

const render = (activeFilter: 'type' | 'topic') =>
  renderToStaticMarkup(
    <MediaSearchFilters
      topics={['Learn', 'Community']}
      selectedTypes={['article']}
      selectedTopics={['Learn']}
      activeFilter={activeFilter}
      onActiveFilterChange={noop}
      onTypeToggle={noop}
      onTopicToggle={noop}
      onClear={noop}
    />
  )

describe('MediaSearchFilters', () => {
  it('tells assistive technology which content types are on', () => {
    const html = render('type')

    // The filled square is the only visual cue, so the state has to be exposed.
    expect(html).toContain('aria-pressed="true"')
    expect(html).toContain('aria-pressed="false"')
    expect(html.match(/aria-pressed/g)).toHaveLength(2)
  })

  it('tells assistive technology which topics are on', () => {
    const html = render('topic')

    const pressed = [...html.matchAll(/aria-pressed="(true|false)"/g)].map(
      (match) => match[1]
    )
    expect(pressed).toEqual(['true', 'false'])
  })
})
