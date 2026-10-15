'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, ButtonArrowIcon, IconButton, XIcon } from '@acid-info/logos-ui'
import {
  zineDocumentSchema,
  type ZineDocument,
  type ZineIssue,
} from '@repo/content/schemas'
import { useTranslations } from 'next-intl'
import {
  articleTitle,
  nextPage,
  searchDocument,
  visiblePages,
  type ReaderView,
} from '@/lib/zines/reader-state'
import { useReaderLocation } from '@/lib/zines/use-reader-location'
import { ZineToolbar, type ReaderPanel } from './zine-toolbar'
import { ZineNavigation } from './zine-navigation'
import { ZinePage } from './zine-page'
import { ZineContents } from './zine-contents'
import { ZineSearch } from './zine-search'
import { ZineSelection } from './zine-selection'
import './zines.css'

export function ZineReader({ issue }: { issue: ZineIssue }) {
  const t = useTranslations('zines')
  const { state, mobile, navigate } = useReaderLocation(issue.pageCount)
  const [document, setDocument] = useState<ZineDocument | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [panel, setPanel] = useState<ReaderPanel>(null)
  const [hoverPage, setHoverPage] = useState<number | null>(null)
  const touch = useRef<{ x: number; y: number } | null>(null)
  const view = mobile && state.view === 'spreads' ? 'pages' : state.view
  const guided = view === 'guided'
  const spreads = view === 'spreads'
  const numbers = visiblePages(state.page, issue.pageCount, spreads)
  const page = document?.pages[state.page]
  const blockIndex = Math.min(
    state.block,
    Math.max(0, (page?.blocks.length ?? 1) - 1)
  )
  const block = guided ? page?.blocks[blockIndex] : undefined
  const hits = useMemo(
    () => (document ? searchDocument(document, state.query) : []),
    [document, state.query]
  )
  const label = (number: number): string =>
    number === 0
      ? t('cover')
      : number === issue.pageCount - 1
        ? t('backCover')
        : t('page', { page: String(number).padStart(2, '0') })
  const selectPage = (number: number): void => {
    navigate({
      page: number,
      block: 0,
      start: null,
      end: null,
      ...(view === 'grid' ? { view: mobile ? 'pages' : 'spreads' } : {}),
    })
    if (panel === 'contents') setPanel(null)
    window.getSelection()?.removeAllRanges()
  }
  const move = (direction: -1 | 1): void => {
    if (guided && page?.blocks.length) {
      const next = blockIndex + direction
      if (next >= 0 && next < page.blocks.length) {
        navigate({ block: next })
        return
      }
      const target = nextPage(state.page, issue.pageCount, false, direction)
      if (target === state.page) return
      navigate({
        page: target,
        block:
          direction === -1
            ? Math.max(0, (document?.pages[target].blocks.length ?? 1) - 1)
            : 0,
        start: null,
        end: null,
      })
    } else selectPage(nextPage(state.page, issue.pageCount, spreads, direction))
  }

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/zines/generated/${issue.slug}/document.json`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Zine document unavailable')
        const result = zineDocumentSchema.parse(await response.json())
        if (
          result.slug !== issue.slug ||
          result.pages.length !== issue.pageCount
        )
          throw new Error('Zine document mismatch')
        setDocument(result)
        setFailed(false)
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true)
      })
    return () => controller.abort()
  }, [issue.slug, issue.pageCount, attempt])

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setPanel(null)
        if (guided) navigate({ view: 'pages' })
        return
      }
      if (
        event.target instanceof Element &&
        event.target.closest(
          'input, textarea, select, [contenteditable="true"]'
        )
      )
        return
      if (
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        window.getSelection()?.toString()
      )
        return
      if (
        view !== 'grid' &&
        (event.key === 'ArrowRight' || event.key === 'ArrowLeft')
      ) {
        event.preventDefault()
        move(event.key === 'ArrowRight' ? 1 : -1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const showView = (next: ReaderView): void => {
    navigate({ view: next, block: 0 })
    setPanel(null)
  }
  const navButton = (direction: -1 | 1) => (
    <IconButton
      variant="outline"
      size="sm"
      className="zine-arrow cursor-pointer"
      aria-label={t(
        guided
          ? direction === -1
            ? 'previousBlock'
            : 'nextBlock'
          : direction === -1
            ? 'previousPage'
            : 'nextPage'
      )}
      disabled={
        direction === -1
          ? state.page === 0 && (!guided || blockIndex === 0)
          : state.page === issue.pageCount - 1 &&
            (!guided || blockIndex >= (page?.blocks.length ?? 1) - 1)
      }
      onClick={() => move(direction)}
    >
      <ButtonArrowIcon className={direction === -1 ? 'rotate-180' : ''} />
    </IconButton>
  )

  return (
    <div className="zine-reader" data-view={view}>
      <ZineToolbar
        issue={issue}
        view={view}
        panel={panel}
        showView={showView}
        setPanel={setPanel}
      />

      {!document ? (
        <div className="zine-loading" role="status">
          <p>{t(failed ? 'loadFailed' : 'loading')}</p>
          {failed && (
            <Button
              icon={false}
              className="cursor-pointer"
              onClick={() => setAttempt((value) => value + 1)}
            >
              {t('retry')}
            </Button>
          )}
          <Button href={issue.pdf} download className="cursor-pointer">
            {t('download')}
          </Button>
        </div>
      ) : (
        <div className="zine-body">
          <div className="zine-main">
            {view === 'grid' ? (
              <div className="zine-grid-layout">
                <ZineContents
                  issue={issue}
                  page={state.page}
                  onSelect={selectPage}
                  onHover={setHoverPage}
                />
                <div className="zine-grid" aria-label={t('grid')}>
                  {document.pages.map((item) => (
                    <button
                      type="button"
                      className="cursor-pointer"
                      key={item.number}
                      aria-label={label(item.number)}
                      data-active={
                        hoverPage === item.number || state.page === item.number
                      }
                      onClick={() => selectPage(item.number)}
                    >
                      <img
                        src={`/zines/generated/${issue.slug}/${item.number}-thumb.webp`}
                        alt=""
                        width={320}
                        height={453}
                        loading="lazy"
                      />
                      <span>
                        {item.number === 0 ||
                        item.number === issue.pageCount - 1
                          ? label(item.number)
                          : String(item.number).padStart(2, '0')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div
                  className={`zine-stage ${guided ? 'zine-guided-stage' : ''}`}
                  onTouchStart={(event) => {
                    touch.current = {
                      x: event.touches[0].clientX,
                      y: event.touches[0].clientY,
                    }
                  }}
                  onTouchEnd={(event) => {
                    const origin = touch.current
                    touch.current = null
                    if (!origin || window.getSelection()?.toString()) return
                    const dx = event.changedTouches[0].clientX - origin.x
                    const dy = event.changedTouches[0].clientY - origin.y
                    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5)
                      move(dx < 0 ? 1 : -1)
                  }}
                >
                  {!guided && (
                    <div className="zine-stage-prev zine-desktop">
                      {navButton(-1)}
                    </div>
                  )}
                  <div
                    className={`zine-sheets ${spreads && numbers.length === 2 ? 'zine-spread' : ''}`}
                  >
                    {guided && (
                      <h2 className="zine-guided-heading">
                        {articleTitle(issue, state.page)}
                      </h2>
                    )}
                    {(guided ? [state.page] : numbers).map((number) => (
                      <ZinePage
                        key={number}
                        slug={issue.slug}
                        page={document.pages[number]}
                        label={label(number)}
                        block={block}
                        highlights={[
                          ...hits.filter((hit) => hit.page === number),
                          ...(number === state.page &&
                          state.start !== null &&
                          state.end !== null &&
                          state.start >= 0 &&
                          state.end > state.start
                            ? [{ start: state.start, end: state.end }]
                            : []),
                        ]}
                      />
                    ))}
                    {guided && (
                      <>
                        <div className="zine-block-progress" aria-hidden="true">
                          {(page?.blocks ?? []).map((_, index) => (
                            <span
                              key={index}
                              data-active={index <= blockIndex}
                            />
                          ))}
                        </div>
                        <p className="zine-page-status" role="status">
                          {page?.blocks.length
                            ? t('blockStatus', {
                                block: blockIndex + 1,
                                count: page.blocks.length,
                                page: String(state.page).padStart(2, '0'),
                              })
                            : label(state.page)}
                        </p>
                      </>
                    )}
                  </div>
                  {!guided && (
                    <div className="zine-stage-next zine-desktop">
                      {navButton(1)}
                    </div>
                  )}
                </div>
                {guided ? (
                  <div className="zine-guided-nav">
                    {navButton(-1)}
                    <span>{t('swipe')}</span>
                    {navButton(1)}
                  </div>
                ) : (
                  <>
                    <ZineNavigation
                      issue={issue}
                      page={state.page}
                      numbers={numbers}
                      label={label}
                      selectPage={selectPage}
                      showView={showView}
                    />
                  </>
                )}
              </>
            )}
          </div>
          {panel === 'search' && (
            <ZineSearch
              issue={issue}
              query={state.query}
              hits={hits}
              onQuery={(query) => navigate({ query }, true)}
              onClose={() => setPanel(null)}
              onSelect={(hit) => {
                navigate({
                  page: hit.page,
                  start: hit.start,
                  end: hit.end,
                  view: mobile ? 'pages' : 'spreads',
                  block: 0,
                })
                if (mobile) setPanel(null)
              }}
            />
          )}
          {panel === 'contents' && (
            <aside className="zine-contents-panel">
              <div className="zine-panel-heading">
                <h2>{issue.shortTitle}</h2>
                <button
                  type="button"
                  className="cursor-pointer"
                  onClick={() => setPanel(null)}
                  aria-label={t('closeContents')}
                >
                  <XIcon />
                </button>
              </div>
              <ZineContents
                issue={issue}
                page={state.page}
                onSelect={selectPage}
              />
              <Button
                href={issue.pdf}
                download
                icon={false}
                className="cursor-pointer"
              >
                {t('download')}
              </Button>
            </aside>
          )}
        </div>
      )}
      <ZineSelection
        key={`${state.page}-${view}`}
        locationKey={`${state.page}-${view}`}
      />
      <noscript>
        <p>
          {t('javascriptRequired')}{' '}
          <a href={issue.pdf} className="cursor-pointer">
            {t('download')}
          </a>
        </p>
      </noscript>
    </div>
  )
}
