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
        // Without this mermaid sets width="100%" on the SVG, and a diagram
        // wider than its column is scaled down, text and all. A fixed pixel
        // width keeps the type at its real size and lets the figure scroll.
        flowchart: { useMaxWidth: false },
        sequence: { useMaxWidth: false },
        // The Logos palette, spelled out rather than left to mermaid's
        // defaults, which are lilac and yellow and look nothing like the rest
        // of the page. Values mirror packages/tokens/src/colors.css.
        themeVariables: {
          background: '#f5f5ef',
          fontSize: '14px',

          // Nodes
          primaryColor: '#ffffff',
          primaryBorderColor: '#152521',
          primaryTextColor: '#152521',
          secondaryColor: '#e2e0c9',
          tertiaryColor: '#c6ebf7',

          // Edges
          lineColor: '#616e69',
          textColor: '#152521',

          // Groups
          clusterBkg: '#f5f5ef',
          clusterBorder: '#b8bdb8',

          // Sequence diagrams
          actorBkg: '#ffffff',
          actorBorder: '#152521',
          actorTextColor: '#152521',
          actorLineColor: '#b8bdb8',
          signalColor: '#616e69',
          signalTextColor: '#152521',
          labelBoxBkgColor: '#ffffff',
          labelBoxBorderColor: '#152521',
          labelTextColor: '#152521',
          noteBkgColor: '#ffd328',
          noteBorderColor: '#152521',
          noteTextColor: '#152521',
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
