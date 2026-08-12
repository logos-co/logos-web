'use client'

import { Pause, Play, Volume2, VolumeX, X } from 'lucide-react'
import Image from 'next/image'
import type { ReactNode } from 'react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import type { BlogImage } from '@/lib/blog-content'

import {
  extractSpotifyUri,
  extractYoutubeVideoId,
  formatPlaybackTime,
  loadSpotifyApi,
  loadYoutubeApi,
  type SpotifyController,
  type YoutubePlayer,
} from './podcast-player-api'

/** The global engine is off-screen, the embed only needs to exist. */
const SPOTIFY_ENGINE_SIZE = 1

export interface PodcastPlayerCopy {
  close: string
  mute: string
  pause: string
  play: string
  seek: string
  unmute: string
}

export interface PodcastPlayerEpisode {
  copy: PodcastPlayerCopy
  coverImage: BlogImage | null
  id: string
  showTitle: string
  source: {
    kind: 'audio' | 'spotify' | 'youtube'
    url: string
  }
  title: string
}

export interface PodcastPlaybackController {
  getCurrentTime: () => number
  getDuration: () => number
  getMuted: () => boolean
  getPlaying: () => boolean
  pause: () => void
  play: () => void
  seekTo: (seconds: number) => void
  setMuted: (muted: boolean) => void
}

interface PodcastPlaybackState {
  currentTime: number
  duration: number
  episode: PodcastPlayerEpisode | null
  isMuted: boolean
  isPlaying: boolean
  isReady: boolean
}

interface PlaybackPatch {
  currentTime?: number
  duration?: number
  isMuted?: boolean
  isPlaying?: boolean
  isReady?: boolean
}

interface PodcastPlayerContextValue {
  activateEpisode: (episodeId: string) => void
  close: () => void
  registerEpisode: (
    episode: PodcastPlayerEpisode,
    controller: PodcastPlaybackController
  ) => void
  reportEpisode: (episodeId: string, patch: PlaybackPatch) => void
  seekEpisode: (episodeId: string, seconds: number) => void
  setEpisodeVisible: (episodeId: string, visible: boolean) => void
  state: PodcastPlaybackState
  toggleEpisode: (episodeId: string) => void
  toggleMuted: () => void
  unregisterEpisode: (
    episodeId: string,
    controller: PodcastPlaybackController
  ) => void
}

interface Registration {
  controller: PodcastPlaybackController
  episode: PodcastPlayerEpisode
}

const EMPTY_STATE: PodcastPlaybackState = {
  currentTime: 0,
  duration: 0,
  episode: null,
  isMuted: false,
  isPlaying: false,
  isReady: false,
}
const PLAYER_STORAGE_KEY = 'logos-media-podcast-player'

const PodcastPlayerContext = createContext<PodcastPlayerContextValue | null>(
  null
)

function clampTime(value: number, duration: number): number {
  return Math.max(0, Math.min(value, duration || value))
}

function playbackPatch(
  controller: PodcastPlaybackController
): Required<
  Pick<PlaybackPatch, 'currentTime' | 'duration' | 'isMuted' | 'isPlaying'>
