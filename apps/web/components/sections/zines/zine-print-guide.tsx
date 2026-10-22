import { Button, XIcon } from '@acid-info/logos-ui'
import type { ZineIssue, ZinePrintGuide } from '@repo/content/schemas'
import { useTranslations } from 'next-intl'

interface ZinePrintGuidePanelProps {
  issue: ZineIssue
  guide: ZinePrintGuide
  onClose: () => void
}

export function ZinePrintGuidePanel({
  issue,
  guide,
  onClose,
}: ZinePrintGuidePanelProps) {
  const t = useTranslations('zines')
  return (
    <aside className="zine-print-guide" aria-label={t('printGuide')}>
      <div className="zine-print-heading">
        <h2>{t('printGuide')}</h2>
        <button
          type="button"
          className="cursor-pointer"
          onClick={onClose}
          aria-label={t('closePrintGuide')}
        >
          <XIcon size={18} />
        </button>
      </div>
      {guide.steps.map((step, index) => (
        <section key={step.title}>
          <h3>{step.title}</h3>
          <p>
            {index === 0 && issue.printLayout === 'spreads'
              ? guide.spreadPrint
              : step.body}
          </p>
        </section>
      ))}
      <section>
        <h3>{guide.shop.title}</h3>
        <p>{guide.shop.body}</p>
      </section>
      <Button
        href={issue.pdf}
        download
        icon={false}
        className="zine-mobile cursor-pointer"
      >
        {t('download')}
      </Button>
      {issue.imposedPdf && (
        <section>
          <a
            href={issue.imposedPdf}
            download
            className="zine-imposed-link cursor-pointer"
          >
            {t('downloadImposed')}
          </a>
          <p>{t('imposedNote')}</p>
        </section>
      )}
    </aside>
  )
}
