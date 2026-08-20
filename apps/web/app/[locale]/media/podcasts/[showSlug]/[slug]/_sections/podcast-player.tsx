'use client'

import Image from 'next/image'
import { useEffect, useMemo, useRef } from 'react'

import {
  PodcastInlinePlayerControls,
  type PodcastPlaybackController,
  type PodcastPlayerCopy,
  type PodcastPlayerEpisode,
  usePodcastPlayer,
} from '../../../../_components/podcast-player-context'
import {
  extractSpotifyUri,
  extractYoutubeVideoId,
  loadSpotifyApi,
  loadYoutubeApi,
  type SpotifyController,
  type YoutubePlayer,
} from '../../../../_components/podcast-player-api'
import type { BlogPodcastDetail } from '@/lib/blog-content'

interface PodcastPlayerProps {
  copy: PodcastPlayerCopy
  podcast: BlogPodcastDetail
}

/** Spotify's compact embed layout. The tall card wastes space at this width. */
const SPOTIFY_EMBED_HEIGHT = 152

function getEpisode(
  podcast: BlogPodcastDetail,
  copy: PodcastPlayerCopy
): PodcastPlayerEpisode | null {
  const youtubeChannel = podcast.channels.find(
    (channel) => channel.name.toLowerCase() === 'youtube'
  )
  const audioChannel = podcast.channels.find(
    (channel) => channel.data?.audioFileUrl
  )
  const spotifyChannel = podcast.channels.find((channel) =>
    Boolean(extractSpotifyUri(channel.url))
  )
  const youtubeVideoId = youtubeChannel
    ? extractYoutubeVideoId(youtubeChannel.url)
    : undefined
  const source = youtubeVideoId
    ? { kind: 'youtube' as const, url: youtubeChannel?.url ?? '' }
    : audioChannel?.data?.audioFileUrl
      ? { kind: 'audio' as const, url: audioChannel.data.audioFileUrl }
      : spotifyChannel
        ? { kind: 'spotify' as const, url: spotifyChannel.url }
        : null

  if (!source) return null

  return {
    copy,
    coverImage: podcast.coverImage,
    id: podcast.id || `${podcast.showSlug}/${podcast.slug}`,
    showTitle: podcast.show?.title ?? 'Logos Podcast',
    source,
    title: podcast.title,
  }
}

