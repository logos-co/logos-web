import { SRC_URLS, SCENES } from './scenes.js'

const span = (e) => (e.to ? `${e.age}–${e.to}` : `${e.age}`)

export const moneyS = (n) =>
  (n < 0 ? '−£' : '+£') + Math.abs(n).toLocaleString('en-GB')

const row = (label, amount, cls = '') => ({ t: 'row', label, amount, cls })
const rule = { t: 'rule' }

const letterhead = (meta) => [
  { t: 'brand' },
  { t: 'title' },
  { t: 'meta', text: meta },
  rule,
]

const ledgerRows = (ledger) =>
  ledger.map((e) => {
    const fm = -(e.delta || 0)
    return row(`${span(e)} · ${e.label}`, moneyS(fm), fm >= 0 ? 'pos' : 'neg')
  })

const totalLine = (debtTotal) => ({
  t: 'total',
  saved: debtTotal < 0,
  label: debtTotal < 0 ? 'Total saved' : 'Total debt',
  amount: '£' + Math.abs(debtTotal).toLocaleString('en-GB'),
})

export function chapterReceipt(scene, option, ledger, debtTotal) {
  const b = option.bill
  const footMoney = -(option.delta || 0)
  const lines = letterhead(
    `No. ${scene.tag} · Age ${scene.age}–${SCENES[SCENES.findIndex((s) => s.age === scene.age) + 1]?.age ?? 45}`
  )
  if (b.inc != null)
    lines.push(
      row(
        b.incLabel || 'Take-home pay',
        `£${b.inc.toLocaleString('en-GB')} /mo`,
        'pos'
      )
    )
  // r[2] 'total' = one-off cost, 'owed' = debt still owed at the end: shown as a lump sum, kept out of the monthly maths
  const monthly = b.rows.filter((r) => !r[2])
  const lumps = b.rows.filter((r) => r[2])
  for (const r of monthly)
    lines.push(
      row(
        r[0],
        `−£${r[1].toLocaleString('en-GB')}${b.inc != null ? ' /mo' : ''}`
      )
    )
  if (b.inc != null) {
    const costs = monthly.reduce((a, r) => a + r[1], 0)
    const net = b.inc - costs
    lines.push(
      row('Left each month', moneyS(net), `sep ${net >= 0 ? 'pos' : 'neg'}`)
    )
    for (const r of lumps)
      lines.push(
        row(
          r[0],
          `−£${r[1].toLocaleString('en-GB')}${r[2] === 'total' ? ' once' : ''}`
        )
      )
  }
  lines.push(
    row(b.footLabel, moneyS(footMoney), `foot ${footMoney >= 0 ? 'pos' : ''}`)
  )
  lines.push(rule)
  lines.push({ t: 'sub', text: 'The running tab · every decision so far' })
  lines.push(...ledgerRows(ledger))
  lines.push(totalLine(debtTotal))
  return lines
}

export function finalReceipt(ledger, debtTotal) {
  const lines = letterhead('The Full Account · Age 18–45')
  lines.push(...ledgerRows(ledger))
  lines.push(totalLine(debtTotal))
  const srcs = [...new Set(ledger.map((e) => e.src).filter(Boolean))]
  if (srcs.length)
    lines.push({
      t: 'sources',
      items: srcs.map((name) => ({ name, url: SRC_URLS[name] })),
    })
  return lines
}
