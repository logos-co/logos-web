interface MediaSummaryProps {
  html?: string
  text: string
}

export function MediaSummary({ html, text }: MediaSummaryProps) {
  if (!html && !text) return null

  return (
    <div className="border-y border-brand-dark-green py-6 max-sm:py-4">
      {html ? (
        <div
          className="media-detail-summary whitespace-pre-wrap font-sans text-[20px] leading-[30px] tracking-normal text-brand-dark-green max-sm:text-[18px] max-sm:leading-6"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <p className="whitespace-pre-wrap font-sans text-[20px] leading-[30px] tracking-normal text-brand-dark-green max-sm:text-[18px] max-sm:leading-6">
          {text}
        </p>
      )}
    </div>
  )
}
