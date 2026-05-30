import { TechTextSplitSection } from '@acid-info/logos-ui'
import type { CtaPanelSection } from '@repo/content/schemas'

import ContentWidth from '@/components/layout/content-width'
import { Reveal } from '@/components/motion/reveal'

type Props = {
  data: CtaPanelSection
}

export default function BlockchainPrivacy({ data }: Props) {
  return (
    <Reveal amount={0.2}>
      <ContentWidth>
        <TechTextSplitSection
        title={data.eyebrow ?? data.title}
        body={data.description ? <p>{data.description}</p> : null}
      />
      </ContentWidth>
    </Reveal>
  )
}
