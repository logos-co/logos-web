import type { ZineIssue } from '@repo/content/schemas'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { ROUTES } from '@/constants/routes'

interface ZineContentsProps {
  issue: ZineIssue
  page: number
  onSelect: (page: number) => void
  onHover?: (page: number | null) => void
}

export function ZineContents({
  issue,
  page,
  onSelect,
  onHover,
}: ZineContentsProps) {
  const t = useTranslations('zines')
  return (
    <nav className="zine-contents" aria-label={t('contents')}>
      <h2>{t('contents')}</h2>
      {issue.articles
        ?.filter((article) => article.page === 1)
        .map((article) => (
          <Link
            key={article.slug}
            href={ROUTES.zineArticle(issue.slug, article.slug)}
            className="zine-resource-link cursor-pointer"
          >
            {t('editorialResources')}
          </Link>
        ))}
      {issue.sections.map((section) => (
        <section key={section.title}>
          <h3>{section.title}</h3>
          {section.entries.map((entry) => (
            <div key={entry.title}>
              <button
                type="button"
                className="cursor-pointer"
                aria-current={page === entry.page ? 'page' : undefined}
                onClick={() => onSelect(entry.page)}
                onMouseEnter={() => onHover?.(entry.page)}
                onMouseLeave={() => onHover?.(null)}
                onFocus={() => onHover?.(entry.page)}
                onBlur={() => onHover?.(null)}
              >
                <span>{entry.title}</span>
                <span>{String(entry.page).padStart(2, '0')}</span>
              </button>
              {issue.articles
                ?.filter(
                  (article) =>
                    article.page === entry.page && article.title === entry.title
                )
                .map((article) => (
                  <Link
                    key={article.slug}
                    href={ROUTES.zineArticle(issue.slug, article.slug)}
                    className="zine-resource-link cursor-pointer"
                  >
                    {t('articleResources')}
                  </Link>
                ))}
            </div>
          ))}
        </section>
      ))}
    </nav>
  )
}
