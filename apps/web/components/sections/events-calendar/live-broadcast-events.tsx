'use client'

import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import type { BroadcastEventRow } from '@repo/content/calendar'

import ContentWidth from '@/components/layout/content-width'
import { getBroadcastEvents } from '@/lib/broadcast-events'

interface LiveBroadcastEventsProps {
  children: (events: BroadcastEventRow[]) => ReactNode
}

export function LiveBroadcastEvents({ children }: LiveBroadcastEventsProps) {
  const t = useTranslations('calendar')
  const { data, isPending, isError, isFetching, refetch } = useQuery({
    queryKey: ['broadcast-events'],
    queryFn: ({ signal }) => getBroadcastEvents(signal),
    staleTime: 60_000,
    refetchOnMount: 'always',
    refetchInterval: 60_000,
    retry: 1,
  })

  if (isPending || isError) {
    return (
      <ContentWidth className="py-10 text-brand-dark-green">
        <p role={isError ? 'alert' : 'status'}>
          {t(isError ? 'error' : 'loading')}
        </p>
        {isError ? (
          <button
            type="button"
            className="mt-3 cursor-pointer underline disabled:opacity-50"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            {t('retry')}
          </button>
        ) : null}
      </ContentWidth>
    )
  }

  return children(data)
}
