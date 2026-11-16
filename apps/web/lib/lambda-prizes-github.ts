import { cache } from 'react'

import { githubMarkdownDirectory } from '@/lib/github-markdown'

const repo = 'logos-co/lambda-prize'
const directory = githubMarkdownDirectory(repo, 'prizes')
const solutions = githubMarkdownDirectory(repo, 'solutions')
const prizeFile = /^LP-(?!0000)\d{4}\.md$/

export interface GithubPrize {
  id: string
  title: string
  status: 'open' | 'draft' | 'closed'
  amount: number | null
  size: string
  summary: string
  href: string
}

export function parsePrizeMarkdown(
  raw: string,
  id: string,
  href: string
): GithubPrize {
  const heading = raw.match(
    /^# (LP-\d+): (.+?)\s+\[(OPEN|DRAFT|CLOSED)\]\s*$/im
  )
  const status = (
    raw.match(/^\*\*`Status:\s*(open|closed|draft)\b[^`]*`\*\*/im)?.[1] ??
    heading?.[3]
  )?.toLowerCase()
  const title = heading?.[2]?.trim()
  if (
    heading?.[1] !== id ||
    !title ||
    (status !== 'open' && status !== 'draft' && status !== 'closed')
  ) {
    throw new Error(`Invalid title or status in ${id}`)
  }

  const structure = raw.split(/^## Prize Structure\s*$/im)[1]?.split(/^## /m)[0]
  const amountText = structure?.match(
    /^- \*\*Total Prize:\*\*\s*\$([\d,]+(?:\.\d{1,2})?)\s*$/m
  )?.[1]
  const amount = amountText ? Number(amountText.replaceAll(',', '')) : null
  const size =
    structure?.match(/^- \*\*Effort:\*\*\s*(.+)$/m)?.[1]?.trim() ?? ''
  if (
    status === 'open' &&
    (amount === null || !Number.isFinite(amount) || !size)
  ) {
    throw new Error(`Invalid prize amount or effort in ${id}`)
  }

  const summary =
    raw
      .match(/^## Overview\s*\n\s*([^\n]+(?:\n[^\n#]+)*)/im)?.[1]
      ?.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*_`]/g, '')
      .replace(/\s+/g, ' ')
      .trim() ?? ''

  return { id, title, status, amount, size, summary, href }
}

export const fetchGithubPrizes = cache(async () => {
  const [prizeFiles, solutionFiles] = await Promise.all([
    directory.list(),
    solutions.list(),
  ])
  const files = prizeFiles.filter((file) => prizeFile.test(file.name))
  if (files.length === 0)
    throw new Error('GitHub returned no prize specifications')

  const prizes = await Promise.all(
    files.map(async (file) => {
      const raw = await directory.read(file)
      if (!raw) throw new Error(`Failed to fetch prize ${file.name}`)
      return parsePrizeMarkdown(
        raw,
        file.name.slice(0, -3),
        `https://github.com/${repo}/blob/master/prizes/${file.name}`
      )
    })
  )
  const awardedIds = new Set(
    solutionFiles
      .filter((file) => prizeFile.test(file.name))
      .map((file) => file.name.slice(0, -3))
  )
  return { prizes, awardedIds }
})
