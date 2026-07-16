#!/usr/bin/env node
/**
 * Dual-model PR review orchestrator.
 * Env: GITHUB_TOKEN, ANTHROPIC_API_KEY, OPENAI_API_KEY, REPO ("owner/name"), PR_NUMBER
 * Runs from the DEFAULT-branch checkout (trusted): .github/ai-review.yml and the
 * guideline files are read from that checkout, while the PR diff is fetched via the
 * GitHub API by PR_NUMBER — so PR-authored code/config never executes in this job.
 * No npm dependencies — Node 20+ global fetch only.
 */

import {
  readFileSync,
  writeFileSync,
  existsSync,
  appendFileSync,
} from 'node:fs'

const {
  GITHUB_TOKEN,
  ANTHROPIC_API_KEY,
  OPENAI_API_KEY,
  REPO,
  PR_NUMBER,
  GITHUB_OUTPUT,
  SKIP_GUIDELINES,
} = process.env

// When truthy ("1", "true", "yes"), reviewers run without any guideline files.
const skipGuidelines = /^(1|true|yes)$/i.test(SKIP_GUIDELINES ?? '')

// Fail fast with a clear message instead of a TypeError or a confusing 404 later.
// A single missing API key is tolerated — the run degrades to one reviewer.
const missingEnv = [
  ['GITHUB_TOKEN', GITHUB_TOKEN],
  ['REPO', REPO],
  ['PR_NUMBER', PR_NUMBER],
]
  .filter(([, v]) => !v)
  .map(([k]) => k)
if (!ANTHROPIC_API_KEY && !OPENAI_API_KEY)
  missingEnv.push('ANTHROPIC_API_KEY or OPENAI_API_KEY')
if (missingEnv.length) {
  console.error(`Missing required env var(s): ${missingEnv.join(', ')}`)
  process.exit(1)
}

const [OWNER, NAME] = REPO.split('/')

// -------------------------------------------------------- API constants ---

const API = {
  github: {
    baseUrl: 'https://api.github.com',
    version: '2026-03-10',
    accept: 'application/vnd.github+json',
  },
  anthropic: {
    baseUrl: 'https://api.anthropic.com',
    version: '2023-06-01',
    messagesPath: '/v1/messages',
  },
  openai: {
    baseUrl: 'https://api.openai.com',
    responsesPath: '/v1/responses',
  },
}

// ---------------------------------------------------------------- config ---

const DEFAULTS = {
  anthropic_model: 'claude-sonnet-5',
  openai_model: 'gpt-5.3-codex',
  synth_model: 'claude-haiku-4-5-20251001',
  max_diff_tokens: 80_000, // hard budget cap
  min_severity_to_post: 'major', // "critical" | "major" | "minor"
  ignore: [
    '**/package-lock.json',
    '**/yarn.lock',
    '**/pnpm-lock.yaml',
    '**/poetry.lock',
    '**/Cargo.lock',
    '**/go.sum',
    '**/*.min.js',
    '**/*.map',
    '**/dist/**',
    '**/vendor/**',
    '**/__snapshots__/**',
    '**/*.generated.*',
  ],
  guidelines_files: ['AGENTS.md', 'REVIEW.md', 'CONTRIBUTING.md'],
}

