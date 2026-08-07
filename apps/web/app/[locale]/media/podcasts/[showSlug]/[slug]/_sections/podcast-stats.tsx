'use client'

import { usePodcastPlayer } from '../../../../_components/podcast-player-context'

interface PodcastStatsProps {
  date: string
  episodeId: string
  minutesLabel: string
}

export function PodcastStats({
  date,
  episodeId,
  minutesLabel,
}: PodcastStatsProps) {
  const { state } = usePodcastPlayer()
  const duration = state.episode?.id === episodeId ? state.duration : 0
  const minutes = duration ? Math.round(duration / 60) : 0

  return (
    <div className="mt-8 flex flex-wrap items-center gap-2 font-sans text-[12px] leading-4 text-brand-dark-green max-sm:mt-6">
      {minutes > 0 ? (
        <>
          <span>
            {minutes} {minutesLabel}
          </span>
          <span aria-hidden="true">•</span>
        </>
      ) : null}
      <span>{date}</span>
    </div>
  )
}