> {
  return {
    currentTime: controller.getCurrentTime(),
    duration: controller.getDuration(),
    isMuted: controller.getMuted(),
    isPlaying: controller.getPlaying(),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function storedString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function storedNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function readStoredPlayback(): PodcastPlaybackState | null {
  try {
    const raw = window.sessionStorage.getItem(PLAYER_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || !isRecord(parsed.episode)) return null

    const episode = parsed.episode
    const source = isRecord(episode.source) ? episode.source : null
    const copy = isRecord(episode.copy) ? episode.copy : null
    const sourceKind = source ? storedString(source.kind) : ''
    if (
      !source ||
      !copy ||
      !['audio', 'spotify', 'youtube'].includes(sourceKind) ||
      !storedString(source.url) ||
      !storedString(episode.id)
    ) {
      return null
    }

    const rawCover = isRecord(episode.coverImage) ? episode.coverImage : null
    const coverImage =
      rawCover && storedString(rawCover.url)
        ? {
            url: storedString(rawCover.url),
            alt: storedString(rawCover.alt),
            width: storedNumber(rawCover.width),
            height: storedNumber(rawCover.height),
            caption: storedString(rawCover.caption) || undefined,
          }
        : null

    return {
      currentTime: storedNumber(parsed.currentTime),
      duration: storedNumber(parsed.duration),
      episode: {
        copy: {
          close: storedString(copy.close),
          mute: storedString(copy.mute),
          pause: storedString(copy.pause),
          play: storedString(copy.play),
          seek: storedString(copy.seek),
          unmute: storedString(copy.unmute),
        },
        coverImage,
        id: storedString(episode.id),
        showTitle: storedString(episode.showTitle),
        source: {
          kind: sourceKind as 'audio' | 'spotify' | 'youtube',
          url: storedString(source.url),
        },
        title: storedString(episode.title),
      },
      isMuted: Boolean(parsed.isMuted),
      isPlaying: Boolean(parsed.isPlaying),
      isReady: false,
    }
  } catch {
    return null
  }
}

interface GlobalEngineProps {
  enabled: boolean
  episode: PodcastPlayerEpisode
  playback: PodcastPlaybackState
  report: (patch: PlaybackPatch) => void
  setController: (controller: PodcastPlaybackController | null) => void
}

function GlobalYoutubeEngine({
  enabled,
  episode,
  playback,
  report,
  setController,
}: GlobalEngineProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YoutubePlayer | null>(null)
  const playbackRef = useRef(playback)
  const enabledRef = useRef(enabled)
  const playingRef = useRef(false)
  const videoId = extractYoutubeVideoId(episode.source.url)

  useEffect(() => {
    playbackRef.current = playback
    enabledRef.current = enabled
  }, [enabled, playback])

  useEffect(() => {
    if (!videoId || !containerRef.current) return

    let cancelled = false
    let player: YoutubePlayer | null = null

    void loadYoutubeApi().then((api) => {
      if (cancelled || !containerRef.current) return

      player = new api.Player(containerRef.current, {
        videoId,
        playerVars: {
          controls: 0,
          enablejsapi: 1,
          playsinline: 1,
          rel: 0,
        },
        events: {
          onReady: (event) => {
            playerRef.current = event.target
            event.target.getIframe().setAttribute('title', episode.title)
            const controller: PodcastPlaybackController = {
              getCurrentTime: () => event.target.getCurrentTime(),
              getDuration: () => event.target.getDuration(),
              getMuted: () => event.target.isMuted(),
              getPlaying: () => playingRef.current,
              pause: () => event.target.pauseVideo(),
              play: () => event.target.playVideo(),
              seekTo: (seconds) => event.target.seekTo(seconds, true),
              setMuted: (muted) =>
                muted ? event.target.mute() : event.target.unMute(),
            }
            setController(controller)
            controller.seekTo(playbackRef.current.currentTime)
            controller.setMuted(playbackRef.current.isMuted)
            report({
              duration: controller.getDuration(),
              isMuted: controller.getMuted(),
              isReady: true,
            })
            if (enabledRef.current && playbackRef.current.isPlaying) {
              controller.play()
            }
          },
          onStateChange: (event) => {
            playingRef.current =
              event.data === api.PlayerState.PLAYING ||
              event.data === api.PlayerState.BUFFERING
            report({
              currentTime: event.target.getCurrentTime(),
              duration: event.target.getDuration(),
              isPlaying: playingRef.current,
            })
          },
        },
      })
    })

    return () => {
      cancelled = true
      setController(null)
      playerRef.current = null
      player?.destroy()
    }
  }, [episode.id, episode.title, report, setController, videoId])

  useEffect(() => {
    const player = playerRef.current
    if (!player) return
    if (!enabled) {
      player.pauseVideo()
      return
    }

    const current = playbackRef.current
    player.seekTo(current.currentTime, true)
    if (current.isMuted) player.mute()
    else player.unMute()
    if (current.isPlaying) player.playVideo()
    else player.pauseVideo()
  }, [enabled, episode.id])

  useEffect(() => {
    if (!enabled) return
    const timer = window.setInterval(() => {
      const player = playerRef.current
      if (!player) return
      report({
        currentTime: player.getCurrentTime(),
        duration: player.getDuration(),
        isMuted: player.isMuted(),
        isPlaying: playingRef.current,
      })
    }, 500)
    return () => window.clearInterval(timer)
  }, [enabled, report])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed -left-[10000px] top-0 size-px overflow-hidden"
    >
      <div ref={containerRef} />
    </div>
  )
}

function GlobalAudioEngine({
  enabled,
  episode,
  playback,
  report,
  setController,
}: GlobalEngineProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const playbackRef = useRef(playback)
  const enabledRef = useRef(enabled)

  useEffect(() => {
    playbackRef.current = playback
    enabledRef.current = enabled
  }, [enabled, playback])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

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
      report({
        currentTime: controller.getCurrentTime(),
        duration: controller.getDuration(),
        isMuted: controller.getMuted(),
        isPlaying: controller.getPlaying(),
        isReady: audio.readyState > 0,
      })
    const handleLoaded = () => {
      controller.seekTo(playbackRef.current.currentTime)
      controller.setMuted(playbackRef.current.isMuted)
      sync()
      if (enabledRef.current && playbackRef.current.isPlaying) {
        controller.play()
      }
    }

    setController(controller)
    audio.addEventListener('loadedmetadata', handleLoaded)
    audio.addEventListener('pause', sync)
    audio.addEventListener('play', sync)
    audio.addEventListener('timeupdate', sync)
    audio.addEventListener('volumechange', sync)

    return () => {
      setController(null)
      audio.removeEventListener('loadedmetadata', handleLoaded)
      audio.removeEventListener('pause', sync)
      audio.removeEventListener('play', sync)
      audio.removeEventListener('timeupdate', sync)
      audio.removeEventListener('volumechange', sync)
    }
  }, [episode.id, report, setController])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (!enabled) {
      audio.pause()
      return
    }

    const current = playbackRef.current
    audio.currentTime = current.currentTime
    audio.muted = current.isMuted
    if (current.isPlaying) void audio.play()
    else audio.pause()
  }, [enabled, episode.id])

  return (
    <audio
      ref={audioRef}
      preload="metadata"
      src={episode.source.url}
      className="hidden"
    />
  )
}

