/**
 * Footer block on Builders Hub detail pages — renders an eyebrow heading
 * followed by an underlined link list of related items (Related Ideas under an
 * RFP, Related RFPs under an Idea). Both sides share identical markup.
 */
import { Link } from '@/i18n/navigation'

type RelatedItem = {
  slug: string
  title: string
}

type RelatedLinksListProps = {
  /** Section heading rendered as a small mono eyebrow above the list. */
  heading: string
  /** Path prefix the slug is appended to, e.g. `ROUTES.ideas`. */
  hrefBase: string
  items: RelatedItem[]
}

export function RelatedLinksList({
  heading,
  hrefBase,
  items,
}: RelatedLinksListProps) {
  if (items.length === 0) return null
  return (
    <>
      <h2 className="font-mono text-[10px] font-medium leading-[1.3] text-brand-dark-green/70 uppercase mb-4">
        {heading}
      </h2>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.slug}>
            <Link
              href={`${hrefBase}/${item.slug}`}
              className="cursor-pointer font-sans text-[14px] leading-[1.4] text-brand-dark-green underline underline-offset-4 hover:opacity-70"
            >
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
