import type { SVGAttributes } from 'react'

export function FaqOpenIcon(props: SVGAttributes<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M23.5 12C23.5 18.3513 18.3513 23.5 12 23.5C5.64873 23.5 0.5 18.3513 0.5 12C0.5 5.64873 5.64873 0.5 12 0.5C18.3513 0.5 23.5 5.64873 23.5 12Z"
        stroke="currentColor"
        strokeOpacity="0.5"
      />
      <path
        d="M7.5 12H16.5M12 7.5V16.5"
        strokeWidth="1.2"
        stroke="currentColor"
      />
    </svg>
  )
}

export function FaqCloseIcon(props: SVGAttributes<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24Z"
        fill="currentColor"
      />
      <path d="M7.5 12H16.5" strokeWidth="1.2" stroke="#F5F5EF" />
    </svg>
  )
}
