import Image from 'next/image'
import type { BuilderHubHomeIdeaResolution } from '@repo/content/loaders'
import type { BuilderHubSettings } from '@repo/content/schemas'

import { SectionFrame } from './atoms'

export function InspirationSection({
  data,
  ideas,
}: {
  data: NonNullable<BuilderHubSettings['inspiration']>
  ideas: BuilderHubHomeIdeaResolution['ideas']
}) {
  const featuredIdeas = ideas.slice(0, 3)

  return (
    <SectionFrame id="get-inspired" index="01" title={data.title}>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex h-[370px] flex-col items-center justify-center gap-15 overflow-hidden rounded-[200px] border border-brand-dark-green px-4 py-10 [clip-path:inset(0)] [contain:paint]">
          <div className="text-center">
            <h3 className="text-subhead-sans">{data.ideasTitle}</h3>
            <p className="mx-auto mt-3 w-[222px] text-mono-s">
              {data.ideasDescription}
            </p>
          </div>
          <div className="flex gap-3">
            {featuredIdeas.map((idea) => (
              <div
                key={idea.slug}
                className="hidden h-[108px] w-[270px] shrink-0 flex-col gap-3 rounded-xl bg-gray-01 p-3 first:flex md:flex"
              >
                <div className="flex justify-between gap-4">
                  <p className="w-[163px] font-display text-[14px] leading-[1.2]">
                    {idea.title}
                  </p>
                  {idea.reward ? (
                    <p className="text-right text-mono-s">
                      {idea.reward.amount} {idea.reward.currency}
                      {idea.reward.xp ? (
                        <>
                          <br />+ {idea.reward.xp} XP
                        </>
                      ) : null}
                    </p>
                  ) : null}
                </div>
                <p className="border-t border-brand-dark-green/10 pt-3 text-mono-s">
                  {idea.tagline ?? idea.summary}
                  <br />
                  Idea by @{idea.submitter.handle}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex h-[370px] flex-col items-center overflow-hidden border border-brand-dark-green px-4 py-10">
          <div className="pt-[31px] text-center">
            <h3 className="text-subhead-sans">{data.issuesTitle}</h3>
            <p className="mx-auto mt-3 w-[222px] text-mono-s">
              {data.issuesDescription}
            </p>
          </div>
          <Image
            src={data.issuesImage.src}
            alt={data.issuesImage.alt}
            width={data.issuesImage.width}
            height={data.issuesImage.height}
            className="absolute top-[185px] left-0 h-[218px] w-full object-cover mix-blend-darken md:top-[179px] md:left-[15px] md:h-[227px] md:w-[670px]"
          />
        </div>
      </div>
    </SectionFrame>
  )
}
