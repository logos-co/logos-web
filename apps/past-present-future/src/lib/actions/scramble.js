const SCR_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

const SCR_KEEP = new Set([' ', ' ', '↗', '→', '·', '/', '\n', '—'])

function textNodes(el) {
  const out = []
  for (const n of el.childNodes) {
    if (n.nodeType === 3 && n.nodeValue.trim().length) out.push(n)
    else if (n.nodeType === 1 && getComputedStyle(n).display !== 'none') {
      out.push(...textNodes(n))
    }
  }
  return out
}

const finals = new WeakMap()
const rafs = new WeakMap()

function run(nodes) {
  if (!nodes.length) return
  const host = nodes[0]
  if (rafs.get(host)) cancelAnimationFrame(rafs.get(host))
  let offset = 0
  const parts = nodes.map((n) => {
    let final = finals.get(n)
    if (final == null) {
      final = n.nodeValue
      finals.set(n, final)
    }
    const q = []
    for (let i = 0; i < final.length; i++) {
      q.push({
        ch: final[i],
        end:
          3 + Math.round((offset + i) * 0.55) + Math.floor(Math.random() * 6),
      })
    }
    offset += final.length
    return { node: n, final, q }
  })
  let frame = 0
  ;(function tick() {
    let done = 0,
      total = 0
    for (const p of parts) {
      let out = ''
      for (const c of p.q) {
        if (SCR_KEEP.has(c.ch) || frame >= c.end) {
          out += c.ch
          done++
        } else out += SCR_CHARS[Math.floor(Math.random() * SCR_CHARS.length)]
        total++
      }
      p.node.nodeValue = out
    }
    if (done === total) {
      parts.forEach((p) => {
        p.node.nodeValue = p.final
      })
      rafs.set(host, 0)
      return
    }
    frame++
    rafs.set(host, requestAnimationFrame(tick))
  })()
}

export function scramble(node) {
  const reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches
  const enter = () => {
    if (reduce) return
    run(textNodes(node))
  }
  node.addEventListener('pointerenter', enter)
  return {
    destroy() {
      node.removeEventListener('pointerenter', enter)
    },
  }
}
