import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getTranslations } from 'next-intl/server'
import { ButtonArrowIcon } from '@acid-info/logos-ui'
import type { ZineArticle, ZineIssue } from '@repo/content/schemas'
import { Link } from '@/i18n/navigation'
import { ROUTES } from '@/constants/routes'
import './zine-article.css'

interface ZineArticleViewProps {
  issue: ZineIssue
  article: ZineArticle
  body: string
}
export async function ZineArticleView({
  issue,
  article,
  body,
}: ZineArticleViewProps) {
  const t = await getTranslations('zines')
  return (
    <article className="zine-article">
      <header>
        <Link
          href={`${ROUTES.zine(issue.slug)}?page=${article.page}&view=pages`}
          className="zine-article-back cursor-pointer"
        >
          <ButtonArrowIcon className="rotate-180" />
          {t('backToIssue')}
        </Link>
        <p className="zine-article-eyebrow">
          {issue.edition} · {t('originalText')}
        </p>
        <h1>{article.title}</h1>
        <p className="zine-article-note">{t('originalNote')}</p>
        <a
          className="cursor-pointer"
          href={article.source}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('repositorySource')}
        </a>
      </header>
      <div className="zine-article-body">
        <Markdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ href, children }) => (
              <a
                href={href}
                className="cursor-pointer"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            ),
            table: ({ children }) => (
              <div className="zine-article-table" tabIndex={0}>
                <table>{children}</table>
              </div>
            ),
          }}
        >
          {body}
        </Markdown>
      </div>
      {article.references.length > 0 && (
        <footer>
          <h2>{t('references')}</h2>
          <ul>
            {article.references.map((href) => (
              <li key={href}>
                <a
                  className="cursor-pointer"
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {href}
                </a>
              </li>
            ))}
          </ul>
        </footer>
      )}
    </article>
  )
}
