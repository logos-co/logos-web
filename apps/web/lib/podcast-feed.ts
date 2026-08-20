/**
 * Resolves a directly playable audio file for episodes that are only
 * distributed through channels the site cannot play itself.
 *
 * Apple Podcasts is the entry point because its URL carries the show id, and
 * the iTunes lookup API returns the enclosure URL and the duration for every
 * episode of that show. Apple's own iframe embed (embed.podcasts.apple.com)
 * renders an empty placeholder and never mounts its player, so resolving the
 * audio file is the only way to give these episodes a working player.
 */

const ITUNES_LOOKUP_ORIGIN = 'https://itunes.apple.com'
const EPISODE_LOOKUP_LIMIT = 200

const APPLE_SHOW_ID_PATTERN = /\/id(\d+)/
const APPLE_EPISODE_ID_PARAM = 'i'

export interface ResolvedPodcastAudio {
  audioFileUrl: string
  duration?: number
}

interface ItunesEpisode {
  wrapperType?: string
  trackId?: number
  trackName?: string
  episodeUrl?: string
  trackTimeMillis?: number
}

// The lookup response is the same for every episode of a show, so one request
// per show is enough for a whole build.
const showEpisodes = new Map<string, Promise<ItunesEpisode[]>>()

function parseApplePodcastsUrl(url: string) {
  try {
    const parsed = new URL(url)
    const showId = APPLE_SHOW_ID_PATTERN.exec(parsed.pathname)?.[1]

    if (!showId) return undefined

    return {
      showId,
      episodeId: parsed.searchParams.get(APPLE_EPISODE_ID_PARAM),
    }
  } catch {
    return undefined
  }
}

async function requestShowEpisodes(showId: string): Promise<ItunesEpisode[]> {
  const url = new URL('/lookup', ITUNES_LOOKUP_ORIGIN)
  url.searchParams.set('id', showId)
  url.searchParams.set('entity', 'podcastEpisode')
  url.searchParams.set('limit', String(EPISODE_LOOKUP_LIMIT))

  const response = await fetch(url, { cache: 'force-cache' })

  if (!response.ok) {
    throw new Error(
      `iTunes lookup failed for show ${showId}: status=${response.status}`
    )
  }

  const payload = (await response.json()) as { results?: ItunesEpisode[] }

  return (payload.results ?? []).filter(
    (result) => result.wrapperType === 'podcastEpisode'
  )
}

function fetchShowEpisodes(showId: string): Promise<ItunesEpisode[]> {
  const pending = showEpisodes.get(showId)
  if (pending) return pending

  const request = requestShowEpisodes(showId).catch((error: unknown) => {
    // A missing audio file costs the episode its player, it must not fail the
    // page, and the next request should be free to retry.
    showEpisodes.delete(showId)
    console.error('Podcast audio lookup failed', error)
    return [] as ItunesEpisode[]
  })

  showEpisodes.set(showId, request)

  return request
}

function normaliseTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/**
 * Episode ids stored in the CMS are not always in sync with Apple, so the
 * title is the more reliable key. Feed titles usually carry a show suffix
 * ("<episode> | Logos Podcast with ..."), hence the prefix comparison.
 */
function findEpisode(
  episodes: ItunesEpisode[],
  episodeId: string | null,
  title: string
) {
  const byId = episodeId
    ? episodes.find((episode) => String(episode.trackId) === episodeId)
    : undefined

  if (byId) return byId

  const wanted = normaliseTitle(title)
  if (!wanted) return undefined

  return (
    episodes.find((episode) => normaliseTitle(episode.trackName ?? '') === wanted) ??
    episodes.find((episode) =>
      normaliseTitle(episode.trackName ?? '').startsWith(wanted)
    )
  )
}

export async function resolveAudioFromApplePodcasts(
  applePodcastsUrl: string,
  episodeTitle: string
): Promise<ResolvedPodcastAudio | undefined> {
  const parsed = parseApplePodcastsUrl(applePodcastsUrl)
  if (!parsed) return undefined

  const episodes = await fetchShowEpisodes(parsed.showId)
  const episode = findEpisode(episodes, parsed.episodeId, episodeTitle)

  if (!episode?.episodeUrl) return undefined

  return {
    audioFileUrl: episode.episodeUrl,
    duration: episode.trackTimeMillis
      ? Math.round(episode.trackTimeMillis / 1000)
      : undefined,
  }
}

/** Test seam: the module-level cache would otherwise leak between cases. */
export function clearPodcastAudioCache() {
  showEpisodes.clear()
}
