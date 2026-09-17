/**
 * @figma-node   40009046:22948 (desktop) · 40009046:22697 (mobile)
 *
 * Site-wide footer. Wraps the <Footer> primitive with Logos-specific
 * content sourced from `content/site/<locale>/footer.json` via
 * `@repo/content`.
 */
import Image from 'next/image'
import { Footer, LogosMark } from '@acid-info/logos-ui'
import { getFooter } from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'

import { Link } from '@/i18n/navigation'
import { SiteFooterNewsletter } from '@/components/site-footer-newsletter'

function LogosLockup() {
  return (
    <span className="inline-flex items-center gap-2 text-brand-off-white">
      <LogosMark size={15} className="shrink-0" />
      <span className="font-display text-[18px] leading-none">Logos</span>
    </span>
  )
}

export default async function SiteFooter({ locale }: { locale: string }) {
  if (!isActiveLocale(locale)) {
    throw new Error(`SiteFooter received non-active locale "${locale}"`)
  }
  const footer = await getFooter(locale)

  return (
    <Footer
      image={
        <Image
          src={footer.image.src}
          alt={footer.image.alt}
          fill
          sizes="(max-width: 768px) 83px, 226px"
        />
      }
      logo={<LogosLockup />}
      newsletter={footer.newsletter}
      newsletterForm={
        <SiteFooterNewsletter
          emailLabel={footer.newsletter.emailLabel}
          roleLabel={footer.newsletter.roleLabel}
          cityLabel={footer.newsletter.cityLabel}
          submitLabel={footer.newsletter.submitLabel}
        />
      }
      tagline={footer.tagline}
      mainLinks={footer.mainLinks}
      socialLinks={footer.socialLinks}
      researchLinks={footer.researchLinks}
      infrastructureLinks={footer.infrastructureLinks}
      legalLinks={footer.legalLinks}
      builtBy={{
        label: footer.builtBy.label,
        attribution: footer.builtBy.attribution,
        href: footer.builtBy.href,
      }}
      linkAs={Link}
    />
  )
}
