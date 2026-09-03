'use client'

import { useEffect, useRef, useState } from 'react'
import { Dialog, Modal, ModalOverlay } from 'react-aria-components'
import Markdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { MermaidDiagram } from '@/components/mermaid-diagram'

/**
 * How long the panel takes to leave. Mirrors `--dialog-exit` in the stylesheet:
 * the caller unmounts this component, so the exit has to be timed here rather
 * than left to the animation alone.
 */
const EXIT_MS = 200

/**
 * ```mermaid fences render as diagrams; every other fence stays a code block.
 * react-markdown hands us the `<code>` inside the `<pre>`, so the diagram is
 * swapped in at the code level and the surrounding `<pre>` is dropped for it.
 */
const components: Components = {
  pre: ({ children }) => <>{children}</>,
  code: ({ className, children }) => {
    const source = String(children).replace(/\n$/, '')

    if (className?.includes('language-mermaid')) {
      return <MermaidDiagram source={source} />
    }

    // Inline code has no language class and no newlines.
    if (!className && !source.includes('\n')) {
      return <code>{source}</code>
    }

    return (
      <pre>
        <code>{source}</code>
      </pre>
    )
  },
}

interface LearnMoreDialogProps {
  body: string
  onClose: () => void
  title: string
}

/**
 * Closing runs in two steps.
 *
 * The caller mounts this conditionally, so telling it immediately would tear
 * the panel out mid-animation and it would vanish rather than leave. The
 * overlay is closed first, React Aria plays the exit on `[data-exiting]`, and
 * the caller is told once that has had time to finish.
 */
export function LearnMoreDialog({
  body,
  onClose,
  title,
}: LearnMoreDialogProps) {
  const [isOpen, setOpen] = useState(true)
  const timeout = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timeout.current), [])

  function requestClose(): void {
    // Guarded: a second close while the first is still animating would queue a
    // second `onClose` against a caller that has already moved on.
    if (!isOpen) return
    setOpen(false)
    timeout.current = window.setTimeout(onClose, EXIT_MS)
  }

  return (
    <ModalOverlay
      className="dialog-backdrop"
      // Clicking the page behind a modal means "I am done with this", and a
      // dialog that ignores it reads as stuck. It routes through the same
      // requestClose as the button, so the panel leaves the same way.
      isDismissable
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) requestClose()
      }}
    >
      <Modal className="dialog-modal">
        <Dialog
          aria-labelledby="learn-more-title"
          className="dialog-panel"
          role="dialog"
        >
          <div className="dialog-header">
            <h2 className="text-h4-sans text-brand-dark-green" id="learn-more-title">
              {title}
            </h2>
            <button
              className="text-caption-sans cursor-pointer text-gray-05 hover:text-brand-dark-green"
              type="button"
              onClick={requestClose}
            >
              Close
            </button>
          </div>

          <div className="explainer-prose">
            <Markdown remarkPlugins={[remarkGfm]} components={components}>
              {body}
            </Markdown>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}