/**
 * Spotify keeps the audio inside its iframe, so the off-screen embed has to
 * stay mounted for playback to survive navigation, exactly like the Youtube
 * engine. The IFrame API exposes no volume control, so muting is the one
 * control that cannot be wired up.
 */
function GlobalSpotifyEngine({
  enabled,
  episode,
  playback,
  report,
  setController,
}: GlobalEngineProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const controllerRef = useRef<SpotifyController | null>(null)
  const playbackRef = useRef(playback)
  const enabledRef = useRef(enabled)
  const uri = extractSpotifyUri(episode.source.url)

  useEffect(() => {
    playbackRef.current = playback
    enabledRef.current = enabled
  }, [enabled, playback])

  useEffect(() => {
    if (!uri || !containerRef.current) return

    let cancelled = false
    let spotifyController: SpotifyController | null = null
    let position = 0
    let duration = 0
    let paused = true

    void loadSpotifyApi().then((api) => {
      if (cancelled || !containerRef.current) return

      api.createController(
        containerRef.current,
        { height: SPOTIFY_ENGINE_SIZE, uri, width: SPOTIFY_ENGINE_SIZE },
        (created) => {
          if (cancelled) {
            created.destroy()
            return
          }

          spotifyController = created
          controllerRef.current = created

          const controller: PodcastPlaybackController = {
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
            paused = event.data?.isPaused ?? true
            report({
              currentTime: position,
              duration,
              isPlaying: !paused,
              isReady: duration > 0,
            })
          })

          setController(controller)
          if (playbackRef.current.currentTime > 0) {
            created.seek(playbackRef.current.currentTime)
          }
          if (enabledRef.current && playbackRef.current.isPlaying) {
            created.resume()
          }
        }
      )
    })

    return () => {
      cancelled = true
      setController(null)
      controllerRef.current = null
      spotifyController?.destroy()
    }
  }, [episode.id, report, setController, uri])

  useEffect(() => {
    const controller = controllerRef.current
    if (!controller) return

    if (!enabled) {
      controller.pause()
      return
    }

    const current = playbackRef.current
    if (current.currentTime > 0) controller.seek(current.currentTime)
    if (current.isPlaying) controller.resume()
    else controller.pause()
  }, [enabled, episode.id])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed -left-[10000px] top-0 size-px overflow-hidden"
    >
      <div ref={containerRef} />
    </div>
  )
}

