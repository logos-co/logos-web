'use client'

import { useRouter } from 'next/navigation'
import type { MouseEvent, ReactNode } from 'react'

interface RecordRowProps {
  children: ReactNode
  href: string
}

export function RecordRow({ children, href }: RecordRowProps) {
  const router = useRouter()

  return (
    <tr
      className="record-row cursor-pointer"
      onClick={(event: MouseEvent<HTMLTableRowElement>) => {
        if ((event.target as HTMLElement).closest('a, button')) return
        router.push(href)
      }}
      onMouseEnter={() => router.prefetch(href)}
    >
      {children}
    </tr>
  )
}
