import { describe, expect, it } from 'vitest'

import { searchMediaEntries, type MediaSearchEntry } from '@/lib/media-search'

const entries: MediaSearchEntry[] = [
  {
    type: 'article',
    title: 'Logos Dev Update',
    description: 'A monthly engineering summary.',
    publishedAt: '2026-07-13T00:00:00.000Z',
    href: '/media/article/dev-update',
    searchText: 'Private transfers use Kyber post-quantum encryption.',
  },
  {
    type: 'podcast',
    title: 'The Network State',
    description: 'A conversation about local communities.',
    publishedAt: '2026-07-01T00:00:00.000Z',
    href: '/media/podcasts/logos-state/network-state',
    searchText: 'Community organisers discuss parallel institutions.',
  },
  {
    type: 'article',
    title: 'Kyber Explained',
    description: 'A cryptography primer.',
    publishedAt: '2026-06-01T00:00:00.000Z',
    href: '/media/article/kyber-explained',
    searchText: 'An introduction to post-quantum key exchange.',
  },
]

describe('searchMediaEntries', () => {
  it('finds terms that occur only in full content', () => {
    expect(searchMediaEntries(entries, 'private transfers')).toEqual([
      entries[0],
    ])
  })

  it('ranks a title match above a body-only match', () => {
    expect(searchMediaEntries(entries, 'Kyber')).toEqual([
      entries[2],
      entries[0],
    ])
  })

  it('requires every query term and normalises punctuation and case', () => {
    expect(searchMediaEntries(entries, 'POST quantum')).toEqual([
      entries[0],
      entries[2],
    ])
    expect(searchMediaEntries(entries, 'private QUANTUM')).toEqual([entries[0]])
  })

  it('filters by media type', () => {
    expect(
      searchMediaEntries(entries, 'community', { types: ['podcast'] })
    ).toEqual([entries[1]])
    expect(
      searchMediaEntries(entries, 'community', { types: ['article'] })
    ).toEqual([])
  })

  it('returns recent entries first for an empty query', () => {
    expect(searchMediaEntries(entries, '')).toEqual(entries)
  })
})
