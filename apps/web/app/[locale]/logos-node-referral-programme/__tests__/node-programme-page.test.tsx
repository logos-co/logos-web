import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import content from '../../../../../../content/pages/en/logos-node-referral-programme.json'

vi.mock('@repo/content/loaders', () => ({
  getPageCopy: async () => content,
}))
vi.mock('@/i18n/navigation', () => ({
  Link: ({
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    createElement('a', props, children),
}))

import NodeProgrammePage from '../page'

async function renderPage() {
  return renderToStaticMarkup(
    await NodeProgrammePage({ params: Promise.resolve({ locale: 'en' }) })
  )
}

describe('temporary node programme page', () => {
  it('renders an email-only signup and preparation links', async () => {
    const html = await renderPage()
    expect(html).toContain('name="email"')
    expect(html).not.toContain('name="role"')
    expect(html).toContain('href="https://discord.gg/Ykv4eZyHUJ"')
    expect(html).toContain(
      'href="https://github.com/logos-co/logos-basecamp/releases/latest"'
    )
    expect(html).toContain(
      'href="https://github.com/logos-co/logos-basecamp/releases"'
    )
    expect(html).toContain(
      'href="https://docs.logos.co/blockchain/get-started/run-a-logos-blockchain-node-from-basecamp"'
    )
  })

  it('renders the eight supplied FAQs and direct support channel links', async () => {
    const html = await renderPage()
    expect(html.match(/aria-controls=/g)).toHaveLength(8)
    expect(html.match(/aria-expanded="true"/g)).toHaveLength(1)
    expect(html.match(/inert=""/g)).toHaveLength(7)
    expect(html).toContain('Testnet tokens have no value.')
    expect(html).toContain('Planned for Q1 to Q2 2027.')
    expect(html).toContain(
      'https://discord.com/channels/973324189794697286/1372894505396867082'
    )
    expect(html).toContain(
      'https://discord.com/channels/973324189794697286/1468535289604735038'
    )
    expect(html).not.toContain('Points-to-reward rate')
    expect(html).not.toContain('change to v0.4 next week')
  })
})
