import { Button, ButtonArrowIcon, SearchIcon, XIcon } from '@acid-info/logos-ui'
import type { ZineIssue } from '@repo/content/schemas'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { ROUTES } from '@/constants/routes'
import type { ReaderView, ReaderPanel } from '@/lib/zines/reader-state'

interface ZineToolbarProps {
  issue: ZineIssue
  view: ReaderView
  panel: ReaderPanel
  showView: (view: ReaderView) => void
  setPanel: (panel: ReaderPanel) => void
}
export function ZineToolbar({
  issue,
  view,
  panel,
  showView,
  setPanel,
}: ZineToolbarProps) {
  const t = useTranslations('zines')
  const guided = view === 'guided'
  return (
    <header className="zine-toolbar">
      {guided ? (
        <>
          <button
            type="button"
            className="zine-back cursor-pointer"
            onClick={() => showView('pages')}
          >
            <ButtonArrowIcon className="rotate-180" />
            <span className="zine-guided-title">{t('guidedView')}</span>
          </button>
          <button
            type="button"
            className="zine-close cursor-pointer"
            onClick={() => showView('pages')}
            aria-label={t('closeGuided')}
          >
            <XIcon size={24} />
          </button>
        </>
      ) : (
        <>
          <Link
            href={ROUTES.zines}
            className="zine-back cursor-pointer"
            aria-label={t('backToZines')}
          >
            <ButtonArrowIcon className="rotate-180" />
            <span className="zine-desktop">{t('title')}</span>
            <span className="zine-mobile zine-guided-title">
              {issue.shortTitle}
            </span>
          </Link>
          <div className="zine-identity zine-desktop">
            <h1>{issue.title}</h1>
            <span>{issue.edition}</span>
          </div>
          <div className="zine-toolbar-actions">
            <div
              className="zine-view-tabs zine-desktop"
              role="group"
              aria-label={t('view')}
            >
              {(['spreads', 'pages', 'grid'] as const).map((mode) => (
                <button
                  type="button"
                  className="cursor-pointer"
                  key={mode}
                  aria-pressed={view === mode}
                  onClick={() => showView(mode)}
                >
                  {t(mode)}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="zine-search-toggle cursor-pointer"
              aria-label={t('search')}
              aria-expanded={panel === 'search'}
              onClick={() => setPanel(panel === 'search' ? null : 'search')}
            >
              <SearchIcon />
            </button>
            <button
              type="button"
              className="cursor-pointer"
              aria-expanded={
                panel === 'contents' || (view === 'grid' && panel === null)
              }
              onClick={() => setPanel(panel === 'contents' ? null : 'contents')}
            >
              {t('contents')}
            </button>
            <button
              type="button"
              className="zine-print-toggle cursor-pointer"
              aria-expanded={panel === 'print'}
              onClick={() => setPanel(panel === 'print' ? null : 'print')}
            >
              {t('printGuide')}
            </button>
            <Button
              href={issue.pdf}
              download
              icon={false}
              className="zine-download zine-desktop cursor-pointer bg-brand-off-white text-brand-dark-green hover:bg-gray-01"
            >
              {t('download')}
            </Button>
          </div>
        </>
      )}
    </header>
  )
}