function loadConfig() {
  // Minimal YAML subset parser (key: value, and "- item" lists) to stay dep-free.
  // Any key present in .github/ai-review.yml fully REPLACES the matching
  // DEFAULTS entry — lists are NOT merged. A config file must restate every
  // default pattern it wants to keep.
  const cfg = { ...DEFAULTS }
  const path = '.github/ai-review.yml'
  if (!existsSync(path)) return cfg
  let currentList = null
  for (const raw of readFileSync(path, 'utf8').split('\n')) {
    const line = raw.replace(/#.*$/, '').trimEnd()
    if (!line.trim()) continue
    const listItem = line.match(/^\s+-\s+(.*)$/)
    if (listItem && currentList) {
      cfg[currentList].push(listItem[1].trim().replace(/^(["'])(.*)\1$/, '$2'))
      continue
    }
    const kv = line.match(/^([\w_]+):\s*(.*)$/)
    if (!kv) continue
    const [, key, val] = kv
    if (val === '') {
      cfg[key] = []
      currentList = key
    } else {
      // Strip surrounding quotes from scalars too, not just list items.
      const scalar = val.trim().replace(/^(["'])(.*)\1$/, '$2')
      cfg[key] = /^\d+$/.test(scalar) ? Number(scalar) : scalar
      currentList = null
    }
  }
  return cfg
}

const cfg = loadConfig()

// ------------------------------------------------------------ gh helpers ---

async function gh(path, opts = {}) {
  const res = await fetch(`${API.github.baseUrl}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: API.github.accept,
      'X-GitHub-Api-Version': API.github.version,
      ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
      ...opts.headers,
    },
  })
  if (!res.ok)
    throw new Error(`GitHub ${path} -> ${res.status}: ${await res.text()}`)
  return res.status === 204 ? null : res.json()
}

function globToRegex(glob) {
  // placeholders keep the single-star pass from mangling the double-star expansions
  return new RegExp(
    '^' +
      glob
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*\*\//g, '\u0000')
        .replace(/\*\*/g, '\u0001')
        .replace(/\*/g, '[^/]*')
        .replace(/\u0000/g, '(?:.*/)?')
        .replace(/\u0001/g, '.*') +
      '$'
  )
}
const ignoreRes = cfg.ignore.map(globToRegex)
const isIgnored = (f) => ignoreRes.some((re) => re.test(f))
const approxTokens = (s) => Math.ceil(s.length / 4)

// --- cost telemetry (pilot): prices in $/MTok, printed to the Actions log ---
// Keep this in sync with the models referenced in .github/ai-review.yml and the
// DEFAULTS above (anthropic_model / openai_model / synth_model).
const PRICES = {
  'claude-opus-4-8': { in: 5, out: 25 },
  'claude-sonnet-5': { in: 3, out: 15 },
  'claude-haiku-4-5-20251001': { in: 1, out: 5 },
  'gpt-5.3-codex': { in: 1.75, out: 14 },
  'gpt-5.4-2026-03-05': { in: 2.5, out: 15 },
  'gpt-5.6-terra': { in: 2.5, out: 15 },
}
let totalCost = 0
const unpricedModels = new Set()
function logUsage(label, model, inTok, outTok) {
  const p = PRICES[model]
  if (!p) {
    // No price configured — the cost estimate below excludes this model.
    if (!unpricedModels.has(model)) {
      unpricedModels.add(model)
      console.warn(
        `[cost] ⚠️  No price configured for model "${model}". Its usage is excluded ` +
          `from the total estimate — add it to PRICES in scripts/ai-review/review.mjs.`
      )
    }
    console.log(
      `[cost] ${label} (${model}): ${inTok} in / ${outTok} out ≈ $? (price unknown)`
    )
    return
  }
  const cost = (inTok * p.in + outTok * p.out) / 1e6
  totalCost += cost
  console.log(
    `[cost] ${label} (${model}): ${inTok} in / ${outTok} out ≈ $${cost.toFixed(4)}`
  )
}

// ------------------------------------------------------------- get diff ----

async function getDiff() {
  const files = []
  for (let page = 1; ; page++) {
    const batch = await gh(
      `/repos/${OWNER}/${NAME}/pulls/${PR_NUMBER}/files?per_page=100&page=${page}`
    )
    files.push(...batch)
    if (batch.length < 100) break
  }
  const considered = files.filter((f) => !isIgnored(f.filename))
  const skipped = files.length - considered.length
  // GitHub omits `patch` for very large textual diffs; those files cannot be
  // reviewed, so they must be surfaced as a partial review, not dropped.
  const noPatch = considered.filter((f) => !f.patch).map((f) => f.filename)
  const kept = considered.filter((f) => f.patch)

  let budget = cfg.max_diff_tokens
  const chunks = []
  let omitted = 0
  for (const f of kept) {
    const chunk = `--- FILE: ${f.filename} (${f.status}, +${f.additions}/-${f.deletions}) ---\n${f.patch}\n`
    const cost = approxTokens(chunk)
    // Skip files that do not fit, but keep packing smaller ones after them.
    if (cost > budget) {
      omitted++
      continue
    }
    budget -= cost
    chunks.push(chunk)
  }
  return {
    diff: chunks.join('\n'),
    files: kept.map((f) => f.filename),
    fileCount: chunks.length,
    skipped,
    noPatch,
    omitted,
  }
}

// Collect the repo-root AGENTS.md plus any AGENTS.md sitting in a directory the
// diff touches — in a monorepo each app/package can carry its own instructions.
function collectAgentsFiles(changedFiles) {
  const found = new Set()
  if (existsSync('AGENTS.md')) found.add('AGENTS.md')
  for (const file of changedFiles) {
    const segs = file.split('/')
    // Filenames come from untrusted PR data — never let them escape the checkout.
    if (file.startsWith('/') || segs.includes('..')) continue
    for (let i = 1; i < segs.length; i++) {
      const candidate = `${segs.slice(0, i).join('/')}/AGENTS.md`
      if (existsSync(candidate)) found.add(candidate)
    }
  }
  // Root first, then deeper paths — deterministic ordering.
  return [...found].sort(
    (a, b) => a.split('/').length - b.split('/').length || a.localeCompare(b)
  )
}

function loadGuidelines(changedFiles = []) {
  if (skipGuidelines) return ''
  // Honour the configured priority list: the first entry that yields content wins.
  // AGENTS.md is special-cased to gather every relevant file, not just the root one.
  for (const name of cfg.guidelines_files) {
    if (name === 'AGENTS.md') {
      const files = collectAgentsFiles(changedFiles)
      if (files.length) {
        console.log(`Guidelines loaded from: ${files.join(', ')}`)
        return files
          .map((f) => `--- ${f} ---\n${readFileSync(f, 'utf8')}`)
          .join('\n\n')
          .slice(0, 20_000)
      }
    } else if (existsSync(name)) {
      console.log(`Guidelines loaded from: ${name}`)
      return readFileSync(name, 'utf8').slice(0, 20_000)
    }
  }
  console.warn(
    `[warn] none of the configured guideline files exist (${cfg.guidelines_files.join(', ')}) — reviewing without guidelines.`
  )
  return ''
}

// ------------------------------------------------------------- reviewers ---

const REVIEW_SCHEMA = `Respond with ONLY a JSON object, no markdown fences, matching:
{
  "issues": [
    {
      "file": "path/to/file.py",
      "line": 42,                       // line number in the NEW version of the file
      "severity": "critical|major|minor|nit",
      "category": "bug|security|performance|correctness|maintainability",
      "issue": "one-paragraph description of the problem",
      "suggested_fix": "concrete suggestion, with code if short"
    }
  ],
  "overall": "2-3 sentence overall assessment"
}
Severity guide: critical = will break in production, data loss, security hole.
major = real bug or serious flaw likely to bite. minor = worth fixing, not urgent.
nit = style/preference — use sparingly.
If the PR looks fine, return an empty issues array. Do NOT invent problems.`

function reviewPrompt(diff, guidelines) {
  return `Review this pull request diff. Focus on problems INTRODUCED by the change:
bugs, security issues, broken edge cases, races, incorrect logic, dangerous migrations.
Do not comment on pre-existing code style. Do not restate the diff.

Dependency versions: your training data has a knowledge cutoff and may be behind
the latest releases. Do NOT flag a dependency version as wrong, invalid, or
"does not exist", and do NOT suggest downgrading, just because the version in the
diff is newer than the latest you are aware of — assume a version greater than
what you know is a legitimate newer release. Only raise version issues you can
justify from the diff itself: incoherence between package.json files in the same
repo (e.g. the same dependency pinned to different versions across workspaces, or
a version that contradicts a range/constraint declared elsewhere in the change).
${guidelines ? `\nTeam guidelines to respect:\n<guidelines>\n${guidelines}\n</guidelines>\n` : ''}
<diff>
${diff}
</diff>

${REVIEW_SCHEMA}`
}

async function claudeReview(diff, guidelines) {
  const res = await fetch(
    `${API.anthropic.baseUrl}${API.anthropic.messagesPath}`,
    {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': API.anthropic.version,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: cfg.anthropic_model,
        max_tokens: 4000,
        system: [
          {
            type: 'text',
            text: 'You are a rigorous senior code reviewer. You output only valid JSON.',
            cache_control: { type: 'ephemeral' }, // prompt caching on the stable part
          },
        ],
        messages: [{ role: 'user', content: reviewPrompt(diff, guidelines) }],
      }),
    }
  )
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`)
  const data = await res.json()
  logUsage(
    'reviewer-claude',
    cfg.anthropic_model,
    (data.usage?.input_tokens ?? 0) +
      (data.usage?.cache_read_input_tokens ?? 0),
    data.usage?.output_tokens ?? 0
  )
  return parseReview(
    data.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join(''),
    'claude'
  )
}

async function codexReview(diff, guidelines) {
  const res = await fetch(`${API.openai.baseUrl}${API.openai.responsesPath}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: cfg.openai_model,
      max_output_tokens: 4000,
      input: [
        {
          role: 'system',
          content:
            'You are a rigorous senior code reviewer. You output only valid JSON.',
        },
        { role: 'user', content: reviewPrompt(diff, guidelines) },
      ],
    }),
  })
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`)
  const data = await res.json()
  logUsage(
    'reviewer-codex',
    cfg.openai_model,
    data.usage?.input_tokens ?? 0,
    data.usage?.output_tokens ?? 0
  )
  const text =
    (data.output ?? [])
      .flatMap((o) => o.content ?? [])
      .filter((c) => c.type === 'output_text')
      .map((c) => c.text)
      .join('') ||
    data.output_text ||
    ''
  return parseReview(text, 'codex')
}

function parseReview(text, source) {
  const cleaned = text.replace(/```json|```/g, '').trim()
  // Direct parse first; brace-slicing is only a fallback for prose-wrapped JSON.
  let parsed
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    try {
      parsed = JSON.parse(
        cleaned.slice(cleaned.indexOf('{'), cleaned.lastIndexOf('}') + 1)
      )
    } catch {
      console.error(
        `[warn] ${source} returned unparseable output; treating as empty review.`
      )
      return { issues: [], overall: `(${source} output could not be parsed)` }
    }
  }
  parsed.issues = (parsed.issues ?? []).map((i) => ({ ...i, source }))
  return parsed
}

// -------------------------------------------------------------- synthesis --

function synthesisPrompt(reviewA, reviewB) {
  return `Two independent AI reviewers analyzed the same pull request.

Reviewer A (Claude):
${JSON.stringify(reviewA, null, 2)}

Reviewer B (Codex):
${JSON.stringify(reviewB, null, 2)}

Merge them:
1. Deduplicate — same file+problem reported twice becomes ONE issue; keep the clearer wording.
2. Mark "agreement": true on issues both reviewers found (strong signal), false otherwise.
3. Drop all "nit" issues entirely. Keep severities honest — do not inflate.
4. Sort by severity: critical, major, minor.

Respond with ONLY JSON:
{
  "issues": [{ "file", "line", "severity", "category", "issue", "suggested_fix", "agreement" }],
  "summary": "3-5 sentence synthesis for the PR author: overall assessment + the key risks"
}`
}

async function synthesizeWithAnthropic(reviewA, reviewB) {
  const res = await fetch(
    `${API.anthropic.baseUrl}${API.anthropic.messagesPath}`,
    {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': API.anthropic.version,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: cfg.synth_model,
        max_tokens: 4000,
        messages: [{ role: 'user', content: synthesisPrompt(reviewA, reviewB) }],
      }),
    }
  )
  if (!res.ok)
    throw new Error(`Anthropic synth ${res.status}: ${await res.text()}`)
  const data = await res.json()
  logUsage(
    'synthesizer',
    cfg.synth_model,
    data.usage?.input_tokens ?? 0,
    data.usage?.output_tokens ?? 0
  )
  return parseReview(
    data.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join(''),
    'synth'
  )
}

// Used when the Anthropic API is down: reuse the OpenAI reviewer model for
// synthesis — it is cheap enough and known reachable, its review just succeeded.
async function synthesizeWithOpenAI(reviewA, reviewB) {
  const res = await fetch(`${API.openai.baseUrl}${API.openai.responsesPath}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: cfg.openai_model,
      max_output_tokens: 4000,
      input: [{ role: 'user', content: synthesisPrompt(reviewA, reviewB) }],
    }),
  })
  if (!res.ok)
    throw new Error(`OpenAI synth ${res.status}: ${await res.text()}`)
  const data = await res.json()
  logUsage(
    'synthesizer',
    cfg.openai_model,
    data.usage?.input_tokens ?? 0,
    data.usage?.output_tokens ?? 0
  )
  const text =
    (data.output ?? [])
      .flatMap((o) => o.content ?? [])
      .filter((c) => c.type === 'output_text')
      .map((c) => c.text)
      .join('') ||
    data.output_text ||
    ''
  return parseReview(text, 'synth')
}

// ------------------------------------------------------------ post review --

const RANK = { critical: 3, major: 2, minor: 1, nit: 0 }

// Models sometimes return a null/missing/non-numeric line — anchor only valid ones.
function issueLine(i) {
  const n = Number(i.line)
  return Number.isInteger(n) && n > 0 ? n : null
}

async function postReview(merged, meta) {
  const minRank = RANK[cfg.min_severity_to_post] ?? 2
  const toPost = merged.issues.filter((i) => (RANK[i.severity] ?? 0) >= minRank)
  const criticals = merged.issues.filter((i) => i.severity === 'critical')
  const others = toPost.filter((i) => i.severity !== 'critical')

  const icon = { critical: '🔴', major: '🟠', minor: '🟡' }
  const warnings = []
  if (meta.omitted)
    warnings.push(
      `⚠️ ${meta.omitted} file(s) exceeded the diff token budget and were NOT reviewed — review is partial.`
    )
  if (meta.noPatch.length)
    warnings.push(
      `⚠️ ${meta.noPatch.length} file(s) had no reviewable diff from GitHub (too large) and were NOT reviewed — ` +
        `review is partial: ${meta.noPatch.slice(0, 10).join(', ')}` +
        (meta.noPatch.length > 10 ? ', …' : '')
    )
  if (meta.claudeFailed)
    warnings.push(
      `⚠️ The ${cfg.anthropic_model} reviewer failed — this is a single-model review ` +
        `(${cfg.openai_model} reviewed and synthesized).`
    )
  if (meta.codexFailed)
    warnings.push(
      `⚠️ The ${cfg.openai_model} reviewer failed — this is a single-model review ` +
        `(${cfg.anthropic_model} only).`
    )
  if (meta.synthFailed)
    warnings.push(
      '⚠️ The synthesis step failed — showing unmerged reviewer output (may contain duplicates).'
    )

  const anchored = toPost.filter((i) => issueLine(i) !== null)
  const unanchored = toPost.filter((i) => issueLine(i) === null)

  const body = [
    `## 🤖 AI Review (${cfg.anthropic_model} + ${cfg.openai_model})`,
    '',
    merged.summary ?? '',
    '',
    `**${criticals.length} critical**, ${others.length} other issue(s) shown ` +
      `(threshold: ${cfg.min_severity_to_post}).` +
      (meta.skipped ? ` ${meta.skipped} generated/lock file(s) skipped.` : ''),
    ...(warnings.length ? ['', ...warnings] : []),
    ...(unanchored.length
      ? [
          '',
          'Issues without a line anchor:',
          ...unanchored.map(
            (i) =>
              `- ${icon[i.severity] ?? '•'} **${i.severity}** \`${i.file}\` — ${i.issue}` +
              (i.suggested_fix ? ` **Suggested fix:** ${i.suggested_fix}` : '')
          ),
        ]
      : []),
  ].join('\n')

  const comments = anchored.map((i) => ({
    path: i.file,
    line: issueLine(i),
    side: 'RIGHT',
    body:
      `${icon[i.severity] ?? '•'} **${i.severity.toUpperCase()}** (${i.category})` +
      `${i.agreement ? ' — flagged by both models' : ''}\n\n${i.issue}\n\n` +
      (i.suggested_fix ? `**Suggested fix:** ${i.suggested_fix}` : ''),
  }))

  if (process.env.DRY_RUN) {
    console.log('\n===== DRY RUN — review that WOULD be posted =====\n')
    console.log(body)
    for (const c of comments)
      console.log(`\n--- ${c.path}:${c.line} ---\n${c.body}`)
    return criticals
  }

  try {
    await gh(`/repos/${OWNER}/${NAME}/pulls/${PR_NUMBER}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ event: 'COMMENT', body, comments }),
    })
  } catch (e) {
    // Inline anchors can fail if a model hallucinated a line number — fall back to summary-only
    console.error(
      `[warn] inline review failed (${e.message}); posting summary + list instead.`
    )
    const flat = anchored
      .map(
        (i) =>
          `- ${icon[i.severity] ?? '•'} **${i.severity}** \`${i.file}:${issueLine(i)}\` — ${i.issue}`
      )
      .join('\n')
    await gh(`/repos/${OWNER}/${NAME}/issues/${PR_NUMBER}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body: `${body}\n\n${flat}` }),
    })
  }
  return criticals
}

// ------------------------------------------------------------------ main ---

const { diff, files, fileCount, skipped, noPatch, omitted } = await getDiff()
if (!diff.trim()) {
  const body = noPatch.length
    ? `🤖 AI review could NOT run: GitHub returned no reviewable diff for ${noPatch.length} ` +
      `changed file(s) (diffs too large): ${noPatch.slice(0, 10).join(', ')}` +
      `${noPatch.length > 10 ? ', …' : ''}. These changes were NOT reviewed.`
    : '🤖 Nothing reviewable in this PR after filtering (lockfiles/generated code are skipped).'
  await gh(`/repos/${OWNER}/${NAME}/issues/${PR_NUMBER}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  })
  if (GITHUB_OUTPUT) appendFileSync(GITHUB_OUTPUT, 'criticals=0\n')
  process.exit(0)
}
console.log(
  `Reviewing ${fileCount} files (~${approxTokens(diff)} tokens, ${skipped} skipped, ` +
    `${noPatch.length} without patch, ${omitted} over budget)`
)

if (skipGuidelines)
  console.log('Guideline files disabled via SKIP_GUIDELINES.')
const guidelines = loadGuidelines(files)

// Both reviewers in parallel; if ONE provider is down, degrade to a single-model review
const [a, b] = await Promise.allSettled([
  claudeReview(diff, guidelines),
  codexReview(diff, guidelines),
])
if (a.status === 'rejected' && b.status === 'rejected')
  throw new Error(`Both reviewers failed:\n${a.reason}\n${b.reason}`)
const claudeFailed = a.status === 'rejected'
const codexFailed = b.status === 'rejected'
if (claudeFailed) console.error(`[warn] Claude reviewer failed: ${a.reason}`)
if (codexFailed) console.error(`[warn] Codex reviewer failed: ${b.reason}`)
const reviewA = claudeFailed
  ? { issues: [], overall: '(Claude reviewer unavailable)' }
  : a.value
const reviewB = codexFailed
  ? { issues: [], overall: '(Codex reviewer unavailable)' }
  : b.value

// Synthesize on Anthropic normally; if the Claude reviewer failed, Anthropic is
// presumed down, so synthesize on the surviving OpenAI provider instead. If the
// synthesizer itself fails, degrade to a local merge rather than losing the review.
let merged
let synthFailed = false
try {
  merged = claudeFailed
    ? await synthesizeWithOpenAI(reviewA, reviewB)
    : await synthesizeWithAnthropic(reviewA, reviewB)
} catch (e) {
  synthFailed = true
  console.error(`[warn] synthesis failed (${e.message}); posting unmerged reviewer issues.`)
  merged = {
    issues: [...reviewA.issues, ...reviewB.issues]
      .filter((i) => i.severity !== 'nit')
      .sort((x, y) => (RANK[y.severity] ?? 0) - (RANK[x.severity] ?? 0)),
    summary: [reviewA.overall, reviewB.overall].filter(Boolean).join(' — '),
  }
}

const criticals = await postReview(merged, {
  skipped,
  noPatch,
  omitted,
  claudeFailed,
  codexFailed,
  synthFailed,
})

writeFileSync('critical-issues.json', JSON.stringify(criticals, null, 2))
if (GITHUB_OUTPUT)
  appendFileSync(GITHUB_OUTPUT, `criticals=${criticals.length}\n`)
console.log(
  `Done: ${merged.issues.length} merged issues, ${criticals.length} critical.`
)
console.log(
  `[cost] TOTAL for this review ≈ $${totalCost.toFixed(4)}` +
    (unpricedModels.size
      ? ` (excludes unpriced model(s): ${[...unpricedModels].join(', ')})`
      : '')
)
