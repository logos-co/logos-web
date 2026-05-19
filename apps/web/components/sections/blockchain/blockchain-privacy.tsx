import type { CtaPanelSection } from '@repo/content/schemas'

type Props = {
  data: CtaPanelSection
}

export default function BlockchainPrivacy({ data }: Props) {
  return (
    <section className="border-brand-dark-green/10 bg-brand-off-white border-t">
      <div className="mx-auto grid max-w-360 gap-10 px-3 py-10 text-brand-dark-green md:grid-cols-4 md:gap-3 md:pt-[22px] md:pb-[118px]">
        <h2 className="text-h4-sans md:col-span-2">
          {data.eyebrow ?? data.title}
        </h2>

        <div className="flex min-w-0 flex-col gap-5 md:col-span-2">
          {data.description ? (
            <p className="text-mono-s min-w-0 max-w-86 break-words">
              {data.description}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  )
}
