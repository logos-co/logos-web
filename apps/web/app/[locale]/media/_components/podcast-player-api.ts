export interface YoutubePlayer {
  destroy: () => void
  getCurrentTime: () => number
  getDuration: () => number
  getIframe: () => HTMLIFrameElement
  isMuted: () => boolean
  mute: () => void
  pauseVideo: () => void
  playVideo: () => void
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  unMute: () => void
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
    ENDED: number
    PAUSED: number
    PLAYING: number
  }
}

declare global {
  interface Window {
    YT?: YoutubeApi
    onYouTubeIframeAPIReady?: () => void
  }
}

const YOUTUBE_API_SCRIPT_ID = 'youtube-iframe-api'
let youtubeApiPromise: Promise<YoutubeApi> | undefined

export function extractYoutubeVideoId(url: string): string | undefined {
  try {
    const parsed = new URL(url)
    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.split('/').filter(Boolean)[0]
    }
    if (parsed.hostname.includes('youtube.com')) {
      return (
        parsed.searchParams.get('v') ??
        parsed.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/)?.[1]
      )
    }
  } catch {
    return undefined
  }

  return undefined
}

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
