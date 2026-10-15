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
      {day.pillEvents.length > 0 ? (
        <span className="flex min-h-0 w-full flex-1 flex-col gap-1 overflow-y-auto pr-1">
          {day.pillEvents.map((event) => (
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

const MOBILE_DAY_BASE =
  'flex shrink-0 snap-center flex-col justify-between rounded-xl p-2 text-brand-dark-green'
const MOBILE_DAY_SELECTED = 'min-h-[301px] w-[273px] bg-accent-light-blue'
const MOBILE_DAY_IDLE =
  'h-[301px] w-[192px] border border-brand-dark-green/50 transition-colors hover:bg-[#c7f3ff]'

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
  const selectedRef = useRef<HTMLDivElement & HTMLButtonElement>(null)
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
        const isSelected = day.key === selectedKey

        // With a details panel every day stays a button, so tapping one keeps
        // keyboard focus on it. Without one, the selected day becomes a card
        // whose event pills are links, which can't sit inside a button.
        if (isSelected && !hasDetailsPanel) {
          return (
            <div
              key={day.key}
              ref={selectedRef}
              className={cn(MOBILE_DAY_BASE, MOBILE_DAY_SELECTED)}
            >
              <DayNumber value={day.dayNumber} />
              {day.pillEvents.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {day.pillEvents.map((event) => (
                    <EventPill key={event.id} event={event} />
                  ))}
                </div>
              ) : null}
            </div>
          )
        }

        return (
          <button
            key={day.key}
            ref={isSelected ? selectedRef : undefined}
            type="button"
            aria-pressed={hasDetailsPanel ? isSelected : undefined}
            onClick={() => onSelect(day.key)}
            className={cn(
              MOBILE_DAY_BASE,
              'cursor-pointer text-left',
              isSelected ? MOBILE_DAY_SELECTED : MOBILE_DAY_IDLE
            )}
          >
            <DayNumber value={day.dayNumber} />
            {day.pillEvents.length > 0 ? (
              <span className="flex w-full flex-col gap-1">
                {day.pillEvents.map((event) => (
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
