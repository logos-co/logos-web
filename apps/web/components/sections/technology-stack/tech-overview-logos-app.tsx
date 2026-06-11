import Image from 'next/image'

import { GiantSwitch, GiantSwitchTag } from '@acid-info/logos-ui'
import type { GiantSwitchSection } from '@repo/content/schemas'

import { IconMask } from '@/components/icons/icon-mask'
import ContentWidth from '@/components/layout/content-width'
import { Button } from '@/components/ui'
import { resolveBasecampInstallCtaLinkProps } from '@/lib/basecamp-release-links'

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

function DownloadIcon() {
  return <IconMask src="/icons/download.svg" className="size-[15px]" />
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
    <section id="logos-app" className="mt-8 mb-10 md:mt-25 md:mb-25">
      <ContentWidth className="bg-brand-off-white px-0 pt-0 pb-4 md:px-3 md:py-0">
        <GiantSwitch
          className="px-0 md:px-3 [&>div]:pb-27.5 md:[&>div]:pb-14"
          accent={data.accent}
          imagePosition={data.imagePosition}
          installHoverShift
          image={
            <Image
              src={data.image.src}
              alt={data.image.alt}
              fill
              priority
              sizes="(max-width: 1279px) 345px, 566px"
              className="object-top-left"
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
                  const iconSrc = tag.icon
                    ? TAG_ICON_PATH[tag.icon]
                    : undefined
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
                <span
                  className="inline-flex"
                  data-giant-switch-install-trigger
                >
                  <Button
                    {...resolveBasecampInstallCtaLinkProps({
                      ...data.primaryCta,
                      iconOverride: 'download',
                    })}
                    variant="secondary"
                    icon={<DownloadIcon />}
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
      </ContentWidth>
    </section>
  )
}
