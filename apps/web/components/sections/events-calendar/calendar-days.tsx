import { useEffect, useRef } from 'react'

import { ExternalLink } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { BroadcastEventRow } from '@/lib/blog-engine'

import type { CalendarDay } from './calendar-dates'

export const HIDDEN_SCROLLBAR_STYLE = {
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
} as const

interface EventPillProps {
  event: BroadcastEventRow
  interactive?: boolean
}

function EventPill({ event, interactive = true }: EventPillProps) {
  const baseClassName =
    'block rounded-lg border border-brand-dark-green/50 p-2 font-mono text-xs font-medium uppercase leading-[1.3]'
  const content = <span className="line-clamp-2">{event.calendarTitle}</span>

  return interactive && event.link ? (
    <ExternalLink
      href={event.link}
      className={cn(
        baseClassName,
        'cursor-pointer transition-colors group-hover:bg-[#c7f3ff]'
      )}
    >
      {content}
    </ExternalLink>
  ) : (
    <span className={baseClassName}>{content}</span>
  )
}

function DayNumber({ value }: { value: string }) {
  return (
    <span className="flex w-full items-center justify-center p-1">
      <span className="flex-1 font-sans text-[14px] leading-[1.2]">
        {value}
      </span>
    </span>
  )
}

interface CalendarCellProps {
  day: CalendarDay
  isSelected?: boolean
  /** When set, the whole cell selects the day and event links move to the details panel. */
  onSelect?: (key: string) => void
}

export function CalendarCell({ day, isSelected, onSelect }: CalendarCellProps) {
  const className = cn(
    'group flex h-[132px] flex-col justify-between overflow-hidden rounded-xl border border-brand-dark-green/50 p-2 text-left text-brand-dark-green transition-colors hover:bg-[#c7f3ff]',
    !day.isCurrentMonth && 'opacity-30',
    isSelected && 'bg-accent-light-blue'
  )
  const content = (
    <>
      <DayNumber value={day.dayNumber} />
      {day.events.length > 0 ? (
        <span className="flex min-h-0 w-full flex-1 flex-col gap-1 overflow-y-auto pr-1">
          {day.events.map((event) => (
            <EventPill key={event.id} event={event} interactive={!onSelect} />
          ))}
        </span>
      ) : null}
    </>
  )

  if (!onSelect) return <div className={className}>{content}</div>

  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={() => onSelect(day.key)}
      className={cn(className, 'w-full cursor-pointer')}
    >
      {content}
    </button>
  )
}

interface MobileDayCarouselProps {
  days: CalendarDay[]
  selectedKey: string | null
  onSelect: (key: string) => void
  /** Keep event pills as plain labels when a details panel lists the links. */
  hasDetailsPanel?: boolean
}

export function MobileDayCarousel({
  days,
  selectedKey,
  onSelect,
  hasDetailsPanel = false,
}: MobileDayCarouselProps) {
  const selectedRef = useRef<HTMLDivElement>(null)
  const monthDays = days.filter((day) => day.isCurrentMonth)

  useEffect(() => {
    selectedRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  }, [selectedKey])

  return (
    <div
      className="-mx-3 mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3"
      style={HIDDEN_SCROLLBAR_STYLE}
    >
      {/* Spacers let the first and last day center within the viewport. */}
      <div aria-hidden className="w-[calc(50%-136px)] shrink-0" />
      {monthDays.map((day) => {
        if (day.key === selectedKey) {
          return (
            <div
              key={day.key}
              ref={selectedRef}
              className="flex min-h-[301px] w-[273px] shrink-0 snap-center flex-col justify-between rounded-xl bg-accent-light-blue p-2 text-brand-dark-green"
            >
              <DayNumber value={day.dayNumber} />
              {day.events.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {day.events.map((event) => (
                    <EventPill
                      key={event.id}
                      event={event}
                      interactive={!hasDetailsPanel}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          )
        }

        return (
          <button
            key={day.key}
            type="button"
            onClick={() => onSelect(day.key)}
            className="flex h-[301px] w-[192px] shrink-0 cursor-pointer snap-center flex-col justify-between rounded-xl border border-brand-dark-green/50 p-2 text-left text-brand-dark-green transition-colors hover:bg-[#c7f3ff]"
          >
            <DayNumber value={day.dayNumber} />
            {day.events.length > 0 ? (
              <span className="flex w-full flex-col gap-1">
                {day.events.map((event) => (
                  <EventPill key={event.id} event={event} interactive={false} />
                ))}
              </span>
            ) : null}
          </button>
        )
      })}
      <div aria-hidden className="w-[calc(50%-136px)] shrink-0" />
    </div>
  )
}
