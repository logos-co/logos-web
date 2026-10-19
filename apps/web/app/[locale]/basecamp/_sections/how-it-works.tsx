'use client'

import { useState } from 'react'
import type { Renewal } from './atoms'
import { Lines } from './atoms'

export function HowItWorks({ copy }: { copy: Renewal['how'] }) {
  const [active, setActive] = useState(0)
  const diagram = copy.diagram
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
            <div>
              {diagram.apps.map((item) => (
                <button
                  type="button"
                  className={`cursor-pointer ${item === 'Storage' ? 'is-selected' : ''}`}
                  key={item}
                  onClick={() => setActive(0)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className={`bc-diagram-row ${active === 1 ? 'is-active' : ''}`}>
            <span>{copy.layers[1].title}</span>
            <div>
              {diagram.modules.map((group) => (
                <div className="bc-module-group" key={group.label}>
                  <small>{group.label}</small>
                  {group.items.map((item) => (
                    <span
                      className={
                        ['Storage', 'Capabilities', 'Module State'].includes(
                          item
                        )
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
              <span className={index === 0 ? 'is-outlined' : ''} key={line}>
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
            <strong>{diagram.selectedPath}</strong>
            <p>{diagram.selectedDescription}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
