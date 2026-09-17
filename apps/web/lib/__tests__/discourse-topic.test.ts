import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  discourseTopicJsonUrl,
  fetchDiscourseTopic,
  parseDiscourseTopic,
} from '@/lib/discourse-topic'

const post = (id: number, overrides: Record<string, unknown> = {}) => ({
  id,
  username: `user${id}`,
  display_username: `User ${id}`,
  avatar_template: `/user_avatar/forum.logos.co/user${id}/{size}/1.png`,
  created_at: `2026-07-0${id}T10:00:00.000Z`,
  cooked: `<p>Reply ${id} from <a href="/u/user${id}">@user${id}</a></p>`,
  ...overrides,
})

const topic = (posts: unknown[], postsCount = posts.length) => ({
  slug: 'june-2026',
  title: 'State of the Logos Network: June 2026',
  posts_count: postsCount,
  post_stream: { posts },
})

describe('parseDiscourseTopic', () => {
  it('skips the opening post and keeps the first three replies', () => {
    const discussion = parseDiscourseTopic(
      42,
      topic([post(1), post(2), post(3), post(4), post(5)], 9)
    )

    expect(discussion).toMatchObject({
      id: 42,
      slug: 'june-2026',
      title: 'State of the Logos Network: June 2026',
      postsCount: 8,
      url: 'https://forum.logos.co/t/june-2026/42',
    })
    expect(discussion?.posts.map((reply) => reply.id)).toEqual(['2', '3', '4'])
  })

  it('makes forum-relative avatars and profile links absolute', () => {
    const [reply] = parseDiscourseTopic(1, topic([post(1), post(2)]))!.posts

    expect(reply).toEqual({
      id: '2',
      avatarUrl:
        'https://forum.logos.co/user_avatar/forum.logos.co/user2/40/1.png',
      createdAt: '2026-07-02T10:00:00.000Z',
      displayName: 'User 2',
      html: '<p>Reply 2 from <a target="_blank" rel="noopener noreferrer" href="https://forum.logos.co/u/user2">@user2</a></p>',
    })
  })

  it('keeps absolute avatars and falls back to the username', () => {
    const [reply] = parseDiscourseTopic(
      1,
      topic([
        post(1),
        post(2, {
          display_username: '',
          avatar_template: 'https://cdn.example/avatar/{size}.png',
        }),
      ])
    )!.posts

    expect(reply.avatarUrl).toBe('https://cdn.example/avatar/40.png')
    expect(reply.displayName).toBe('user2')
  })

  it('drops replies that are missing required fields', () => {
    const discussion = parseDiscourseTopic(
      1,
      topic([post(1), post(2, { cooked: '' }), post(3)])
    )

    expect(discussion?.posts.map((reply) => reply.id)).toEqual(['3'])
  })

  it('counts no replies for a topic with only the opening post', () => {
    expect(parseDiscourseTopic(1, topic([post(1)]))).toMatchObject({
      posts: [],
      postsCount: 0,
    })
  })

  it('rejects a payload that is not a topic', () => {
    expect(parseDiscourseTopic(1, null)).toBeUndefined()
    expect(parseDiscourseTopic(1, 'Not found')).toBeUndefined()
  })
})

describe('fetchDiscourseTopic', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reads the public topic JSON', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(topic([post(1), post(2)])), { status: 200 })
      )
    vi.stubGlobal('fetch', fetchMock)

    const discussion = await fetchDiscourseTopic(7)

    expect(fetchMock).toHaveBeenCalledWith(
      'https://forum.logos.co/t/7.json',
      undefined
    )
    expect(discussion?.posts).toHaveLength(1)
  })

  it('passes request options through', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(topic([post(1)])), { status: 200 })
      )
    vi.stubGlobal('fetch', fetchMock)
    const controller = new AbortController()

    await fetchDiscourseTopic(7, { signal: controller.signal })

    expect(fetchMock).toHaveBeenCalledWith(discourseTopicJsonUrl(7), {
      signal: controller.signal,
    })
  })

  it('reports a missing topic as no discussion', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('Not found', { status: 404 }))
    )

    await expect(fetchDiscourseTopic(7)).resolves.toBeUndefined()
  })

  it('lets network failures reach the caller', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')))

    await expect(fetchDiscourseTopic(7)).rejects.toThrow('offline')
  })
})
