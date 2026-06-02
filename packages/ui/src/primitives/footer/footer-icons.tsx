/**
 * Small presentational icons shared by the footer newsletter block.
 * No hooks or interactivity, so they are safe to import from both the
 * server `Footer` and the client `FooterNewsletter`.
 */

export function FooterChevronIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-[15px] shrink-0"
      fill="none"
      viewBox="0 0 15 15"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M4.5 6L7.5 9L10.5 6" stroke="currentColor" />
    </svg>
  )
}

export function FooterArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-[15px] shrink-0"
      fill="none"
      viewBox="0 0 15 15"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3.5 7.5H11.5M11.5 7.5L8 4M11.5 7.5L8 11"
        stroke="currentColor"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  )
}
