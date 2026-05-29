import Image from 'next/image'

import { GiantSwitch, GiantSwitchTag } from '@acid-info/logos-ui'
import type { GiantSwitchSection } from '@repo/content/schemas'

import { IconMask } from '@/components/icons/icon-mask'
import { Button } from '@/components/ui'

/**
 * Map the icon enum on a giantSwitch tag to the actual SVG asset shipped in
 * the public design-systems folder. Adding a new icon is a two-step change:
 * extend the schema enum (`builderHubTagIconSchema`) and add a corresponding
 * entry here.
 */
const TAG_ICON_PATH: Record<string, string> = {
  wallet: '/design-systems/wallet.svg',
  chat: '/design-systems/chat.svg',
  files: '/design-systems/file.svg',
  explorer: '/design-systems/globe.svg',
  lambda: '/design-systems/lambda.svg',
}

function TagIcon({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={15}
      height={15}
      className="size-[14.4px]"
    />
  )
}

function ExternalLinkIcon() {
  return <IconMask src="/icons/external-link.svg" className="size-[15px]" />
}

type Props = {
  data: GiantSwitchSection
}

export default function TechOverviewLogosApp({ data }: Props) {
  const titleWords = data.title.split(' ')
  const shouldBreakMobileTitle = titleWords.length > 2
  const mobileTitleHead = shouldBreakMobileTitle
    ? titleWords.slice(0, Math.max(1, titleWords.length - 2)).join(' ')
    : data.title
  const mobileTitleTail = shouldBreakMobileTitle
    ? titleWords.slice(-2).join(' ')
    : ''

  return (
    <section
      id="logos-app"
      className="mt-10 mb-10 h-[828px] overflow-hidden bg-brand-off-white py-4 md:mt-[100px] md:mb-[100px] md:h-auto md:py-0"
    >
      <GiantSwitch
        accent={data.accent}
        imagePosition={data.imagePosition}
        installHoverShift
        image={
          <Image
            src={data.image.src}
            alt={data.image.alt}
            fill
            priority
            sizes="(max-width: 767px) 345px, 566px"
          />
        }
        title={
          <>
            <span className="md:hidden">
              {mobileTitleHead}
              {mobileTitleTail ? (
                <>
                  <br />
                  {mobileTitleTail}
                </>
              ) : null}
            </span>
            <span className="hidden md:inline">{data.title}</span>
          </>
        }
        description={data.description}
        tags={
          data.tags && data.tags.length > 0 ? (
            <>
              {data.tags.map((tag) => {
                const iconSrc = tag.icon ? TAG_ICON_PATH[tag.icon] : undefined
                return (
                  <GiantSwitchTag
                    key={tag.label}
                    icon={
                      iconSrc ? <TagIcon src={iconSrc} alt="" /> : undefined
                    }
                  >
                    {tag.label}
                  </GiantSwitchTag>
                )
              })}
            </>
          ) : undefined
        }
        actions={
          <>
            {data.primaryCta ? (
              <span className="inline-flex" data-giant-switch-install-trigger>
                <Button
                  href={data.primaryCta.href}
                  variant="secondary"
                  icon={<ExternalLinkIcon />}
                >
                  {data.primaryCta.label}
                </Button>
              </span>
            ) : null}
            {data.secondaryCta ? (
              <Button href={data.secondaryCta.href} variant="tertiary">
                {data.secondaryCta.label}
              </Button>
            ) : null}
          </>
        }
      />
    </section>
  )
}
