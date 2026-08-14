import type { ScoutEvidenceSeed } from '@/server/db/scout-fixtures'

import { fetchFromSource } from './source-fetch'
import {
  carriesPersonalData,
  duckduckgoPolicy,
  wikipediaPolicy,
} from './source-policies'

const DAY = 24 * 60 * 60 * 1000

interface WikipediaSearchResponse {
  pages?: { key: string; title: string }[]
}

interface WikipediaSummary {
  title: string
  description?: string
  extract?: string
  type?: string
  content_urls?: { desktop?: { page?: string } }
}

interface DuckDuckGoAnswer {
  Heading?: string
  Abstract?: string
  AbstractURL?: string
  AbstractSource?: string
}

function safeText(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  return carriesPersonalData(trimmed) ? null : trimmed
}

function normalise(value: string): string {
  return value.toLocaleLowerCase('en').replace(/[^a-z0-9]/g, '')
}

/**
 * Decides whether a reference entry is about the same organisation.
 *
 * Looking a name up in a reference work and believing the answer is how
 * "Warpnet", a censorship-resistant networking project, acquires a Wikipedia
 * article about a Sheffield record label. The rubric would catch it as two
 * sources disagreeing, but a contradiction between two different subjects is
 * not a contradiction: it is a mistake wearing the costume of evidence.
 *
 * The test is deliberately strict. A missed corroboration leaves a candidate
 * at "not enough evidence", which is true and costs a reviewer one lookup; a
 * false one puts somebody else's facts on the page.
 */
export function describesSameEntity(name: string, title: string): boolean {
  const subject = normalise(name)
  const entry = normalise(title)
  if (subject.length < 4 || entry.length < 4) return false
  return entry.includes(subject) || subject.includes(entry)
}

/**
 * A second, independent account of the same organisation.
 *
 * The rubric refuses to judge fit from a single source, and an organisation
 * describing itself is one source however many of its own pages are read. A
 * reference work is the cheapest independent corroboration available without
 * a contract, and it is the one most likely to disagree, which is the useful
 * part.
 */
export async function corroborateFromWikipedia(
  name: string
): Promise<ScoutEvidenceSeed[]> {
  // Searched rather than guessed from the name: an organisation's article is
  // rarely titled exactly as the organisation writes itself, and a guess that
  // misses returns 404 for everything that does have an article. The search
  // widens what is found; the entity test below decides what is believed.
  const search = await fetchFromSource<WikipediaSearchResponse>(
    wikipediaPolicy,
    `https://en.wikipedia.org/w/rest.php/v1/search/title?q=${encodeURIComponent(name)}&limit=3`
  )

  const match = (search.pages ?? []).find((page) =>
    describesSameEntity(name, page.title)
  )
  if (!match) return []

  const summary = await fetchFromSource<WikipediaSummary>(
    wikipediaPolicy,
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(match.key)}`
  )

  // Disambiguation pages describe several things and therefore describe none
  // of them: treating one as corroboration would be inventing agreement.
  if (summary.type && summary.type !== 'standard') return []

  const page = summary.content_urls?.desktop?.page
  const description = safeText(summary.description)
  const extract = safeText(summary.extract)

  if (!page || !description || !extract) return []
  if (!describesSameEntity(name, summary.title)) return []

  return [
    {
      field: 'theme_match',
      value: description.slice(0, 120),
      sourceUrl: page,
      sourceTitle: `${summary.title} on Wikipedia`,
      excerpt: extract.slice(0, 400),
      contentHash: `${wikipediaPolicy.extractorVersion}:${page}`,
      extractionMethod: 'deterministic',
      extractorVersion: wikipediaPolicy.extractorVersion,
      certainty: 'derived',
      observedAt: new Date(),
      expiresAt: new Date(Date.now() + wikipediaPolicy.evidenceTtlDays * DAY),
    },
  ]
}

/**
 * Looks the organisation up in DuckDuckGo's instant answers.
 *
 * The evidence records the URL the abstract came from rather than the query
 * that found it, so when the answer is drawn from a reference work already
 * read, the two collapse into one source instead of counting twice. Two
 * lookups of the same page are not two independent sources, and the gate that
 * requires two would otherwise be trivial to satisfy.
 */
export async function corroborateFromDuckDuckGo(
  name: string
): Promise<ScoutEvidenceSeed[]> {
  const answer = await fetchFromSource<DuckDuckGoAnswer>(
    duckduckgoPolicy,
    `https://api.duckduckgo.com/?q=${encodeURIComponent(name)}&format=json&no_html=1&no_redirect=1&t=logos-scout`
  )

  const abstract = safeText(answer.Abstract)
  const url = answer.AbstractURL

  if (!abstract || !url) return []
  if (!describesSameEntity(name, answer.Heading ?? '')) return []

  return [
    {
      field: 'theme_match',
      value: safeText(answer.Heading)?.slice(0, 120) ?? name,
      sourceUrl: url,
      sourceTitle: `${answer.AbstractSource ?? 'Reference'}: ${answer.Heading ?? name}`,
      excerpt: abstract.slice(0, 400),
      contentHash: `${duckduckgoPolicy.extractorVersion}:${url}`,
      extractionMethod: 'deterministic',
      extractorVersion: duckduckgoPolicy.extractorVersion,
      certainty: 'derived',
      observedAt: new Date(),
      expiresAt: new Date(Date.now() + duckduckgoPolicy.evidenceTtlDays * DAY),
    },
  ]
}
