'use client'

import { useRef, useState, type KeyboardEvent, type TouchEvent } from 'react'
import { CircleArrowIcon } from '@acid-info/logos-ui'
import type { FieldStationCaseStudyCopySection } from '@repo/content/schemas'

import { Button } from '@/components/ui'
import { Photo } from './shared'

export function Projects({
  copy,
  testimonial,
  next,
}: Pick<FieldStationCaseStudyCopySection, 'testimonial' | 'next'> & {
  copy: FieldStationCaseStudyCopySection['projects']
}) {
  const [active, setActive] = useState(0)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const tabs = useRef<Array<HTMLButtonElement | null>>([])
  const select = (index: number, focus = false) => {
    const target = (index + copy.entries.length) % copy.entries.length
    setActive(target)
    const tab = tabs.current[target]
    const list = tab?.parentElement
    if (tab && list) {
      const tabBounds = tab.getBoundingClientRect()
      const listBounds = list.getBoundingClientRect()
      if (tabBounds.left < listBounds.left) {
        list.scrollLeft -= listBounds.left - tabBounds.left
      } else if (tabBounds.right > listBounds.right) {
        list.scrollLeft += tabBounds.right - listBounds.right
      }
    }
    if (focus) tab?.focus({ preventScroll: true })
  }
  const handleKey = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault()
      select(index + (event.key === 'ArrowRight' ? 1 : -1), true)
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      select(event.key === 'Home' ? 0 : copy.entries.length - 1, true)
    }
  }
  const handleTouchEnd = (event: TouchEvent) => {
    if (touchStart.current === null) return
    const deltaX = event.changedTouches[0].clientX - touchStart.current.x
    const deltaY = event.changedTouches[0].clientY - touchStart.current.y
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
      select(active + (deltaX < 0 ? 1 : -1))
    }
    touchStart.current = null
  }
  const project = copy.entries[active]
  return (
    <>
      <section
        className="field-case-section field-case-dark field-case-projects"
        data-header-tone="dark"
      >
        <div className="field-case-split">
          <h2>{copy.title}</h2>
          <div>
            <p>{copy.body}</p>
            <p className="field-case-disclaimer">{copy.disclaimer}</p>
          </div>
        </div>
        <div className="field-case-tabs" role="tablist" aria-label={copy.title}>
          {copy.entries.map((entry, index) => (
            <button
              key={entry.title}
              ref={(element) => {
                tabs.current[index] = element
              }}
              id={`field-project-tab-${index}`}
              type="button"
              role="tab"
              aria-selected={active === index}
              aria-controls="field-project-panel"
              tabIndex={active === index ? 0 : -1}
              onKeyDown={(event) => handleKey(event, index)}
              onClick={() => select(index)}
            >
              {entry.title}
            </button>
          ))}
        </div>
        <div
          key={project.title}
          className="field-case-split field-case-project"
          id="field-project-panel"
          role="tabpanel"
          aria-labelledby={`field-project-tab-${active}`}
          data-image-fit={project.imageFit ?? 'contain'}
          onTouchStart={(event) => {
            touchStart.current = {
              x: event.touches[0].clientX,
              y: event.touches[0].clientY,
            }
          }}
          onTouchEnd={handleTouchEnd}
        >
          {project.image ? (
            <Photo image={project.image} eager reveal />
          ) : (
            <div className="field-case-project-empty" aria-hidden="true" />
          )}
          <div>
            <h3>{project.title}</h3>
            <p className="field-case-project-lead">{project.lead}</p>
            <p>{project.body}</p>
            <Button href={project.cta.href} variant="secondary">
              {project.cta.label}
            </Button>
          </div>
        </div>
        <div className="field-case-project-controls">
          <span>
            {String(active + 1).padStart(2, '0')} /{' '}
            {String(copy.entries.length).padStart(2, '0')}
          </span>
          <div>
            <button
              type="button"
              aria-label={copy.previousLabel}
              onClick={() => select(active - 1)}
            >
              <CircleArrowIcon size={44} />
            </button>
            <button
              type="button"
              aria-label={copy.nextLabel}
              onClick={() => select(active + 1)}
            >
              <CircleArrowIcon size={44} direction="right" />
            </button>
          </div>
        </div>
      </section>
      <figure className="field-case-testimonial" data-header-tone="dark">
        <Photo
          image={testimonial.image}
          desktopSrc={testimonial.desktopImage.src}
          fullWidth
          reveal
        />
        <blockquote>
          <p>{testimonial.quote}</p>
          <footer>{testimonial.attribution}</footer>
        </blockquote>
      </figure>
      <section className="field-case-section">
        <h2>{next.title}</h2>
        <div className="field-case-grid-three field-case-next">
          {next.entries.map((item) => (
            <article key={item.title}>
              <span>{item.label}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
