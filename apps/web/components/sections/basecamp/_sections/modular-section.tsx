import type { FeaturedTextSection } from '@repo/content/schemas'

export function ModularSection({ data }: { data: FeaturedTextSection }) {
  return (
    <section className="grid w-full gap-10 border-b border-brand-dark-green/10 px-3 pt-10 pb-[60px] md:min-h-[275px] md:grid-cols-2 md:pb-0">
      <h2 className="font-sans text-[24px] font-normal leading-[1.1] tracking-[-0.24px] text-brand-dark-green">
        <span>{data.title.highlight}</span>
        <br />
        <span>{data.title.rest}</span>
      </h2>
      <div className="text-mono-s flex flex-col gap-4 max-w-[345px] text-brand-dark-green">
        {data.body?.map((item) => (
          <p key={item}>{item}</p>
        ))}
      </div>
    </section>
  )
}
