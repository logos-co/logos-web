/**
 * "Did people stop or move?" chart.
 *
 * A diverging bar chart: every row shares one scale with zero in the middle, so
 * the side a bar falls on carries the sign and its length carries the size.
 * That puts the section's argument in the shape of the chart — one bar leaving,
 * two arriving — and lets the three figures be compared against each other,
 * which side-by-side left-aligned bars cannot do.
 */
import type { CSSProperties } from 'react'

import { CHART } from '../_content'

import { TrendArrow } from './atoms'

/**
 * Chart greys are Figma's own values. The token ramp has near neighbours
 * (gray-01/04/06) but they carry the palette's green cast, which reads wrong
 * against the neutral hatch, so the design values are used verbatim.
 */
const HATCH_DARK = '#525252'
const HATCH_LIGHT = '#d9d9d9'
const TRACK = '#8a9290'

/** 7px of dark hatch every 12px, matching the bars drawn in Figma. */
const HATCHED_BAR: CSSProperties = {
  backgroundImage: `repeating-linear-gradient(90deg, ${HATCH_DARK} 0, ${HATCH_DARK} 7px, ${HATCH_LIGHT} 7px, ${HATCH_LIGHT} 12px)`,
}

/**
 * The rail behind the bars. Quiet on purpose: at full strength the half sitting
 * on the empty side of zero reads as a bar running the other way, which is the
 * one thing a diverging chart must not do. It stays the same grey, just dimmed
 * enough to read as a groove.
 */
const AXIS: CSSProperties = { backgroundColor: `${TRACK}33` }

/**
 * Each half of the track runs to 60%, so the largest bar stops short of the
 * edge instead of filling it — a bar that runs out of track reads as clipped
 * rather than as its own value. Raised automatically if the data ever outgrows
 * it, since a bar must never overflow the axis it is drawn on.
 */
const AXIS_MAX = Math.max(
  60,
  ...CHART.groups.flatMap((group) =>
    group.rows.map((row) => Math.abs(row.change))
  )
)

/** Half the track is one full `AXIS_MAX`, so every bar is on the same scale. */
const barWidth = (change: number): string =>
  `${((Math.abs(change) / AXIS_MAX) * 50).toFixed(2)}%`

const formatChange = (change: number): string =>
  `${change > 0 ? '+' : '−'}${Math.abs(change)}%`

export function SearchShiftChart() {
  return (
    <div className="flex w-full flex-col gap-8 bg-brand-dark-green p-6 text-brand-off-white md:gap-10 md:p-10">
      {CHART.groups.map((group, groupIndex) => (
        <div
          key={`${groupIndex}-${group.legend}`}
          className="flex w-full flex-col gap-5"
        >
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="size-2.5 shrink-0 bg-brand-yellow"
            />
            <p className="text-eyebrow font-normal leading-[1.15] tracking-[-0.01em]">
              {group.legend}
            </p>
          </div>

          <hr className="w-full border-t border-gray-04" />

          <div className="flex flex-col gap-5">
            {group.rows.map((row, rowIndex) => {
              const isLoss = row.change < 0

              return (
                <div
                  key={`${rowIndex}-${row.label}`}
                  className={`flex flex-col ${isLoss ? 'gap-5' : 'gap-2.5'}`}
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                    <p className="font-sans text-[14px] leading-[1.15] tracking-[-0.01em] md:text-[16px]">
                      {row.label}
                    </p>
                    <p className="flex shrink-0 items-center gap-3 font-sans text-[14px] leading-[1.15] tracking-[-0.01em] md:text-[16px]">
                      <TrendArrow direction={isLoss ? 'down' : 'up'} />
                      {formatChange(row.change)}
                    </p>
                  </div>

                  <div
                    className="relative h-[26px] w-full md:h-[33px]"
                    style={AXIS}
                  >
                    <div
                      className={`absolute inset-y-0 ${
                        isLoss ? 'right-1/2' : 'left-1/2 bg-brand-yellow'
                      }`}
                      style={{
                        width: barWidth(row.change),
                        ...(isLoss ? HATCHED_BAR : {}),
                      }}
                    />
                    {/*
                      Zero, drawn over the bars. It has to carry weight: it is
                      the only thing separating a bar from the rail behind it.
                    */}
                    <span
                      aria-hidden="true"
                      className="absolute -inset-y-1 left-1/2 w-0.5 -translate-x-1/2 bg-brand-off-white"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
