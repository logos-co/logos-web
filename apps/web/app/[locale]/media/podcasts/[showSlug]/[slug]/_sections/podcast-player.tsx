'use client'

import { Pause, Play, RotateCcw, RotateCw } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'

import type { BlogImage, BlogPodcastChannel } from '@/lib/blog-content'
import { cn } from '@/lib/cn'

import type { PodcastPlayerCopy } from './types'

interface YoutubePlayer {
  destroy: () => void
  getCurrentTime: () => number
  getDuration: () => number
  pauseVideo: () => void
  playVideo: () => void
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
}

interface YoutubePlayerEvent {
  data: number
  target: YoutubePlayer
}

interface YoutubeApi {
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

interface PodcastPlayerProps {
  channels: BlogPodcastChannel[]
  copy: PodcastPlayerCopy
  coverImage: BlogImage | null
  showTitle: string
  title: string
}

const YOUTUBE_API_SCRIPT_ID = 'youtube-iframe-api'

function extractYoutubeVideoId(url: string): string | undefined {
  try {
    const parsed = new URL(url)
    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.split('/').filter(Boolean)[0]
    }
    if (parsed.hostname.includes('youtube.com')) {
      return (
        parsed.searchParams.get('v') ??
        parsed.pathname.match(/\/embed\/([^/?]+)/)?.[1] ??
        parsed.pathname.match(/\/shorts\/([^/?]+)/)?.[1]
      )
    }
  } catch {
    return undefined
  }

  return undefined
}

