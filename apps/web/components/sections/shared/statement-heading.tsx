interface StatementHeadingProps {
  /** Leading line, rendered in the primary text colour. */
  headline: string
  /** Continuation line, rendered muted so the first line reads as the claim. */
  headlineMuted: string
}

/**
 * Two-line display statement ("Logos is not for everyone. / Logos is for
 * people who are done waiting for permission.") shared by the home social
 * proof section and the /build-the-parallel page.
 *
 * Deliberately renders only the `<h2>`: the surrounding flex wrapper and CTA
 * row differ per page, so each caller owns its own spacing.
 */
export default function StatementHeading({
  headline,
  headlineMuted,
}: StatementHeadingProps) {
  return (
    <h2 className="w-[351.5px] max-w-[calc(100vw-50.5px)] text-center font-display text-[24px] leading-none tracking-[-0.72px] whitespace-pre-wrap text-brand-dark-green [text-box-edge:cap_alphabetic] [text-box-trim:trim-both] [word-break:break-word] md:w-full md:max-w-[853px] md:text-[56px] md:tracking-[-0.03em]">
      <span className="block">{headline}</span>
      <span className="block text-[#848e88]">{headlineMuted}</span>
    </h2>
  )
}