function GlobalEngine(props: GlobalEngineProps) {
  if (props.episode.source.kind === 'youtube') {
    return <GlobalYoutubeEngine {...props} />
  }

  return props.episode.source.kind === 'spotify' ? (
    <GlobalSpotifyEngine {...props} />
  ) : (
    <GlobalAudioEngine {...props} />
  )
}

export function PodcastPlayerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PodcastPlaybackState>(EMPTY_STATE)
  const [localEpisodeId, setLocalEpisodeId] = useState<string | null>(null)
  const [activeVisible, setActiveVisible] = useState(false)
  const stateRef = useRef(state)
  const localEpisodeIdRef = useRef(localEpisodeId)
  const activeVisibleRef = useRef(activeVisible)
  const registrationsRef = useRef(new Map<string, Registration>())
  const visibleRef = useRef(new Map<string, boolean>())
  const globalControllerRef = useRef<PodcastPlaybackController | null>(null)

  useEffect(() => {
    const stored = readStoredPlayback()
    if (stored) {
      stateRef.current = stored
      setState(stored)
    }
  }, [])

  useEffect(() => {
    if (!state.episode) return
    try {
      window.sessionStorage.setItem(
        PLAYER_STORAGE_KEY,
        JSON.stringify({ ...state, isReady: false })
      )
    } catch {
      return
    }
  }, [state])

  const updateState = useCallback(
    (
      update:
        | PodcastPlaybackState
        | ((current: PodcastPlaybackState) => PodcastPlaybackState)
    ) => {
      setState((current) => {
        const next = typeof update === 'function' ? update(current) : update
        stateRef.current = next
        return next
      })
    },
    []
  )

  const updateLocalEpisodeId = useCallback((episodeId: string | null) => {
    localEpisodeIdRef.current = episodeId
    setLocalEpisodeId(episodeId)
  }, [])

  const updateActiveVisible = useCallback((visible: boolean) => {
    activeVisibleRef.current = visible
    setActiveVisible(visible)
  }, [])

  const activeController = useCallback(() => {
    const episodeId = stateRef.current.episode?.id
    if (!episodeId) return null
    if (localEpisodeIdRef.current === episodeId && activeVisibleRef.current) {
      return registrationsRef.current.get(episodeId)?.controller ?? null
    }
    return globalControllerRef.current
  }, [])

  const activateEpisode = useCallback(
    (episodeId: string) => {
      const registration = registrationsRef.current.get(episodeId)
      if (!registration) return

      const previousEpisodeId = stateRef.current.episode?.id
      const previousController = activeController()
      const sameEpisode = previousEpisodeId === episodeId
      const controller = registration.controller

      if (
        sameEpisode &&
        localEpisodeIdRef.current === episodeId &&
        activeVisibleRef.current &&
        previousController === controller
      ) {
        updateState((current) => ({
          ...current,
          ...playbackPatch(controller),
          episode: registration.episode,
          isReady: true,
        }))
        return
      }

      const nextTime = sameEpisode
        ? stateRef.current.currentTime
        : controller.getCurrentTime()
      const nextDuration = controller.getDuration()
      const nextPlaying = sameEpisode
        ? stateRef.current.isPlaying
        : controller.getPlaying()
      const nextMuted = sameEpisode
        ? stateRef.current.isMuted
        : controller.getMuted()

      updateState({
        currentTime: nextTime,
        duration: nextDuration,
        episode: registration.episode,
        isMuted: nextMuted,
        isPlaying: nextPlaying,
        isReady: true,
      })
      updateLocalEpisodeId(episodeId)
      const isVisible = visibleRef.current.get(episodeId) ?? false
      updateActiveVisible(isVisible)

      if (previousController && previousController !== controller) {
        previousController.pause()
      }
      globalControllerRef.current?.pause()
      controller.seekTo(nextTime)
      controller.setMuted(isVisible ? nextMuted : true)
      if (nextPlaying && !controller.getPlaying()) controller.play()
    },
    [activeController, updateActiveVisible, updateLocalEpisodeId, updateState]
  )

  const registerEpisode = useCallback(
    (episode: PodcastPlayerEpisode, controller: PodcastPlaybackController) => {
      registrationsRef.current.set(episode.id, { controller, episode })
      const current = stateRef.current
      if (
        !current.episode ||
        current.episode.id === episode.id ||
        !current.isPlaying
      ) {
        activateEpisode(episode.id)
      }
    },
    [activateEpisode]
  )

  const unregisterEpisode = useCallback(
    (episodeId: string, controller: PodcastPlaybackController) => {
      const registration = registrationsRef.current.get(episodeId)
      if (registration?.controller !== controller) return
      registrationsRef.current.delete(episodeId)

      if (
        stateRef.current.episode?.id === episodeId &&
        localEpisodeIdRef.current === episodeId
      ) {
        const active = activeVisibleRef.current
          ? controller
          : (globalControllerRef.current ?? controller)
        const snapshot = playbackPatch(active)
        updateLocalEpisodeId(null)
        updateActiveVisible(false)
        updateState((current) => ({
          ...current,
          ...snapshot,
          isReady: false,
        }))
        controller.setMuted(true)
        controller.pause()
      }
    },
    [updateActiveVisible, updateLocalEpisodeId, updateState]
  )

  const reportEpisode = useCallback(
    (episodeId: string, patch: PlaybackPatch) => {
      if (
        stateRef.current.episode?.id !== episodeId ||
        localEpisodeIdRef.current !== episodeId ||
        !activeVisibleRef.current
      ) {
        return
      }
      updateState((current) => ({ ...current, ...patch }))
    },
    [updateState]
  )

  const setEpisodeVisible = useCallback(
    (episodeId: string, visible: boolean) => {
      visibleRef.current.set(episodeId, visible)
      if (
        stateRef.current.episode?.id !== episodeId ||
        activeVisibleRef.current === visible
      ) {
        return
      }

      const local = registrationsRef.current.get(episodeId)?.controller
      const global = globalControllerRef.current
      const active = visible ? global : local
      const snapshot = active ? playbackPatch(active) : null

      updateActiveVisible(visible)
      if (!local) return

      if (visible) {
        if (snapshot) {
          local.seekTo(snapshot.currentTime)
          if (snapshot.isPlaying) {
            local.setMuted(true)
            if (!local.getPlaying()) local.play()
          }
          local.setMuted(snapshot.isMuted)
          updateState((current) => ({
            ...current,
            ...snapshot,
            isReady: true,
          }))
        } else {
          local.setMuted(stateRef.current.isMuted)
        }
        return
      }

      local.setMuted(true)
      updateState((current) => ({
        ...current,
        ...(snapshot ?? {}),
        isReady: global !== null,
      }))
    },
    [updateActiveVisible, updateState]
  )

  const toggleEpisode = useCallback(
    (episodeId: string) => {
      if (stateRef.current.episode?.id !== episodeId) {
        activateEpisode(episodeId)
        const controller = registrationsRef.current.get(episodeId)?.controller
        controller?.play()
        updateState((current) => ({ ...current, isPlaying: true }))
        return
      }

      const controller = activeController()
      if (!controller) return
      const local = registrationsRef.current.get(episodeId)?.controller
      if (stateRef.current.isPlaying) {
        controller.pause()
        if (local && local !== controller) local.pause()
      } else {
        if (local && local !== controller) {
          local.seekTo(stateRef.current.currentTime)
          local.setMuted(true)
          local.play()
        }
        controller.play()
      }
      updateState((current) => ({
        ...current,
        isPlaying: !current.isPlaying,
      }))
    },
    [activateEpisode, activeController, updateState]
  )

  const seekEpisode = useCallback(
    (episodeId: string, seconds: number) => {
      if (stateRef.current.episode?.id !== episodeId) {
        activateEpisode(episodeId)
      }
      const nextTime = clampTime(seconds, stateRef.current.duration)
      const controller = activeController()
      controller?.seekTo(nextTime)
      const local = registrationsRef.current.get(episodeId)?.controller
      if (local && local !== controller) local.seekTo(nextTime)
      updateState((current) => ({ ...current, currentTime: nextTime }))
    },
    [activateEpisode, activeController, updateState]
  )

  const toggleMuted = useCallback(() => {
    const muted = !stateRef.current.isMuted
    activeController()?.setMuted(muted)
    updateState((current) => ({ ...current, isMuted: muted }))
  }, [activeController, updateState])

  const close = useCallback(() => {
    activeController()?.pause()
    globalControllerRef.current?.pause()
    updateLocalEpisodeId(null)
    updateActiveVisible(false)
    updateState(EMPTY_STATE)
    try {
      window.sessionStorage.removeItem(PLAYER_STORAGE_KEY)
    } catch {
      return
    }
  }, [activeController, updateActiveVisible, updateLocalEpisodeId, updateState])

  const setGlobalController = useCallback(
    (controller: PodcastPlaybackController | null) => {
      globalControllerRef.current = controller
      const episodeId = stateRef.current.episode?.id
      if (
        episodeId &&
        (localEpisodeIdRef.current !== episodeId || !activeVisibleRef.current)
      ) {
        updateState((current) => ({
          ...current,
          isReady: controller !== null,
        }))
      }
    },
    [updateState]
  )

  const reportGlobal = useCallback(
    (patch: PlaybackPatch) => {
      const episodeId = stateRef.current.episode?.id
      if (
        !episodeId ||
        (localEpisodeIdRef.current === episodeId && activeVisibleRef.current)
      ) {
        return
      }
      updateState((current) => ({ ...current, ...patch }))
    },
    [updateState]
  )

  const value = useMemo<PodcastPlayerContextValue>(
    () => ({
      activateEpisode,
      close,
      registerEpisode,
      reportEpisode,
      seekEpisode,
      setEpisodeVisible,
      state,
      toggleEpisode,
      toggleMuted,
      unregisterEpisode,
    }),
    [
      activateEpisode,
      close,
      registerEpisode,
      reportEpisode,
      seekEpisode,
      setEpisodeVisible,
      state,
      toggleEpisode,
      toggleMuted,
      unregisterEpisode,
    ]
  )

  const episode = state.episode
  const globalEnabled = Boolean(
    episode && (!activeVisible || localEpisodeId !== episode.id)
  )
  const showStickyPlayer = Boolean(
    episode && (!activeVisible || localEpisodeId !== episode.id)
  )

  return (
    <PodcastPlayerContext.Provider value={value}>
      {children}
      {episode ? (
        <GlobalEngine
          key={`${episode.id}-${episode.source.kind}`}
          enabled={globalEnabled}
          episode={episode}
          playback={state}
          report={reportGlobal}
          setController={setGlobalController}
        />
      ) : null}
      {episode && showStickyPlayer ? (
        <StickyPodcastPlayer
          close={close}
          episode={episode}
          seekEpisode={seekEpisode}
          state={state}
          toggleEpisode={toggleEpisode}
          toggleMuted={toggleMuted}
        />
      ) : null}
    </PodcastPlayerContext.Provider>
  )
}