function loadYoutubeApi(): Promise<YoutubeApi> {
  if (window.YT) return Promise.resolve(window.YT)

  return new Promise((resolve) => {
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
}

function formatTime(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '0:00'
  const totalSeconds = Math.floor(value)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function PodcastPlayer({
  channels,
  copy,
  coverImage,
  showTitle,
  title,
}: PodcastPlayerProps) {
  const youtubeChannel = channels.find((channel) => channel.name === 'Youtube')
  const audioChannel = channels.find((channel) => channel.data?.audioFileUrl)
  const youtubeVideoId = useMemo(
    () =>
      youtubeChannel?.url
        ? extractYoutubeVideoId(youtubeChannel.url)
        : undefined,
    [youtubeChannel?.url]
  )
  const audioFileUrl = audioChannel?.data?.audioFileUrl
  const mode = youtubeVideoId ? 'youtube' : audioFileUrl ? 'audio' : 'cover'

  const audioRef = useRef<HTMLAudioElement>(null)
  const youtubeContainerRef = useRef<HTMLDivElement>(null)
  const youtubePlayerRef = useRef<YoutubePlayer | null>(null)

  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(audioChannel?.data?.duration ?? 0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isReady, setIsReady] = useState(mode === 'cover')

  useEffect(() => {
    if (mode !== 'youtube' || !youtubeVideoId || !youtubeContainerRef.current) {
      return
    }

    let cancelled = false
    let player: YoutubePlayer | null = null

    loadYoutubeApi().then((api) => {
      if (cancelled || !youtubeContainerRef.current) return

      player = new api.Player(youtubeContainerRef.current, {
        videoId: youtubeVideoId,
        playerVars: {
          enablejsapi: 1,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
        },
        events: {
          onReady: (event) => {
            youtubePlayerRef.current = event.target
            setDuration(event.target.getDuration())
            setIsReady(true)
          },
          onStateChange: (event) => {
            setIsPlaying(event.data === api.PlayerState.PLAYING)
            if (event.data === api.PlayerState.ENDED) {
              setCurrentTime(event.target.getDuration())
            }
          },
        },
      })
    })

    return () => {
      cancelled = true
      youtubePlayerRef.current = null
      player?.destroy()
    }
  }, [mode, youtubeVideoId])

  useEffect(() => {
    if (mode !== 'audio' || !audioRef.current) return

    const audio = audioRef.current
    const syncTime = () => setCurrentTime(audio.currentTime)
    const syncDuration = () => setDuration(audio.duration || duration)
    const syncPlaying = () => setIsPlaying(!audio.paused)

    audio.addEventListener('loadedmetadata', syncDuration)
    audio.addEventListener('pause', syncPlaying)
    audio.addEventListener('play', syncPlaying)
    audio.addEventListener('timeupdate', syncTime)
    audio.addEventListener('ended', syncPlaying)
    setIsReady(true)

    return () => {
      audio.removeEventListener('loadedmetadata', syncDuration)
      audio.removeEventListener('pause', syncPlaying)
      audio.removeEventListener('play', syncPlaying)
      audio.removeEventListener('timeupdate', syncTime)
      audio.removeEventListener('ended', syncPlaying)
    }
  }, [duration, mode])

  useEffect(() => {
    if (mode !== 'youtube' || !isReady) return

    const timer = window.setInterval(() => {
      const player = youtubePlayerRef.current
      if (!player) return
      setCurrentTime(player.getCurrentTime())
      setDuration(player.getDuration())
    }, 500)

    return () => window.clearInterval(timer)
  }, [isReady, mode])

  const togglePlayback = () => {
    if (mode === 'youtube') {
      const player = youtubePlayerRef.current
      if (!player) return
      if (isPlaying) {
        player.pauseVideo()
      } else {
        player.playVideo()
      }
      return
    }

    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      void audio.play()
    } else {
      audio.pause()
    }
  }

  const seekTo = (seconds: number) => {
    const nextTime = Math.max(0, Math.min(seconds, duration || seconds))
    if (mode === 'youtube') {
      youtubePlayerRef.current?.seekTo(nextTime, true)
    } else if (audioRef.current) {
      audioRef.current.currentTime = nextTime
    }
    setCurrentTime(nextTime)
  }

  const hasControls = mode === 'youtube' || mode === 'audio'

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-video w-full overflow-hidden bg-brand-dark-green/10">
        {mode === 'youtube' ? (
          <div ref={youtubeContainerRef} className="h-full w-full" />
        ) : coverImage ? (
          <Image
            src={coverImage.url}
            alt={coverImage.alt}
            fill
            priority
            sizes="(max-width: 1024px) calc(100vw - 24px), 940px"
            className="object-cover"
          />
        ) : null}
      </div>

      {audioFileUrl ? (
        <audio ref={audioRef} preload="metadata" src={audioFileUrl} />
      ) : null}

      {hasControls ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-dark-green bg-accent-tan px-3 py-3 text-brand-dark-green shadow-[0_-8px_30px_rgba(13,35,34,0.08)]">
          <div className="mx-auto flex max-w-[940px] items-center gap-3">
            <button
              type="button"
              aria-label={copy.rewind}
              className="inline-flex size-10 cursor-pointer items-center justify-center border border-brand-dark-green text-brand-dark-green transition-colors hover:bg-brand-yellow disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!isReady}
              onClick={() => seekTo(currentTime - 15)}
            >
              <RotateCcw aria-hidden="true" size={16} />
            </button>
            <button
              type="button"
              aria-label={isPlaying ? copy.pause : copy.play}
              className="inline-flex size-10 cursor-pointer items-center justify-center bg-brand-dark-green text-brand-off-white transition-colors hover:bg-brand-dark-green/85 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!isReady}
              onClick={togglePlayback}
            >
              {isPlaying ? (
                <Pause aria-hidden="true" size={16} />
              ) : (
                <Play aria-hidden="true" size={16} />
              )}
            </button>
            <button
              type="button"
              aria-label={copy.forward}
              className="inline-flex size-10 cursor-pointer items-center justify-center border border-brand-dark-green text-brand-dark-green transition-colors hover:bg-brand-yellow disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!isReady}
              onClick={() => seekTo(currentTime + 15)}
            >
              <RotateCw aria-hidden="true" size={16} />
            </button>

            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex items-center justify-between gap-4">
                <p className="truncate font-sans text-[12px] font-medium leading-[1.2] tracking-normal">
                  {title}
                </p>
                <p className="shrink-0 font-mono text-[10px] leading-[1.35]">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </p>
              </div>
              <input
                aria-label={copy.seek}
                className={cn(
                  'h-2 w-full cursor-pointer accent-brand-dark-green',
                  !isReady && 'cursor-not-allowed opacity-40'
                )}
                disabled={!isReady}
                max={duration || 0}
                min={0}
                onChange={(event) => seekTo(Number(event.target.value))}
                step={1}
                type="range"
                value={Math.min(currentTime, duration || currentTime)}
              />
              <p className="truncate font-mono text-[10px] uppercase leading-[1.35]">
                {showTitle}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
