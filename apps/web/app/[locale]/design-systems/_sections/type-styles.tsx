/**
 * Type Styles specimen — 1:1 mirror of Figma node 40009046:20537.
 * Used only by the `/design-systems` showcase page.
 *
 * Font substitution note: Figma uses commercial families (Rhymes Display /
 * Scto Grotesk A) that we do not ship. The page falls back to `--font-sans`
 * (Public Sans) and `--font-display` (serif fallback) until licensed woff2s
 * are dropped in.
 */
import type { CSSProperties, ReactNode } from 'react'

type TypeRow = {
  label: ReactNode
  desktopClass: string
  desktopStyle?: CSSProperties
  mobileClass: string
  mobileStyle?: CSSProperties
  desktopMeta: [string, string, string, string, string]
  mobileMeta: [string, string, string, string, string]
  sameAsDesktop?: boolean
  specimenLeading: string
  sample: string
}

const typeRows: TypeRow[] = [
  {
    label: 'Hero',
    specimenLeading: 'leading-none',
    desktopClass: 'font-display',
    desktopStyle: { fontSize: 140, letterSpacing: '-0.04em' },
    mobileClass: 'font-display',
    mobileStyle: { fontSize: 70, letterSpacing: '-0.04em' },
    desktopMeta: ['Rhymes Display', 'Regular', '140 pt.', '100%', '-4%'],
    mobileMeta: ['Rhymes Display', 'Regular', '70 pt.', '100%', '-4%'],
    sample: 'Pioneer',
  },
  {
    label: 'H1',
    specimenLeading: 'leading-[0.98]',
    desktopClass: 'font-display',
    desktopStyle: { fontSize: 96, letterSpacing: '-0.04em' },
    mobileClass: 'font-display',
    mobileStyle: { fontSize: 56, letterSpacing: '-0.04em' },
    desktopMeta: ['Rhymes Display', 'Regular', '96 pt.', '98%', '-4%'],
    mobileMeta: ['Rhymes Display', 'Regular', '56 pt.', '98%', '-4%'],
    sample: 'Pioneer',
  },
  {
    label: 'H2',
    specimenLeading: 'leading-none',
    desktopClass: 'font-display',
    desktopStyle: { fontSize: 56, letterSpacing: '-0.03em' },
    mobileClass: 'font-display',
    mobileStyle: { fontSize: 40, letterSpacing: '-0.03em' },
    desktopMeta: ['Rhymes Display', 'Regular', '56 pt.', '100%', '-3%'],
    mobileMeta: ['Rhymes Display', 'Regular', '40 pt.', '100%', '-3%'],
    sample: 'Pioneer',
  },
  {
    label: 'H3 Serif',
    specimenLeading: 'leading-none',
    desktopClass: 'font-display',
    desktopStyle: { fontSize: 36, letterSpacing: '-0.03em' },
    mobileClass: 'font-display',
    mobileStyle: { fontSize: 30, letterSpacing: '-0.03em' },
    desktopMeta: ['Rhymes Display', 'Regular', '36 pt.', '100%', '-3%'],
    mobileMeta: ['Rhymes Display', 'Regular', '30 pt.', '100%', '-3%'],
    sample: 'Pioneer',
  },
  {
    label: 'H3 Sans',
    specimenLeading: 'leading-none',
    desktopClass: 'font-sans',
    desktopStyle: { fontSize: 36, letterSpacing: '-0.02em' },
    mobileClass: 'font-sans',
    mobileStyle: { fontSize: 30, letterSpacing: '-0.02em' },
    desktopMeta: ['Public Sans', 'Regular', '36 pt.', '100%', '-2%'],
    mobileMeta: ['Public Sans', 'Regular', '30 pt.', '100%', '-2%'],
    sample: 'Pioneer',
  },
  {
    label: 'H4 Serif',
    specimenLeading: 'leading-[1.1]',
    desktopClass: 'font-display',
    desktopStyle: { fontSize: 24, letterSpacing: '-0.01em' },
    mobileClass: 'font-display',
    mobileStyle: { fontSize: 24, letterSpacing: '-0.01em' },
    desktopMeta: ['Rhymes Display', 'Regular', '24 pt.', '110%', '-1%'],
    mobileMeta: ['Rhymes Display', 'Regular', '24 pt.', '110%', '-1%'],
    sameAsDesktop: true,
    sample: 'Pioneer',
  },
  {
    label: 'H4 Sans',
    specimenLeading: 'leading-[1.1]',
    desktopClass: 'font-sans',
    desktopStyle: { fontSize: 24, letterSpacing: '-0.01em' },
    mobileClass: 'font-sans',
    mobileStyle: { fontSize: 24, letterSpacing: '-0.01em' },
    desktopMeta: ['Public Sans', 'Regular', '24 pt.', '110%', '-1%'],
    mobileMeta: ['Public Sans', 'Regular', '24 pt.', '110%', '-1%'],
    sameAsDesktop: true,
    sample: 'Pioneer',
  },
  {
    label: (
      <>
        Subhead
        <br />
        Serif
      </>
    ),
    specimenLeading: 'leading-[1.1]',
    desktopClass: 'font-display',
    desktopStyle: { fontSize: 18, letterSpacing: '-0.01em' },
    mobileClass: 'font-display',
    mobileStyle: { fontSize: 18, letterSpacing: '-0.01em' },
    desktopMeta: ['Rhymes Display', 'Regular', '18 pt.', '110%', '-1%'],
    mobileMeta: ['Rhymes Display', 'Regular', '18 pt.', '110%', '-1%'],
    sameAsDesktop: true,
    sample: 'Pioneer',
  },
  {
    label: (
      <>
        Subhead
        <br />
        Sans
      </>
    ),
    specimenLeading: 'leading-[1.15]',
    desktopClass: 'font-sans',
    desktopStyle: { fontSize: 18, letterSpacing: '-0.01em' },
    mobileClass: 'font-sans',
    mobileStyle: { fontSize: 18, letterSpacing: '-0.01em' },
    desktopMeta: ['Public Sans', 'Regular', '18 pt.', '115%', '-1%'],
    mobileMeta: ['Public Sans', 'Regular', '18 pt.', '115%', '-1%'],
    sameAsDesktop: true,
    sample: 'Pioneer',
  },
  {
    label: 'Body Serif',
    specimenLeading: 'leading-[1.2]',
    desktopClass: 'font-display',
    desktopStyle: { fontSize: 14, letterSpacing: '0' },
    mobileClass: 'font-display',
    mobileStyle: { fontSize: 14, letterSpacing: '0' },
    desktopMeta: ['Rhymes Display', 'Regular', '14 pt.', '120%', '0%'],
    mobileMeta: ['Rhymes Display', 'Regular', '14 pt.', '120%', '0%'],
    sameAsDesktop: true,
    sample: 'Pioneer',
  },
  {
    label: 'Body Sans',
    specimenLeading: 'leading-[1.2]',
    desktopClass: 'font-sans',
    desktopStyle: { fontSize: 14, letterSpacing: '0' },
    mobileClass: 'font-sans',
    mobileStyle: { fontSize: 14, letterSpacing: '0' },
    desktopMeta: ['Public Sans', 'Regular', '14 pt.', '120%', '0%'],
    mobileMeta: ['Public Sans', 'Regular', '14 pt.', '120%', '0%'],
    sameAsDesktop: true,
    sample: 'Pioneer',
  },
  {
    label: (
      <>
        Eyebrow /<br />
        CTA
      </>
    ),
    specimenLeading: 'leading-[1.3]',
    desktopClass: 'font-mono font-medium uppercase',
    desktopStyle: { fontSize: 10, letterSpacing: '0' },
    mobileClass: 'font-mono font-medium uppercase',
    mobileStyle: { fontSize: 10, letterSpacing: '0' },
    desktopMeta: ['Fira Code', 'Medium', '10 pt.', '130%', '0%'],
    mobileMeta: ['Fira Code', 'Medium', '10 pt.', '130%', '0%'],
    sameAsDesktop: true,
    sample: 'Pioneer',
  },
  {
    label: 'Mono S',
    specimenLeading: 'leading-[1.3]',
    desktopClass: 'font-mono',
    desktopStyle: { fontSize: 10, letterSpacing: '0' },
    mobileClass: 'font-mono',
    mobileStyle: { fontSize: 10, letterSpacing: '0' },
    desktopMeta: ['Fira Code', 'Regular', '10 pt.', '130%', '0%'],
    mobileMeta: ['Fira Code', 'Regular', '10 pt.', '130%', '0%'],
    sameAsDesktop: true,
    sample: 'Pioneer',
  },
]

