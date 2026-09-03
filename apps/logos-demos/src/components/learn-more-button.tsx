'use client'

import { Button } from '@acid-info/logos-ui'
import { useState } from 'react'

import { LearnMoreDialog } from '@/components/learn-more-dialog'

interface LearnMoreButtonProps {
  /** Markdown body, read from disk at build time by the page. */
  body: string
  title: string
}

export function LearnMoreButton({ body, title }: LearnMoreButtonProps) {
  const [isOpen, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="secondary"
        icon={false}
        className="cursor-pointer"
        onClick={() => setOpen(true)}
      >
        Learn more
      </Button>

      {/* Mounted only while open so mermaid and the markdown renderer are not
          loaded for a visitor who never asks for them. */}
      {isOpen && (
        <LearnMoreDialog
          body={body}
          title={title}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
