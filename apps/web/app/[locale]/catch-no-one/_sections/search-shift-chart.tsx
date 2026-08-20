/**
 * "Did people stop or move?" bar chart.
 *
 * Bar widths come from the Figma geometry (550/621 and 349/621 of the track)
 * and are expressed as percentages so the chart keeps its proportions at any
 * width. The first bar has no value to fill — it is a hatched track standing
 * for demand that left the compliant site.
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
const HATCHED_TRACK: CSSProperties = {
  backgroundImage: `repeating-linear-gradient(90deg, ${HATCH_DARK} 0, ${HATCH_DARK} 7px, ${HATCH_LIGHT} 7px, ${HATCH_LIGHT} 12px)`,
}

const SOLID_TRACK: CSSProperties = {
  backgroundColor: TRACK,
}

export function SearchShiftChart() {
  return (
    <div className="flex w-full flex-col gap-8 bg-brand-dark-green p-6 text-brand-off-white md:gap-10 md:p-10">
      {CHART.groups.map((group, groupIndex) => (
        <div key={`${groupIndex}-${group.legend}`} className="flex w-full flex-col gap-5">
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
            {group.rows.map((row, rowIndex) => (
              <div
                key={`${rowIndex}-${row.label}`}
                // Figma spaces the hatched bar 20px under its label and the
                // filled bars 10px under theirs.
                className={`flex flex-col ${row.fill === null ? 'gap-5' : 'gap-2.5'}`}
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                  <p className="font-sans text-[14px] leading-[1.15] tracking-[-0.01em] md:text-[16px]">
                    {row.label}
                  </p>
                  <p className="flex shrink-0 items-center gap-3 font-sans text-[14px] leading-[1.15] tracking-[-0.01em] md:text-[16px]">
                    <TrendArrow direction={row.direction} />
                    {row.value}
                  </p>
                </div>
                <div
                  className="h-[26px] w-full md:h-[33px]"
                  style={row.fill === null ? HATCHED_TRACK : SOLID_TRACK}
                >
                  {row.fill === null ? null : (
                    <div
                      className="h-full bg-brand-yellow"
                      style={{ width: `${(row.fill * 100).toFixed(2)}%` }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