export function PodcastPlayer({ copy, podcast }: PodcastPlayerProps) {
  const {
    activateEpisode,
    registerEpisode,
    reportEpisode,
    setEpisodeVisible,
    unregisterEpisode,
  } = usePodcastPlayer()
  const episode = useMemo(() => getEpisode(podcast, copy), [copy, podcast])
  const containerRef = useRef<HTMLDivElement>(null)
  const youtubeContainerRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const spotifyContainerRef = useRef<HTMLDivElement>(null)
  const playerVisibleRef = useRef(false)

  useEffect(() => {
    if (!episode || !containerRef.current) return

    const target = containerRef.current
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries[0]?.isIntersecting ?? false
        playerVisibleRef.current = visible
        setEpisodeVisible(episode.id, visible)
      },
      { threshold: 0.05 }
    )
    observer.observe(target)

    return () => {
      playerVisibleRef.current = false
      setEpisodeVisible(episode.id, false)
      observer.disconnect()
    }
  }, [episode, setEpisodeVisible])

  useEffect(() => {
    if (
      !episode ||
      episode.source.kind !== 'youtube' ||
      !youtubeContainerRef.current
    ) {
      return
    }

    const videoId = extractYoutubeVideoId(episode.source.url)
    if (!videoId) return

    let cancelled = false
    let youtubePlayer: YoutubePlayer | null = null
    let controller: PodcastPlaybackController | null = null
    let timer: number | undefined
    let playing = false

    void loadYoutubeApi().then((api) => {
      if (cancelled || !youtubeContainerRef.current) return

      youtubePlayer = new api.Player(youtubeContainerRef.current, {
        videoId,
        playerVars: {
          controls: 1,
          enablejsapi: 1,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
        },
        events: {
          onReady: (event) => {
            event.target.getIframe().setAttribute('title', episode.title)
            controller = {
              getCurrentTime: () => event.target.getCurrentTime(),
              getDuration: () => event.target.getDuration(),
              getMuted: () => event.target.isMuted(),
              getPlaying: () => playing,
              pause: () => event.target.pauseVideo(),
              play: () => event.target.playVideo(),
              seekTo: (seconds) => event.target.seekTo(seconds, true),
              setMuted: (muted) =>
                muted ? event.target.mute() : event.target.unMute(),
            }
            registerEpisode(episode, controller)
            reportEpisode(episode.id, {
              duration: controller.getDuration(),
              isMuted: controller.getMuted(),
              isReady: true,
            })
            timer = window.setInterval(() => {
              if (!controller) return
              reportEpisode(episode.id, {
                currentTime: controller.getCurrentTime(),
                duration: controller.getDuration(),
                isMuted: controller.getMuted(),
                isPlaying: controller.getPlaying(),
              })
            }, 500)
          },
          onStateChange: (event) => {
            playing =
              event.data === api.PlayerState.PLAYING ||
              event.data === api.PlayerState.BUFFERING
            if (playing && playerVisibleRef.current) {
              activateEpisode(episode.id)
            }
            reportEpisode(episode.id, {
              currentTime: event.target.getCurrentTime(),
              duration: event.target.getDuration(),
              isPlaying: playing,
            })
          },
        },
      })
    })

    return () => {
      cancelled = true
      if (timer) window.clearInterval(timer)
      if (controller) unregisterEpisode(episode.id, controller)
      youtubePlayer?.destroy()
    }
  }, [
    activateEpisode,
    episode,
    registerEpisode,
    reportEpisode,
    unregisterEpisode,
  ])

  useEffect(() => {
    if (!episode || episode.source.kind !== 'audio' || !audioRef.current) {
      return
    }

    const audio = audioRef.current
    const controller: PodcastPlaybackController = {
      getCurrentTime: () => audio.currentTime,
      getDuration: () => audio.duration || 0,
      getMuted: () => audio.muted,
      getPlaying: () => !audio.paused,
      pause: () => audio.pause(),
      play: () => {
        void audio.play()
      },
      seekTo: (seconds) => {
        audio.currentTime = seconds
      },
      setMuted: (muted) => {
        audio.muted = muted
      },
    }
    const sync = () =>
      reportEpisode(episode.id, {
        currentTime: controller.getCurrentTime(),
        duration: controller.getDuration(),
        isMuted: controller.getMuted(),
        isPlaying: controller.getPlaying(),
        isReady: audio.readyState > 0,
      })
    const activate = () => {
      if (playerVisibleRef.current) activateEpisode(episode.id)
    }

    registerEpisode(episode, controller)
    audio.addEventListener('loadedmetadata', sync)
    audio.addEventListener('pause', sync)
    audio.addEventListener('play', activate)
    audio.addEventListener('play', sync)
    audio.addEventListener('timeupdate', sync)
    audio.addEventListener('volumechange', sync)

    return () => {
      unregisterEpisode(episode.id, controller)
      audio.removeEventListener('loadedmetadata', sync)
      audio.removeEventListener('pause', sync)
      audio.removeEventListener('play', activate)
      audio.removeEventListener('play', sync)
      audio.removeEventListener('timeupdate', sync)
      audio.removeEventListener('volumechange', sync)
    }
  }, [
    activateEpisode,
    episode,
    registerEpisode,
    reportEpisode,
    unregisterEpisode,
  ])

  useEffect(() => {
    if (
      !episode ||
      episode.source.kind !== 'spotify' ||
      !spotifyContainerRef.current
    ) {
      return
    }

    const uri = extractSpotifyUri(episode.source.url)
    if (!uri) return

    let cancelled = false
    let spotifyController: SpotifyController | null = null
    let controller: PodcastPlaybackController | null = null
    let position = 0
    let duration = 0
    let paused = true

    void loadSpotifyApi().then((api) => {
      if (cancelled || !spotifyContainerRef.current) return

      api.createController(
        spotifyContainerRef.current,
        { height: SPOTIFY_EMBED_HEIGHT, uri, width: '100%' },
        (created) => {
          if (cancelled) {
            created.destroy()
            return
          }

          spotifyController = created
          // Spotify exposes no volume control, so muting stays a no-op.
          controller = {
            getCurrentTime: () => position,
            getDuration: () => duration,
            getMuted: () => false,
            getPlaying: () => !paused,
            pause: () => created.pause(),
            play: () => created.resume(),
            seekTo: (seconds) => created.seek(seconds),
            setMuted: () => undefined,
          }

          created.addListener('playback_update', (event) => {
            position = (event.data?.position ?? 0) / 1000
            duration = (event.data?.duration ?? 0) / 1000
            const wasPaused = paused
            paused = event.data?.isPaused ?? true

            if (wasPaused && !paused && playerVisibleRef.current) {
              activateEpisode(episode.id)
            }

            reportEpisode(episode.id, {
              currentTime: position,
              duration,
              isPlaying: !paused,
              isReady: duration > 0,
            })
          })

          registerEpisode(episode, controller)
        }
      )
    })

    return () => {
      cancelled = true
      if (controller) unregisterEpisode(episode.id, controller)
      spotifyController?.destroy()
    }
  }, [
    activateEpisode,
    episode,
    registerEpisode,
    reportEpisode,
    unregisterEpisode,
  ])

  const mode = episode?.source.kind ?? 'cover'

  if (mode === 'spotify') {
    return (
      <div
        ref={containerRef}
        data-testid="podcast-episode-player"
        className="w-full overflow-hidden"
        style={{ height: SPOTIFY_EMBED_HEIGHT }}
      >
        <div ref={spotifyContainerRef} className="h-full w-full" />
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      data-testid="podcast-episode-player"
      className="relative aspect-video w-full overflow-hidden bg-brand-dark-green/10"
    >
      {mode === 'youtube' ? (
        <div ref={youtubeContainerRef} className="h-full w-full" />
      ) : podcast.coverImage ? (
        <Image
          src={podcast.coverImage.url}
          alt={podcast.coverImage.alt}
          fill
          priority
          sizes="(max-width: 767px) calc(100vw - 32px), 696px"
          className="object-cover"
        />
      ) : null}

      {mode === 'audio' && episode ? (
        <>
          <audio
            ref={audioRef}
            preload="metadata"
            src={episode.source.url}
            className="hidden"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black to-transparent p-4 pt-12">
            <PodcastInlinePlayerControls
              episodeId={episode.id}
              playLabel={copy.play}
            />
          </div>
        </>
      ) : null}
    </div>
  )
}