function StickyPodcastPlayer({
  close,
  episode,
  seekEpisode,
  state,
  toggleEpisode,
  toggleMuted,
}: {
  close: () => void
  episode: PodcastPlayerEpisode
  seekEpisode: (episodeId: string, seconds: number) => void
  state: PodcastPlaybackState
  toggleEpisode: (episodeId: string) => void
  toggleMuted: () => void
}) {
  const duration = state.duration || 0

  return (
    <div
      data-testid="podcast-sticky-player"
      className="fixed inset-x-0 bottom-0 z-40 h-20 border-t border-brand-dark-green bg-accent-tan px-4 py-[10px] text-brand-dark-green md:py-[14px]"
    >
      <div className="mx-auto flex h-full max-w-[1100px] items-center gap-4">
        <button
          type="button"
          aria-label={state.isPlaying ? episode.copy.pause : episode.copy.play}
          className="flex size-8 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent"
          disabled={!state.isReady}
          onClick={() => toggleEpisode(episode.id)}
        >
          {state.isPlaying ? (
            <Pause aria-hidden="true" size={16} fill="currentColor" />
          ) : (
            <Play aria-hidden="true" size={16} fill="currentColor" />
          )}
        </button>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 md:hidden">
              <p className="truncate font-sans text-[12px] leading-4">
                {episode.title}
              </p>
              <p className="truncate font-sans text-[10px] leading-4">
                {episode.showTitle}
              </p>
            </div>
            <p className="hidden shrink-0 font-sans text-[12px] leading-4 sm:block">
              {formatPlaybackTime(state.currentTime)} /{' '}
              {formatPlaybackTime(duration)}
            </p>
          </div>
          <input
            aria-label={episode.copy.seek}
            className="media-player-range h-2 w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!state.isReady}
            max={duration}
            min={0}
            onChange={(event) =>
              seekEpisode(episode.id, Number(event.target.value))
            }
            step={1}
            type="range"
            value={Math.min(state.currentTime, duration || state.currentTime)}
          />
        </div>

        <button
          type="button"
          aria-label={state.isMuted ? episode.copy.unmute : episode.copy.mute}
          className="hidden size-8 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent sm:flex"
          onClick={toggleMuted}
        >
          {state.isMuted ? (
            <VolumeX aria-hidden="true" size={16} />
          ) : (
            <Volume2 aria-hidden="true" size={16} />
          )}
        </button>

        <div className="hidden min-w-0 items-center gap-4 md:flex">
          {episode.coverImage ? (
            <Image
              src={episode.coverImage.url}
              alt={episode.coverImage.alt}
              width={48}
              height={48}
              className="size-12 object-cover"
            />
          ) : null}
          <div className="w-48 min-w-0">
            <p className="truncate font-display text-[14px] leading-5">
              {episode.title}
            </p>
            <p className="truncate font-sans text-[12px] leading-4">
              {episode.showTitle}
            </p>
          </div>
        </div>

        <button
          type="button"
          aria-label={episode.copy.close}
          className="flex size-8 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent"
          onClick={close}
        >
          <X aria-hidden="true" size={16} />
        </button>
      </div>
    </div>
  )
}

