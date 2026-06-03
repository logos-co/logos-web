import { TechTextSplitSection } from '@acid-info/logos-ui'
import type { CtaPanelSection } from '@repo/content/schemas'

import { Reveal } from '@/components/motion/reveal'

function paragraphs(text?: string) {
  return text?.split('\n\n') ?? []
}

type Props = {
  data: CtaPanelSection
}

export default function NetworkingIntro({ data }: Props) {
  return (
    <>
      <div className="md:hidden h-px w-full bg-brand-dark-green/10" />
      <Reveal amount={0.2}>
        <TechTextSplitSection
          className="mb-15 md:mb-25 md:h-[235px]"
          title={data.title}
          body={
            data.description ? (
              <>
                {paragraphs(data.description).map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </>
            ) : null
          }
        />
      </Reveal>
    </>
  )
}