function MetaBlock({
  lines,
}: {
  lines: [string, string, string, string, string]
}) {
  return (
    <div className="text-[16px] leading-[1.2] text-black opacity-50">
      {lines.map((line, i) => (
        <p key={i} className="leading-[1.2]">
          {line}
        </p>
      ))}
    </div>
  )
}

function SameAsDesktopTag() {
  return (
    <span className="inline-flex h-[24px] items-center justify-center rounded-full bg-brand-yellow px-[10px] text-[10px] font-medium leading-[1.3] text-black uppercase">
      Same as desktop
    </span>
  )
}

export function TypeStyles() {
  return (
    <div className="w-full overflow-hidden">
      <div className="overflow-x-auto">
        <div className="font-sans w-full border border-[rgba(0,0,0,0.5)] bg-white">
          {/* Header row */}
          <div className="flex flex-col gap-[12px] p-[19px] md:flex-row md:items-start md:gap-[20px]">
            <p className="text-[18px] leading-[1.2] text-black md:w-[15.5%] md:shrink-0">
              Logos Design System
            </p>
            <p className="text-[18px] leading-[1.2] text-black">
              Web Type Styles
            </p>
          </div>

          {/* Column labels + breakpoint scale — desktop only */}
          <div className="hidden items-start gap-[20px] px-[19px] md:flex">
            <div className="w-[15.5%] shrink-0" />
            <div className="flex-1">
              <div className="flex items-start gap-[20px] text-[16px] leading-[1.2] text-black">
                <div className="w-1/2">
                  <p>Desktop</p>
                  <p>∞-800 px Wide</p>
                </div>
                <div className="w-1/2">
                  <p>Mobile</p>
                  <p>800-0 px Wide</p>
                </div>
              </div>
              <div className="relative mt-[8px] h-[9px]">
                <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-black" />
                <span className="absolute top-0 left-0 block size-[9px] rounded-full border border-black bg-black" />
                <span className="absolute top-0 left-1/2 block size-[9px] -translate-x-1/2 rounded-full border border-black bg-black" />
                <span className="absolute top-0 right-0 block size-[9px] rounded-full border border-black bg-white" />
              </div>
            </div>
          </div>

          {/* Style Name label */}
          <p className="px-[19px] pt-[32px] text-[18px] leading-[1.2] text-black md:pt-[64px]">
            Style Name
          </p>

          {/* Rows */}
          <div className="flex flex-col px-[19px] pt-[16px]">
            {typeRows.map((row, i) => (
              <div
                key={i}
                className="flex flex-col items-start gap-[16px] border-t border-black pt-[16px] pb-[40px] md:flex-row md:justify-between md:gap-[20px] md:pb-[80px]"
              >
                <p className="w-full shrink-0 text-[24px] leading-[1.2] text-black md:w-[15.5%] md:text-[30px]">
                  {row.label}
                </p>

                <div className="flex w-full flex-1 flex-col gap-[24px]">
                  {/* Specimens */}
                  <div
                    className={`flex flex-col gap-[20px] md:flex-row md:items-baseline ${row.specimenLeading}`}
                  >
                    <div className="flex w-full flex-col gap-[8px] md:w-1/2">
                      <p className="text-[14px] leading-[1.2] text-black md:hidden">
                        Desktop
                      </p>
                      <p
                        className={`min-w-0 overflow-hidden ${row.desktopClass}`}
                        style={row.desktopStyle}
                      >
                        {row.sample}
                      </p>
                    </div>
                    <div className="flex w-full flex-col gap-[8px] md:w-1/2">
                      <p className="flex items-center gap-[10px] text-[14px] leading-[1.2] text-black md:hidden">
                        Mobile
                        {row.sameAsDesktop && <SameAsDesktopTag />}
                      </p>
                      <p
                        className={`min-w-0 overflow-hidden ${row.mobileClass}`}
                        style={row.mobileStyle}
                      >
                        {row.sample}
                      </p>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex flex-col gap-[20px] text-[16px] text-black md:flex-row md:items-start">
                    <div className="flex w-full flex-col gap-[5px] md:w-1/2">
                      <p className="leading-[1.2]">Desktop</p>
                      <MetaBlock lines={row.desktopMeta} />
                    </div>
                    <div className="flex w-full flex-col gap-[5px] md:w-1/2">
                      <div className="flex items-center gap-[10px]">
                        <p className="leading-[1.2]">Mobile</p>
                        {row.sameAsDesktop && (
                          <span className="hidden md:inline-flex">
                            <SameAsDesktopTag />
                          </span>
                        )}
                      </div>
                      <MetaBlock lines={row.mobileMeta} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
