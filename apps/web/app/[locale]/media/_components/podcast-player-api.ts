export { youtubeVideoId as extractYoutubeVideoId } from '@/lib/media-embed'

export interface YoutubePlayer {
  destroy: () => void
  getCurrentTime: () => number
  getDuration: () => number
  getIframe: () => HTMLIFrameElement
  getPlayerState: () => number
  isMuted: () => boolean
  mute: () => void
  pauseVideo: () => void
  playVideo: () => void
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  unMute: () => void
}

/** `YT.PlayerState` values where the video is playing or paused mid-way. */
const YOUTUBE_STARTED_STATES = new Set([1, 2, 3])
/** A seek this close to where the player already is changes nothing. */
const SEEK_TOLERANCE_SECONDS = 1

/**
 * Youtube starts a video that is not playing or paused (cued, unstarted,
 * ended) the moment it is seeked, which made a newly opened episode play on
 * its own. Pausing straight after keeps a seek from changing whether the
 * episode plays; a play() issued afterwards still starts from the new spot.
 */
export function seekYoutubePlayer(
  player: Pick<
    YoutubePlayer,
    'getCurrentTime' | 'getPlayerState' | 'pauseVideo' | 'seekTo'
  >,
  seconds: number
): void {
  const started = YOUTUBE_STARTED_STATES.has(player.getPlayerState())
  // Seeking a player that has not started swaps its cover for a black frame,
  // so a seek to where it already is gets skipped.
  if (
    !started &&
    Math.abs(player.getCurrentTime() - seconds) < SEEK_TOLERANCE_SECONDS
  ) {
    return
  }
  player.seekTo(seconds, true)
  if (!started) player.pauseVideo()
}

export interface YoutubePlayerEvent {
  data: number
  target: YoutubePlayer
}

export interface YoutubeApi {
  Player: new (
    element: HTMLElement,
    options: {
      events: {
        onReady: (event: YoutubePlayerEvent) => void
        onStateChange: (event: YoutubePlayerEvent) => void
      }
      playerVars: Record<string, number>
      videoId: string
    }
  ) => YoutubePlayer
  PlayerState: {
    BUFFERING: number
    ENDED: number
    PAUSED: number
    PLAYING: number
  }
}

export interface SpotifyController {
  addListener: (
    event: 'ready' | 'playback_update',
    handler: (event: SpotifyPlaybackEvent) => void
  ) => void
  destroy: () => void
  pause: () => void
  play: () => void
  resume: () => void
  seek: (seconds: number) => void
}

export interface SpotifyPlaybackEvent {
  data?: {
    duration?: number
    isPaused?: boolean
    position?: number
  }
}

export interface SpotifyApi {
  createController: (
    element: HTMLElement,
    options: { height?: number | string; uri: string; width?: number | string },
    callback: (controller: SpotifyController) => void
  ) => void
}

declare global {
  interface Window {
    Spotify?: SpotifyApi
    YT?: YoutubeApi
    onSpotifyIframeApiReady?: (api: SpotifyApi) => void
    onYouTubeIframeAPIReady?: () => void
  }
}

const SPOTIFY_API_SCRIPT_ID = 'spotify-iframe-api'
let spotifyApiPromise: Promise<SpotifyApi> | undefined

const YOUTUBE_API_SCRIPT_ID = 'youtube-iframe-api'
let youtubeApiPromise: Promise<YoutubeApi> | undefined

export function loadYoutubeApi(): Promise<YoutubeApi> {
  if (window.YT) return Promise.resolve(window.YT)
  if (youtubeApiPromise) return youtubeApiPromise

  youtubeApiPromise = new Promise((resolve) => {
    const previousCallback = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.()
      if (window.YT) resolve(window.YT)
    }

    if (document.getElementById(YOUTUBE_API_SCRIPT_ID)) return

    const script = document.createElement('script')
    script.id = YOUTUBE_API_SCRIPT_ID
    script.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(script)
  })

  return youtubeApiPromise
}

/** Spotify's controller addresses content by URI, not by share URL. */
export function extractSpotifyUri(url: string): string | undefined {
  try {
    const parsed = new URL(url)
    if (parsed.hostname.replace(/^www\./, '') !== 'open.spotify.com') {
      return undefined
    }

    const [type, id] = parsed.pathname
      .split('/')
      .filter((segment) => Boolean(segment) && !segment.startsWith('intl-'))

    return id && (type === 'episode' || type === 'show')
      ? `spotify:${type}:${id}`
      : undefined
  } catch {
    return undefined
  }
}

export function loadSpotifyApi(): Promise<SpotifyApi> {
  if (window.Spotify) return Promise.resolve(window.Spotify)
  if (spotifyApiPromise) return spotifyApiPromise

  spotifyApiPromise = new Promise((resolve) => {
    const previousCallback = window.onSpotifyIframeApiReady
    window.onSpotifyIframeApiReady = (api) => {
      previousCallback?.(api)
      window.Spotify = api
      resolve(api)
    }

    if (document.getElementById(SPOTIFY_API_SCRIPT_ID)) return

    const script = document.createElement('script')
    script.id = SPOTIFY_API_SCRIPT_ID
    script.src = 'https://open.spotify.com/embed/iframe-api/v1'
    document.head.appendChild(script)
  })

  return spotifyApiPromise
}

export function formatPlaybackTime(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '00:00'
  const totalSeconds = Math.floor(value)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
