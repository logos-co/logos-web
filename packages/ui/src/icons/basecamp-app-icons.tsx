import type { SVGProps } from 'react'

type AppIconProps = SVGProps<SVGSVGElement>

export function BasecampAppMark(props: AppIconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" {...props}>
      <path
        d="M24 3.5c1.2 0 2.3.6 2.9 1.7l17 29.4c1.3 2.2-.3 5-2.9 5H7c-2.6 0-4.2-2.8-2.9-5l17-29.4c.6-1.1 1.7-1.7 2.9-1.7z"
        fill="#2A2A2A"
      />
      <path d="M24 14.5 34.5 33h-21z" fill="#F07D5E" />
      <path d="m24 22.5 4.6 10.5h-9.2z" fill="#B8432A" />
      <path d="m24 14.5 2.2 3.9-2.2 4.1-2.2-4.1z" fill="#FFB199" />
      <circle cx="24" cy="37" r="1.7" fill="#F07D5E" />
    </svg>
  )
}

export function BasecampBlockchainIcon(props: AppIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="m12 2.8 8 4.6v9.2l-8 4.6-8-4.6V7.4z" />
      <path d="m9.5 8.5 5 8M12 12.5l-2.5 4" />
    </svg>
  )
}

export function BasecampChatIcon(props: AppIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M4 5h16v11H9l-5 4z" />
    </svg>
  )
}

export function BasecampStorageIcon(props: AppIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect x="4" y="4" width="16" height="7" rx="1.5" />
      <rect x="4" y="13" width="16" height="7" rx="1.5" />
      <path d="M8 7.5h3M8 16.5h3" />
    </svg>
  )
}

export function BasecampChevronDownIcon(props: AppIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

export function BasecampArrowUpIcon(props: AppIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="m12 19 0-14m-6 6 6-6 6 6" />
    </svg>
  )
}

export function BasecampCheckIcon(props: AppIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  )
}
