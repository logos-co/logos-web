import type { ZineIssue } from '@repo/content/schemas'
import { useTranslations } from 'next-intl'

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
      {issue.sections.map((section) => (
        <section key={section.title}>
          <h3>{section.title}</h3>
          {section.entries.map((entry) => (
            <button
              type="button"
              className="cursor-pointer"
              key={entry.title}
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
          ))}
        </section>
      ))}
    </nav>
  )
}
