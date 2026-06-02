import Image from 'next/image'

import type { BuilderHubSettings } from '@repo/content/schemas'

import { Button } from '@/components/ui'

type ActionPanel = BuilderHubSettings['actionPanels'][number]
type OfficeHours = NonNullable<BuilderHubSettings['officeHours']>

type Props = {
  panels: ActionPanel[]
  officeHours?: OfficeHours
}

/**
 * Action panels row on the Builders Hub home (Figma 40009046:24159 desktop,
 * 40009046:23906 mobile). Two panels side-by-side on desktop (each 1fr ×
 * 500 px), stacked on mobile.
 *
 * Figma: outer wrapper `px-3 py-10 gap-3` (12 / 40 / 12 px). First panel uses
 * an oval pill (`rounded-[200px]`) with a heavily blurred background image
 * and inverted (off-white) typography. Office hours is a flat rectangle with
 * a full dark-green border and a primary CTA.
 */
export function BuildersHubActionPanels({ panels, officeHours }: Props) {
  return (
    <section className="bg-brand-off-white">
      <div className="mx-auto flex max-w-360 flex-col gap-3 px-3 py-10 md:flex-row md:items-start">
        {panels.map((panel, index) => (
          <ImageOverlayPanel key={index} panel={panel} />
        ))}
        {officeHours ? <OfficeHoursPanel data={officeHours} /> : null}
      </div>
    </section>
  )
}

function ImageOverlayPanel({ panel }: { panel: ActionPanel }) {
  return (
    <div className="relative h-[270px] w-full overflow-hidden rounded-[200px] md:h-[500px] md:flex-1">
      {panel.image ? (
        <div className="absolute inset-0 -m-7.5">
          <Image
            src={panel.image.src}
            alt={panel.image.alt}
            fill
            className="scale-110 object-cover blur-[30px]"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
        </div>
      ) : null}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 px-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <h3 className="font-sans text-[18px] font-normal leading-[1.15] tracking-[-0.18px] text-brand-off-white max-w-[219px] md:max-w-[432px]">
            {panel.title}
          </h3>
          {panel.description ? (
            <p className="font-mono text-[10px] leading-[1.3] text-brand-off-white max-w-[219px] md:max-w-[380px]">
              {panel.description}
            </p>
          ) : null}
        </div>
        <Button
          href={panel.cta.href}
          variant="primary"
          className="cursor-pointer bg-brand-off-white text-brand-dark-green"
          {...(panel.cta.external
            ? { target: '_blank', rel: 'noopener noreferrer' }
            : {})}
        >
          {panel.cta.label}
        </Button>
      </div>
    </div>
  )
}

function OfficeHoursPanel({ data }: { data: OfficeHours }) {
  return (
    <div className="relative h-[270px] w-full overflow-hidden border border-brand-dark-green md:h-[500px] md:flex-1">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-10 p-4 text-center">
        <div className="flex flex-col items-center gap-3">
          <h3 className="font-sans text-[18px] font-normal leading-[1.15] tracking-[-0.18px] text-brand-dark-green">
            {data.title}
          </h3>
          <p className="font-mono text-[10px] leading-[1.3] text-brand-dark-green max-w-[380px]">
            {data.description}
          </p>
        </div>
        <Button
          href={data.cta.href}
          variant="primary"
          className="cursor-pointer"
          {...(data.cta.external
            ? { target: '_blank', rel: 'noopener noreferrer' }
            : {})}
        >
          {data.cta.label}
        </Button>
      </div>
    </div>
  )
}
