// Regenerates the self-hosted Google fonts.
//
//   pnpm --filter web generate:fonts
//
// Downloads the same CSS and woff2 files `next/font/google` used to fetch at
// build time, so the site serves Google's exact files, subsets and
// unicode-ranges. Writes the files to public/fonts, the `localFont` loaders
// to app/google-fonts.ts and their size-adjusted fallbacks to
// app/google-fonts-fallback.css.

import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { getFallbackFontOverrideMetrics } from 'next/dist/compiled/@next/font/dist/google/get-fallback-font-override-metrics'

interface FamilyConfig {
  family: string
  exportName: string
  variable: string
  weights: number[]
  // Extra Latin loaders that expose the same faces under another variable.
  aliases?: { exportName: string; variable: string }[]
}

interface GeneratedFamily {
  loaders: string
  fallbackCss: string
}

interface FontFace {
  subset: string
  weight: string
  url: string
  unicodeRange: string
}

const FAMILIES: FamilyConfig[] = [
  {
    family: 'Public Sans',
    exportName: 'publicSans',
    variable: '--next-font-sans',
    weights: [400, 500, 600, 700],
  },
  {
    family: 'Open Sans',
    exportName: 'openSans',
    variable: '--next-font-article',
    weights: [400],
  },
  {
    family: 'Fira Code',
    exportName: 'firaCode',
    variable: '--next-font-mono',
    weights: [400, 500, 600],
    aliases: [
      {
        exportName: 'programmeMono',
        variable: '--developer-programmes-mono',
      },
    ],
  },
  {
    family: 'Fira Mono',
    exportName: 'firaMono',
    variable: '--next-font-mono-body',
    weights: [400, 700],
  },
]

// Google serves woff2 with unicode-range subsets only to modern browsers.
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'

// Pinned google/fonts commit for the OFL.txt licence files.
const OFL_REF = '7af0d90b4d532ffa4b041937b560c6df4e7b1e95'

const WEB_DIR = join(import.meta.dirname, '..')
const FONTS_DIR = join(WEB_DIR, 'public', 'fonts')

function slug(family: string): string {
  return family.toLowerCase().replaceAll(' ', '-')
}

function camel(value: string): string {
  return value.replace(/-(\w)/g, (_, char: string) => char.toUpperCase())
}

async function fetchOk(url: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(url, init)
  if (!response.ok) throw new Error(`${url} returned ${response.status}`)
  return response
}

async function fetchFaces(config: FamilyConfig): Promise<FontFace[]> {
  const query = `family=${config.family.replaceAll(' ', '+')}:wght@${config.weights.join(';')}&display=swap`
  const css = await (
    await fetchOk(`https://fonts.googleapis.com/css2?${query}`, {
      headers: { 'user-agent': USER_AGENT },
    })
  ).text()

  const faces = [
    ...css.matchAll(/\/\* ([\w-]+) \*\/\s*@font-face \{([^}]*)\}/g),
  ].map(([, subset, body]) => {
    const read = (prop: string): string => {
      const match = body.match(new RegExp(`${prop}: ([^;]+);`))
      if (!match) throw new Error(`${config.family} ${subset}: no ${prop}`)
      return match[1].trim()
    }
    const url = read('src').match(/url\((\S+?)\)/)?.[1]
    if (!url) throw new Error(`${config.family} ${subset}: no src url`)
    if (read('font-style') !== 'normal') {
      throw new Error(`${config.family} ${subset}: unexpected italic face`)
    }
    return {
      subset,
      weight: read('font-weight'),
      url,
      unicodeRange: read('unicode-range'),
    }
  })

  const weights = new Set(faces.map((face) => Number(face.weight)))
  if (config.weights.some((weight) => !weights.has(weight))) {
    throw new Error(`${config.family}: Google did not return every weight`)
  }
  return faces
}

function groupBySubset(faces: FontFace[]): Map<string, FontFace[]> {
  const subsets = new Map<string, FontFace[]>()
  for (const face of faces) {
    subsets.set(face.subset, [...(subsets.get(face.subset) ?? []), face])
  }
  return subsets
}

async function downloadFont(url: string, path: string): Promise<void> {
  const buffer = Buffer.from(await (await fetchOk(url)).arrayBuffer())
  // Google can answer with extensionless /l/font?kit= URLs, so check the
  // woff2 signature instead of the extension.
  if (buffer.subarray(0, 4).toString('latin1') !== 'wOF2') {
    throw new Error(`${url} is not a woff2 file`)
  }
  writeFileSync(path, buffer)
}

