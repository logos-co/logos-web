import { getZineCatalogue } from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'
import { Link } from '@/i18n/navigation'
import { ROUTES } from '@/constants/routes'
import { createDefaultMetadata } from '@/lib/metadata'
import '@/components/sections/zines/zines.css'

interface PageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params
  if (!isActiveLocale(locale)) throw new Error(`Inactive locale: ${locale}`)
  const catalogue = await getZineCatalogue(locale)
  return createDefaultMetadata({
    title: catalogue.title,
    description: catalogue.description,
    locale,
    path: ROUTES.zines,
  })
}

export default async function ZinesPage({ params }: PageProps) {
  const { locale } = await params
  if (!isActiveLocale(locale)) throw new Error(`Inactive locale: ${locale}`)
  const catalogue = await getZineCatalogue(locale)
  return (
    <section className="zine-catalogue">
      <div className="zine-catalogue-intro">
        <h1>
          <span className="zine-catalogue-number" aria-hidden="true">
            1
          </span>
          {catalogue.title}
        </h1>
        <p>{catalogue.description}</p>
      </div>
      <div className="zine-editions">
        {catalogue.editions.map((edition) => {
          const cover = (
            <figure data-edition={edition.slug}>
              <img
                src={edition.cover}
                alt={edition.title}
                width={278}
                height={394}
              />
              <figcaption>{edition.date}</figcaption>
            </figure>
          )
          return edition.reader ? (
            <Link
              key={edition.slug}
              href={ROUTES.zine(edition.slug)}
              className="cursor-pointer"
            >
              {cover}
            </Link>
          ) : edition.href ? (
            <a
              key={edition.slug}
              href={edition.href}
              className="cursor-pointer"
            >
              {cover}
            </a>
          ) : (
            <div key={edition.slug}>{cover}</div>
          )
        })}
      </div>
    </section>
  )
}
