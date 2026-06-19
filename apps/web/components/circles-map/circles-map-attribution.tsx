export interface CirclesMapAttributionContent {
  label: string
  linkLabel: string
  href: string
}

export function CirclesMapAttribution({
  attribution,
}: {
  attribution: CirclesMapAttributionContent
}) {
  return (
    <p className="text-mono-s mt-3 text-right text-brand-dark-green/55">
      {attribution.label}{' '}
      <a
        href={attribution.href}
        target="_blank"
        rel="noopener noreferrer"
        className="cursor-pointer border-b border-current/30 transition-colors hover:text-brand-dark-green focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark-green"
      >
        {attribution.linkLabel}
      </a>
    </p>
  )
}
