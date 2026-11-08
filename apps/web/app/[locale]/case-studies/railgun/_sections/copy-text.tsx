interface LineBreaks {
  desktop?: Record<string, string>
  mobile?: Record<string, string>
}

function matchingBreaks(copy: string, candidate?: string) {
  return candidate?.replace(/\s/g, '') === copy.replace(/\s/g, '')
    ? candidate
    : undefined
}

export function createCopyRenderer<Copy extends { lineBreaks?: LineBreaks }>(
  copy: Copy
) {
  type Key = Exclude<keyof Copy, 'lineBreaks'> & string

  return function text(desktopKey: Key, mobileKey?: Key) {
    const desktop = String(copy[desktopKey])
    const mobile = mobileKey ? String(copy[mobileKey]) : desktop
    const desktopLines = matchingBreaks(
      desktop,
      copy.lineBreaks?.desktop?.[desktopKey]
    )
    const mobileLines = matchingBreaks(
      mobile,
      copy.lineBreaks?.mobile?.[mobileKey ?? desktopKey]
    )

    return (
      <span className="copy-text">
        <span
          className="copy-desktop"
          data-reference={desktopLines ? 'desktop' : undefined}
        >
          {desktop}
        </span>
        {desktopLines && (
          <span className="reference-desktop">{desktopLines}</span>
        )}
        <span
          className="copy-mobile"
          data-reference={mobileLines ? 'mobile' : undefined}
        >
          {mobile}
        </span>
        {mobileLines && <span className="reference-mobile">{mobileLines}</span>}
      </span>
    )
  }
}
