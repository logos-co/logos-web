import { ExternalLink } from 'lucide-react'

import { LogosMark } from '@acid-info/logos-ui'

import ContentWidth from '@/components/layout/content-width'
import type {
  ActiveCircleLocation,
  ActiveCircleStat,
} from '@/lib/active-circles'
import { ACTIVE_CIRCLES_DAYS } from '@/lib/active-circles'

type ActiveCirclesPageViewProps = {
  activeSinceDate: string
  activeLocations: ActiveCircleLocation[]
  stats: ActiveCircleStat[]
}

function formatStatValue(value: number | null) {
  return value === null ? 'N/A' : value.toLocaleString()
}

function StatCard({ stat }: { stat: ActiveCircleStat }) {
  return (
    <div className="flex min-h-[154px] flex-col justify-between rounded-[24px] border border-brand-dark-green/20 bg-brand-off-white p-4 text-brand-dark-green transition-colors md:min-h-[180px] md:p-5">
      <p className="font-display text-[56px] leading-none md:text-[72px]">
        {formatStatValue(stat.value)}
      </p>
      <p className="text-eyebrow max-w-[140px]">{stat.label}</p>
    </div>
  )
}

function SectionHeader({
  title,
  eyebrow,
}: {
  title: string
  eyebrow?: string
}) {
  return (
    <ContentWidth className="grid gap-3 px-3 py-10 md:grid-cols-12">
      <h2 className="text-h3-serif text-brand-dark-green md:col-span-4">
        {title}
      </h2>
      {eyebrow ? (
        <p className="text-mono-s text-brand-dark-green/70 md:col-span-3 md:col-start-7 md:w-[226px]">
          {eyebrow}
        </p>
      ) : null}
    </ContentWidth>
  )
}

function LocationLink({ location }: { location: ActiveCircleLocation }) {
  const content = (
    <>
      <span className="truncate">{location.label}</span>
      {location.href ? (
        <ExternalLink aria-hidden="true" className="size-3 shrink-0" />
      ) : null}
    </>
  )

  const className =
    'group flex min-h-[48px] items-center justify-between gap-3 rounded-[12px] border border-brand-dark-green/15 bg-brand-off-white px-3 py-2 text-left text-brand-dark-green transition-colors hover:border-brand-dark-green/30 hover:bg-brand-yellow'

  if (location.href) {
    return (
      <a
        href={location.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {content}
      </a>
    )
  }

  return <div className={className}>{content}</div>
}

function ActiveCirclesHero({ activeSinceDate }: { activeSinceDate: string }) {
  return (
    <section className="relative overflow-hidden bg-brand-dark-green px-3 pt-20 text-brand-off-white md:pt-28">
      <div className="absolute left-3 top-6 flex size-[48px] items-center justify-center rounded-full border border-brand-off-white/30 md:left-1/2 md:-translate-x-1/2">
        <LogosMark size={17} />
      </div>
      <ContentWidth className="grid min-h-[430px] grid-cols-2 gap-3 pb-12 md:min-h-[520px] md:grid-cols-12 md:pb-16">
        <p className="text-mono-s col-span-1 mt-28 max-w-[178px] text-brand-off-white/70 md:col-span-2 md:mt-16">
          Active in the last {ACTIVE_CIRCLES_DAYS} days, measured from{' '}
          {activeSinceDate}.
        </p>
        <div className="col-span-2 self-end md:col-span-8 md:col-start-3 md:self-center">
          <h1 className="text-h1 text-center text-brand-off-white">
            Active Circles
          </h1>
          <p className="text-mono-s mx-auto mt-6 max-w-[420px] text-center text-brand-off-white/70">
            Circles and contributions across the Logos network.
          </p>
        </div>
        <p className="text-mono-s col-start-2 row-start-1 mt-28 max-w-[178px] text-brand-off-white/70 md:col-span-2 md:col-start-11 md:mt-16">
          Live event data from Logos Circle sources.
        </p>
      </ContentWidth>
    </section>
  )
}

function StatsSection({ stats }: { stats: ActiveCircleStat[] }) {
  return (
    <section className="bg-brand-off-white">
      <SectionHeader
        title="Overview"
        eyebrow="A compact snapshot of circle activity and geographic reach."
      />
      <ContentWidth className="grid gap-3 px-3 pb-12 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </ContentWidth>
    </section>
  )
}

function LocationsSection({
  locations,
}: {
  locations: ActiveCircleLocation[]
}) {
  return (
    <section className="border-t border-brand-dark-green/10 bg-gray-01 pb-16">
      <SectionHeader
        title="Active Circles"
        eyebrow={`${locations.length.toLocaleString()} locations`}
      />
      {locations.length === 0 ? (
        <p className="text-mono-s px-3 pb-12 text-brand-dark-green">
          No active circles found.
        </p>
      ) : (
        <ContentWidth className="grid gap-3 px-3 sm:grid-cols-2 lg:grid-cols-4">
          {locations.map((location) => (
            <LocationLink key={location.label} location={location} />
          ))}
        </ContentWidth>
      )}
    </section>
  )
}

export default function ActiveCirclesPageView({
  activeSinceDate,
  activeLocations,
  stats,
}: ActiveCirclesPageViewProps) {
  return (
    <>
      <ActiveCirclesHero activeSinceDate={activeSinceDate} />
      <StatsSection stats={stats} />
      <LocationsSection locations={activeLocations} />
    </>
  )
}
