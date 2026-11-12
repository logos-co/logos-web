import Image from 'next/image'
import { Footer } from '@acid-info/logos-ui'
import { getFooter } from '@repo/content/loaders'
import type { Language, RailgunCopySection } from '@repo/content/schemas'

import { SiteFooterNewsletter } from '@/components/site-footer-newsletter'

import { BrandLockup } from './shared'
import './footer.css'

export async function RailgunFooter({
  copy,
  locale,
}: {
  copy: RailgunCopySection['footer']
  locale: Language
}) {
  const { image } = await getFooter(locale)
  const { lineBreaks, newsletter, tagline, ...links } = copy

  return (
    <Footer
      {...links}
      className="railgun-footer"
      newsletter={{
        ...newsletter,
        title: lineBreaks?.mobile?.newsletterTitle ?? newsletter.title,
      }}
      newsletterForm={<SiteFooterNewsletter {...newsletter} inlineSubmit />}
      image={
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="(max-width: 1023px) 83px, 226px"
        />
      }
      logo={<BrandLockup markSize={18} />}
      tagline={lineBreaks?.mobile?.tagline ?? tagline}
    />
  )
}
