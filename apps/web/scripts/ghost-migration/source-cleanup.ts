import { rehype } from 'rehype'

export const injectedGhostHosts = [
  '1winmd.lol',
  'kingmaker3-de.com',
  'betika-official.club',
  'betwarrior-casino-online.com',
  'bets10giris.lol',
  'spinorhinocasino-nederland.biz',
  'atlantis-megaways.com',
  'mmc-plus.ru',
  'slotmonkey-casino.site',
  'zetcasino17.com',
  'sportpesa.lol',
  'betika-official.lol',
  'yacourier24.ru',
  'australia-casino-rocket.com',
  '1win-argentina-official.live',
  '1winkenya.top',
] as const

const processor = rehype().data('settings', { fragment: true })
type RootNode = ReturnType<typeof processor.parse>['children'][number]
type Node = Exclude<RootNode, { type: 'doctype' }>

function isInjectedAnchor(node: Extract<Node, { type: 'element' }>): boolean {
  if (node.tagName === 'a' && typeof node.properties.href === 'string') {
    const host = new URL(
      node.properties.href,
      'https://ghost-source.invalid'
    ).hostname
      .toLowerCase()
      .replace(/\.$/, '')
    if (
      injectedGhostHosts.some(
        (blocked) => host === blocked || host.endsWith(`.${blocked}`)
      )
    )
      return true
  }
  return false
}

export function removeInjectedGhostLinks(node: RootNode): Node[] {
  if (node.type === 'doctype') return []
  if (node.type !== 'element') return [node]
  if (isInjectedAnchor(node)) return []
  return [
    { ...node, children: node.children.flatMap(removeInjectedGhostLinks) },
  ]
}

export function cleanGhostHtml(html: string): string {
  const tree = processor.parse(html)
  const ranges: Array<[number, number]> = []
  function collect(node: RootNode): void {
    if (node.type !== 'element') return
    if (isInjectedAnchor(node)) {
      ranges.push([node.position!.start.offset!, node.position!.end.offset!])
      return
    }
    node.children.forEach(collect)
  }
  tree.children.forEach(collect)
  return ranges.reduceRight(
    (value, [start, end]) => value.slice(0, start) + value.slice(end),
    html
  )
}
