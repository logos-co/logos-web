import Image from 'next/image'
import { FileInput, Globe, MessageSquareCode, WalletCards } from 'lucide-react'

import { GiantSwitch, GiantSwitchTag } from '@acid-info/logos-ui'
import type {
  BuilderHubSettings,
  BuilderHubTagIcon,
} from '@repo/content/schemas'

import { Button } from '@/components/ui'
import ContentWidth from '@/components/layout/content-width'

type Props = {
  data: BuilderHubSettings['appInstall']
}

const iconMap: Partial<
  Record<BuilderHubTagIcon, React.ComponentType<{ className?: string }>>
> = {
  wallet: WalletCards,
  chat: MessageSquareCode,
  files: FileInput,
  explorer: Globe,
}

function TagIcon({ icon }: { icon?: BuilderHubTagIcon }) {
  if (!icon) return null
  const Component = iconMap[icon]
  if (!Component) return null
  return <Component className="size-full" />
}

/**
 * Wraps the shared @acid-info/logos-ui GiantSwitch primitive with the App Install
 * fixture data. Figma: 40009046:18801 (desktop) / mobile inside 23764.
 */
export function BuildersHubAppInstall({ data }: Props) {
  return (
    <section id="app-install" className="py-10">
      <ContentWidth className="lg:!px-0">
        <GiantSwitch
          accent={data.accent}
          imagePosition={data.imagePosition}
          image={
            <Image
              src={data.image.src}
              alt={data.image.alt}
              width={data.image.width}
              height={data.image.height}
              priority
            />
          }
          title={data.title}
          description={data.description}
          tags={
            <>
              {data.tags.map((tag) => (
                <GiantSwitchTag
                  key={tag.label}
                  icon={<TagIcon icon={tag.icon} />}
                >
                  {tag.label}
                </GiantSwitchTag>
              ))}
            </>
          }
          actions={
            <>
              <Button
                href={data.installCta.href}
                variant={data.installCta.variant ?? 'secondary'}
                {...(data.installCta.external
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
              >
                {data.installCta.label}
              </Button>
              <Button
                href={data.learnMoreCta.href}
                variant={data.learnMoreCta.variant ?? 'tertiary'}
                {...(data.learnMoreCta.external
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
              >
                {data.learnMoreCta.label}
              </Button>
            </>
          }
        />
      </ContentWidth>
    </section>
  )
}
