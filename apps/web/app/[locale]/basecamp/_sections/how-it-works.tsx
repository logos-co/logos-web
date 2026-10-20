'use client'

import { useEffect, useState } from 'react'
import type { Renewal } from './atoms'
import { Lines } from './atoms'

export function HowItWorks({ copy }: { copy: Renewal['how'] }) {
  const [active, setActive] = useState(0)
  const [autoApp, setAutoApp] = useState('Storage')
  const [hoveredApp, setHoveredApp] = useState<string | null>(null)
  const [pinnedApp, setPinnedApp] = useState<string | null>(null)
  const diagram = copy.diagram
  const selectedApp = hoveredApp ?? pinnedApp ?? autoApp
  const selectedFlow =
    diagram.flows.find((flow) => flow.app === selectedApp) ?? diagram.flows[0]

  useEffect(() => {
    if (
      pinnedApp ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }
    const interval = window.setInterval(() => {
      setAutoApp((current) => {
        const next = (diagram.apps.indexOf(current) + 1) % diagram.apps.length
        return diagram.apps[next]
      })
    }, 6000)
    return () => window.clearInterval(interval)
  }, [diagram.apps, pinnedApp])

  return (
    <section className="bc-light bc-how">
      <div className="bc-section-header">
        <h2>
          <Lines lines={copy.title} />
        </h2>
        <div>
          <p>{copy.intro}</p>
          <small>{copy.disclaimer}</small>
        </div>
      </div>
      <div className="bc-how-grid">
        <div className="bc-layers">
          {copy.layers.map((layer, index) => (
            <button
              type="button"
              onClick={() => setActive(index)}
              aria-pressed={index === active}
              className={`bc-layer cursor-pointer ${index === active ? 'is-active' : ''}`}
              key={layer.title}
            >
              <span className="bc-layer-head">
                <strong>{layer.title}</strong>
                <small>{layer.label}</small>
              </span>
              <span>{layer.description}</span>
              {index === active && layer.highlight && (
                <small className="bc-highlight">{layer.highlight}</small>
              )}
            </button>
          ))}
        </div>
        <div className="bc-diagram">
          <div className="bc-diagram-head">
            <span>{diagram.title}</span>
            <span>{diagram.hint}</span>
          </div>
          <div className={`bc-diagram-row ${active === 0 ? 'is-active' : ''}`}>
            <span>{copy.layers[0].title}</span>
            <div className="bc-diagram-app-groups">
              <div>
                {diagram.apps.map((item) => (
                  <button
                    type="button"
                    className={`cursor-pointer ${item === selectedApp ? 'is-selected' : ''}`}
                    key={item}
                    aria-pressed={item === selectedApp}
                    onMouseEnter={() => setHoveredApp(item)}
                    onMouseLeave={() => setHoveredApp(null)}
                    onFocus={() => setHoveredApp(item)}
                    onBlur={() => setHoveredApp(null)}
                    onClick={() => setPinnedApp(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <div className="bc-diagram-surfaces">
                <small>{diagram.surfacesLabel}</small>
                <div>
                  {diagram.surfaces.map((item) => (
                    <button
                      type="button"
                      className={`cursor-pointer ${item === selectedApp ? 'is-selected' : ''}`}
                      key={item}
                      aria-pressed={item === selectedApp}
                      onMouseEnter={() => setHoveredApp(item)}
                      onMouseLeave={() => setHoveredApp(null)}
                      onFocus={() => setHoveredApp(item)}
                      onBlur={() => setHoveredApp(null)}
                      onClick={() => setPinnedApp(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div
            className={`bc-diagram-row bc-modules-row ${active === 1 ? 'is-active' : ''}`}
          >
            <span>{copy.layers[1].title}</span>
            <div>
              {diagram.modules.map((group) => (
                <div className="bc-module-group" key={group.label}>
                  <small>{group.label}</small>
                  {group.items.map((item) => (
                    <span
                      className={
                        selectedApp === 'Storage' && item === 'Storage'
                          ? 'is-outlined'
                          : selectedFlow.modules.includes(item)
                            ? 'is-flow'
                            : ['Capabilities', 'Module State'].includes(item)
                              ? 'is-outlined'
                              : ''
                      }
                      key={item}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="bc-network">
            <small>{diagram.networkLabel}</small>
            {diagram.network.map((line, index) => (
              <span
                className={selectedFlow.network === index ? 'is-outlined' : ''}
                key={line}
              >
                {line}
              </span>
            ))}
          </div>
          <div
            className={`bc-diagram-runtime ${active === 2 ? 'is-active' : ''}`}
          >
            <small>{copy.layers[2].title}</small>
            <span>{diagram.runtime}</span>
          </div>
          <div className="bc-diagram-note">
            <strong>{selectedFlow.path}</strong>
            <p>{selectedFlow.description}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
