import { describe, expect, test } from 'vitest'

import { fetchFromSource } from './source-fetch'
import { githubPolicy, wikipediaPolicy } from './source-policies'

describe('source fetch', () => {
  test('refuses a host the policy does not list', async () => {
    // The URL a source hands back is not a permission. Following one to an
    // arbitrary host is how an adapter becomes a general-purpose crawler.
    await expect(
      fetchFromSource(githubPolicy, 'https://example.com/data.json')
    ).rejects.toThrow(/may not reach example.com/)
  })

  test('refuses another approved source, not just any host', async () => {
    await expect(
      fetchFromSource(wikipediaPolicy, 'https://api.github.com/orgs/example')
    ).rejects.toThrow(/may not reach api.github.com/)
  })

  test('names the hosts it would have accepted', async () => {
    await expect(
      fetchFromSource(githubPolicy, 'https://raw.githubusercontent.com/x')
    ).rejects.toThrow(/Allowed: api.github.com/)
  })
})
