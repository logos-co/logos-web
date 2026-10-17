import type { ZineDocument, ZineIssue } from '@repo/content/schemas'

export type ReaderView = 'spreads' | 'pages' | 'grid' | 'guided'
export type ReaderPanel = 'search' | 'contents' | 'print' | null
export interface ReaderState {
  page: number
  view: ReaderView
  block: number
  query: string
  start: number | null
  end: number | null
  panel: ReaderPanel
}

const integer = (value: string | null, fallback: number): number =>
  value !== null && /^\d+$/.test(value) ? Number(value) : fallback

export function readState(search: string, pageCount: number): ReaderState {
  const params = new URLSearchParams(search)
  const view = params.get('view')
  const panel = params.get('panel')
  return {
    page: Math.min(integer(params.get('page'), 0), pageCount - 1),
    view:
      view === 'pages' || view === 'grid' || view === 'guided'
        ? view
        : 'spreads',
    block: integer(params.get('block'), 0),
    query: (params.get('q') ?? '').slice(0, 120),
    start: params.has('start') ? integer(params.get('start'), -1) : null,
    end: params.has('end') ? integer(params.get('end'), -1) : null,
    panel:
      panel === 'print' || panel === 'contents' || panel === 'search'
        ? panel
        : !params.has('panel') && params.get('q')?.trim() && view !== 'guided'
          ? 'search'
          : null,
  }
}

export function visiblePages(
  page: number,
  pageCount: number,
  spreads: boolean
): number[] {
  if (!spreads || page === 0 || page === pageCount - 1) return [page]
  const left = page % 2 === 0 ? page - 1 : page
  return [left, left + 1].filter((number) => number < pageCount - 1)
}

export function nextPage(
  page: number,
  pageCount: number,
  spreads: boolean,
  direction: -1 | 1
): number {
  const visible = visiblePages(page, pageCount, spreads)
  return Math.max(
    0,
    Math.min(
      pageCount - 1,
      direction === 1 ? visible[visible.length - 1] + 1 : visible[0] - 1
    )
  )
}

export function printedPageNumber(
  issue: Pick<ZineIssue, 'pageNumberOffset'>,
  page: number
): string {
  return String(page + (issue.pageNumberOffset ?? 0)).padStart(2, '0')
}

export function articleTitle(issue: ZineIssue, page: number, word = 0): string {
  const entries = issue.sections
    .flatMap((section) => section.entries)
    .filter(
      (entry) =>
        entry.page < page ||
        (entry.page === page && (entry.startWord ?? 0) <= word)
    )
  return (
    issue.pageTitles[String(page)] ??
    entries[entries.length - 1]?.title ??
    issue.title
  )
}

export interface SearchHit {
  page: number
  start: number
  end: number
  before: string
  match: string
  after: string
}

export function searchDocument(
  document: ZineDocument,
  query: string
): SearchHit[] {
  const needle = query.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
  if (!needle) return []
  return document.pages.flatMap((page) => {
    const offsets: number[] = []
    let text = ''
    for (const word of page.words) {
      offsets.push(text.length)
      text += `${word.text} `
    }
    const lower = text.toLocaleLowerCase()
    const hits: SearchHit[] = []
    let offset = lower.indexOf(needle)
    while (offset !== -1) {
      const start = offsets.findIndex(
        (position, index) =>
          position <= offset && (offsets[index + 1] ?? Infinity) > offset
      )
      const end = offsets.findIndex(
        (position) => position >= offset + needle.length
      )
      const block = page.blocks.find(
        (item) => start >= item.start && start < item.end
      )
      const contextStart = block ? offsets[block.start] : 0
      const contextEnd = block
        ? (offsets[block.end] ?? text.length)
        : text.length
      hits.push({
        page: page.number,
        start,
        end: end === -1 ? page.words.length : end,
        before: text.slice(Math.max(contextStart, offset - 55), offset),
        match: text.slice(offset, offset + needle.length),
        after: text.slice(
          offset + needle.length,
          Math.min(contextEnd, offset + needle.length + 85)
        ),
      })
      offset = lower.indexOf(needle, offset + needle.length)
    }
    return hits
  })
}