function quote(value: string): string {
  return `'${value.replaceAll("'", "\\'")}'`
}

async function generateFamily(config: FamilyConfig): Promise<GeneratedFamily> {
  const dir = slug(config.family)
  const outDir = join(FONTS_DIR, dir)
  rmSync(outDir, { recursive: true, force: true })
  mkdirSync(outDir, { recursive: true })

  const subsets = groupBySubset(await fetchFaces(config))
  const loaders: string[] = []

  for (const [subset, faces] of subsets) {
    const ranges = new Set(faces.map((face) => face.unicodeRange))
    if (ranges.size !== 1) {
      throw new Error(`${config.family} ${subset}: mixed unicode-ranges`)
    }
    // Variable fonts serve every weight from one file.
    const urls = [...new Set(faces.map((face) => face.url))]
    const fileFor = (face: FontFace): string =>
      urls.length === 1
        ? `${dir}-${subset}.woff2`
        : `${dir}-${subset}-${face.weight}.woff2`
    for (const face of faces.filter(
      (face, index) => faces.findIndex((f) => f.url === face.url) === index
    )) {
      await downloadFont(face.url, join(outDir, fileFor(face)))
    }

    const isLatin = subset === 'latin'
    const name = isLatin
      ? config.exportName
      : `${config.exportName}${camel(`-${subset}`)}`
    const src = faces
      .map(
        (face) =>
          `    { path: '../public/fonts/${dir}/${fileFor(face)}', weight: '${face.weight}', style: 'normal' },`
      )
      .join('\n')
    const loader = (exportName: string, variable: string | null): string =>
      `export const ${exportName} = localFont({
  src: [
${src}
  ],
  display: 'swap',
  declarations: [
    { prop: 'font-family', value: ${quote(`'${config.family}'`)} },
    { prop: 'unicode-range', value: ${quote(ranges.values().next().value!)} },
  ],
  adjustFontFallback: false,
${
  variable
    ? `  fallback: [${quote(`'${config.family} Fallback'`)}],
  variable: '${variable}',`
    : '  preload: false,'
}
})`
    loaders.push(loader(name, isLatin ? config.variable : null))
    if (isLatin) {
      for (const alias of config.aliases ?? []) {
        loaders.push(loader(alias.exportName, alias.variable))
      }
    }
  }

  if (!subsets.has('latin')) throw new Error(`${config.family}: no latin`)

  const oflName = config.family.toLowerCase().replaceAll(' ', '')
  writeFileSync(
    join(outDir, 'OFL.txt'),
    await (
      await fetchOk(
        `https://raw.githubusercontent.com/google/fonts/${OFL_REF}/ofl/${oflName}/OFL.txt`
      )
    ).text()
  )

  const metrics = getFallbackFontOverrideMetrics(config.family)
  if (!metrics) throw new Error(`${config.family}: no fallback metrics`)
  const fallbackCss = `@font-face {
  font-family: '${config.family} Fallback';
  src: local('${metrics.fallbackFont}');
  ascent-override: ${metrics.ascentOverride};
  descent-override: ${metrics.descentOverride};
  line-gap-override: ${metrics.lineGapOverride};
  size-adjust: ${metrics.sizeAdjust};
}
`

  console.info(
    `[generate-fonts] ${config.family}: ${subsets.size} subsets, weights ${config.weights.join(', ')}`
  )
  return { loaders: loaders.join('\n\n'), fallbackCss }
}

async function main(): Promise<void> {
  const families: GeneratedFamily[] = []
  for (const config of FAMILIES) families.push(await generateFamily(config))

  writeFileSync(
    join(WEB_DIR, 'app', 'google-fonts.ts'),
    `// Generated by scripts/generate-fonts.ts. Do not edit by hand.
//
// Each subset is its own loader because next/font/local has no per-file
// unicode-range. They share the Google family name, so the browser merges
// them into one family and downloads a subset only when a page uses it.

import './google-fonts-fallback.css'

import localFont from 'next/font/local'

${families.map((family) => family.loaders).join('\n\n')}
`
  )
  writeFileSync(
    join(WEB_DIR, 'app', 'google-fonts-fallback.css'),
    `/* Generated by scripts/generate-fonts.ts. Do not edit by hand.
   Arial metrics adjusted to each font, same values as next/font/google. */

${families.map((family) => family.fallbackCss).join('\n')}`
  )
}

await main()
