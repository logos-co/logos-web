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
        className="mb-15 md:mb-25"
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
