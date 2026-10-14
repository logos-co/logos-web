import { cn } from '@/lib/cn'

import { MONTHS } from './calendar-dates'

const SELECT_CLASS_NAME =
  'h-full w-full cursor-pointer appearance-none rounded-full border border-transparent bg-brand-off-white py-0 pl-6 pr-10 font-mono text-xs font-semibold uppercase leading-[1.35] text-brand-dark-green'

const ARROW_BUTTON_CLASS_NAME =
  'flex h-[31px] w-[39px] cursor-pointer items-center justify-center rounded-full border border-brand-dark-green/30 bg-brand-off-white font-mono text-[16px] leading-none'

function SelectChevron() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute right-4 top-1/2 h-2 w-3 -translate-y-1/2"
    >
      <span className="absolute left-0 top-[3px] h-[2px] w-[7px] rotate-45 rounded-full bg-brand-dark-green" />
      <span className="absolute right-0 top-[3px] h-[2px] w-[7px] -rotate-45 rounded-full bg-brand-dark-green" />
    </span>
  )
}

interface MonthSelectProps {
  value: number
  label: string
  onChange: (month: number) => void
  className?: string
}

export function MonthSelect({
  value,
  label,
  onChange,
  className,
}: MonthSelectProps) {
  return (
    <label className={cn('relative block h-[31px] w-[141px]', className)}>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={SELECT_CLASS_NAME}
      >
        {MONTHS.map((month, index) => (
          <option key={month} value={index}>
            {month.toUpperCase()}
          </option>
        ))}
      </select>
      <SelectChevron />
    </label>
  )
}

interface YearSelectProps {
  value: number
  years: number[]
  label: string
  onChange: (year: number) => void
  className?: string
}

export function YearSelect({
  value,
  years,
  label,
  onChange,
  className,
}: YearSelectProps) {
  return (
    <label className={cn('relative block h-[31px] w-[131px]', className)}>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={SELECT_CLASS_NAME}
      >
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
      <SelectChevron />
    </label>
  )
}

interface NavButtonsProps {
  onPrevious: () => void
  onToday: () => void
  onNext: () => void
  todayLabel: string
  className?: string
}

export function NavButtons({
  onPrevious,
  onToday,
  onNext,
  todayLabel,
  className,
}: NavButtonsProps) {
  return (
    <div className={cn('flex h-[31px] items-center gap-1', className)}>
      <button
        type="button"
        aria-label="Previous month"
        onClick={onPrevious}
        className={ARROW_BUTTON_CLASS_NAME}
      >
        ←
      </button>
      <button
        type="button"
        onClick={onToday}
        className="flex h-[31px] w-[54px] cursor-pointer items-center justify-center rounded-full border border-brand-dark-green/30 bg-brand-off-white font-mono text-xs font-semibold uppercase leading-[1.35]"
      >
        {todayLabel}
      </button>
      <button
        type="button"
        aria-label="Next month"
        onClick={onNext}
        className={ARROW_BUTTON_CLASS_NAME}
      >
        →
      </button>
    </div>
  )
}