export function PodcastInlinePlayerControls({
  episodeId,
  playLabel,
}: {
  episodeId: string
  playLabel: string
}) {
  const player = usePodcastPlayer()
  const active = player.state.episode?.id === episodeId
  const episode = active ? player.state.episode : null
  const duration = active ? player.state.duration : 0

  if (!episode) {
    return (
      <button
        type="button"
        aria-label={playLabel}
        className="flex size-10 cursor-pointer items-center justify-center rounded-full border border-white bg-black/30 text-white"
        onClick={() => player.toggleEpisode(episodeId)}
      >
        <Play aria-hidden="true" size={20} fill="currentColor" />
      </button>
    )
  }

  return (
    <div className="flex w-full flex-col gap-3 text-white">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          aria-label={
            player.state.isPlaying ? episode.copy.pause : episode.copy.play
          }
          className="flex size-8 cursor-pointer items-center justify-center border-0 bg-transparent"
          onClick={() => player.toggleEpisode(episodeId)}
        >
          {player.state.isPlaying ? (
            <Pause aria-hidden="true" size={24} fill="currentColor" />
          ) : (
            <Play aria-hidden="true" size={24} fill="currentColor" />
          )}
        </button>
        <p className="font-sans text-[12px] leading-4">
          {formatPlaybackTime(player.state.currentTime)} /{' '}
          {formatPlaybackTime(duration)}
        </p>
        <button
          type="button"
          aria-label={
            player.state.isMuted ? episode.copy.unmute : episode.copy.mute
          }
          className="flex size-8 cursor-pointer items-center justify-center border-0 bg-transparent"
          onClick={player.toggleMuted}
        >
          {player.state.isMuted ? (
            <VolumeX aria-hidden="true" size={20} />
          ) : (
            <Volume2 aria-hidden="true" size={20} />
          )}
        </button>
      </div>
      <input
        aria-label={episode.copy.seek}
        className="media-player-range media-player-range-light h-2 w-full cursor-pointer"
        max={duration}
        min={0}
        onChange={(event) =>
          player.seekEpisode(episodeId, Number(event.target.value))
        }
        step={1}
        type="range"
        value={Math.min(
          player.state.currentTime,
          duration || player.state.currentTime
        )}
      />
    </div>
  )
}

export function usePodcastPlayer(): PodcastPlayerContextValue {
  const context = useContext(PodcastPlayerContext)
  if (!context) {
    throw new Error(
      'usePodcastPlayer must be used within PodcastPlayerProvider'
    )
  }
  return context
}
