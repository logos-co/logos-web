'use client'

import { useEffect, useId, useRef, useState } from 'react'

/**
 * Renders one mermaid diagram.
 *
 * mermaid is imported lazily: it is the largest dependency in the app and only
 * an opened explainer needs it, so it must not sit in the page bundle.
 */
export function MermaidDiagram({ source }: { source: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hasFailed, setFailed] = useState(false)
  // mermaid needs a DOM id that is unique per diagram and valid as a CSS
  // selector; useId's colons are not.
  const rawId = useId()
  const diagramId = `mermaid-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`

  useEffect(() => {
    let cancelled = false

    const render = async () => {
      const { default: mermaid } = await import('mermaid')

      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        fontFamily: 'var(--font-sans)',
        theme: 'base',
        themeVariables: {
          background: '#f5f5ef',
          primaryColor: '#ffffff',
          primaryBorderColor: '#152521',
          primaryTextColor: '#152521',
          lineColor: '#616e69',
          secondaryColor: '#e2e0c9',
          tertiaryColor: '#c6ebf7',
          fontSize: '13px',
        },
      })

      const { svg } = await mermaid.render(diagramId, source)
      if (cancelled || !containerRef.current) return
      containerRef.current.innerHTML = svg
    }

    render().catch(() => {
      if (!cancelled) setFailed(true)
    })

    return () => {
      cancelled = true
    }
  }, [diagramId, source])

  // A diagram that will not render should not take the explainer down with it;
  // the prose around it carries the same explanation.
  if (hasFailed) {
    return (
      <pre className="text-mono-s overflow-x-auto border border-gray-01 bg-white p-4 text-gray-06">
        {source}
      </pre>
    )
  }

  return (
    <div
      ref={containerRef}
      className="mermaid-figure"
      role="img"
      aria-label="Diagram"
    />
  )
}
