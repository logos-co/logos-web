import { TechTextSplitSection } from '@acid-info/logos-ui'
import type { CtaPanelSection } from '@repo/content/schemas'

import { Reveal } from '@/components/motion/reveal'

type Props = {
  data: CtaPanelSection
}

export default function StorageMain({ data }: Props) {
  return (
    <Reveal amount={0.2}>
      <TechTextSplitSection
        className="h-auto border-t border-brand-dark-green/10 md:h-[183px]"
        title={data.title}
        body={
          data.description
            ? data.description
                .split('\n\n')
                .map((paragraph) => <p key={paragraph}>{paragraph}</p>)
            : null
        }
      />
    </Reveal>
  )
}
