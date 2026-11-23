import matter from 'gray-matter'

interface YamlFrontMatter {
  data: Record<string, unknown>
  content: string
}

export function parseYamlFrontMatter(raw: string): YamlFrontMatter {
  const markdown = raw.replace(/^\uFEFF/, '')
  const opening = /^---(?!-)([^\n]*)/.exec(markdown)
  if (!opening) return { data: {}, content: markdown }

  const language = opening[1].trim().toLowerCase()
  if (language && language !== 'yaml' && language !== 'yml') {
    throw new Error('Only YAML front matter is supported')
  }

  // gray-matter gives the opening delimiter's language priority over options.
  const { data, content } = matter(`---${markdown.slice(opening[0].length)}`, {
    language: 'yaml',
  })
  return { data, content }
}
