import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { renderTaggedText } from '../render-tagged-text'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function anchor(href: string, text: string) {
  return React.createElement('a', { href }, text)
}

// ---------------------------------------------------------------------------
// Basic rendering
// ---------------------------------------------------------------------------

describe('renderTaggedText', () => {
  it('returns plain text unchanged when no tags are present', () => {
    const result = renderTaggedText('Hello world', {})
    expect(result).toEqual(['Hello world'])
  })

  it('replaces a single paired tag with the renderer output', () => {
    const result = renderTaggedText('Click <link>here</link> to continue.', {
      link: (text) => anchor('https://example.com', text),
    })
    const html = renderToStaticMarkup(React.createElement(React.Fragment, null, ...result))
    expect(html).toBe('Click <a href="https://example.com">here</a> to continue.')
  })

  it('replaces multiple different tags in order', () => {
    const result = renderTaggedText('A <foo>alpha</foo> and <bar>beta</bar>.', {
      foo: (text) => anchor('/foo', text),
      bar: (text) => anchor('/bar', text),
    })
    const html = renderToStaticMarkup(React.createElement(React.Fragment, null, ...result))
    expect(html).toBe('A <a href="/foo">alpha</a> and <a href="/bar">beta</a>.')
  })

  it('handles self-closing empty tags where the renderer supplies the label', () => {
    const result = renderTaggedText('Join <discord></discord> today.', {
      discord: () => anchor('https://discord.gg/test', 'our Discord'),
    })
    const html = renderToStaticMarkup(React.createElement(React.Fragment, null, ...result))
    expect(html).toBe('Join <a href="https://discord.gg/test">our Discord</a> today.')
  })

  it('assigns a unique key to each rendered element', () => {
    const result = renderTaggedText('<a>one</a> and <a>two</a>', {
      a: (text) => React.createElement('span', null, text),
    })
    const elements = result.filter(React.isValidElement) as React.ReactElement[]
    const keys = elements.map((el) => el.key)
    expect(keys).toHaveLength(2)
    expect(new Set(keys).size).toBe(2)
  })

  it('leaves unrecognised tags in the output as literal text (HTML-escaped)', () => {
    const result = renderTaggedText('Hello <unknown>world</unknown> end', {
      other: (text) => anchor('/other', text),
    })
    const html = renderToStaticMarkup(React.createElement(React.Fragment, null, ...result))
    // React escapes angle brackets in text nodes; the raw string is preserved as a text node
    expect(html).toBe('Hello &lt;unknown&gt;world&lt;/unknown&gt; end')
  })
})

// ---------------------------------------------------------------------------
// Research content: overview paragraph p1
// The template is taken verbatim from content/pages/en/research.json
// ---------------------------------------------------------------------------

describe('renderTaggedText with research overview p1', () => {
  const p1 =
    'Logos Research, formerly Vac, is a principle-driven R&D team that provides comprehensive technical support to <logos>Logos</logos> and other <ift>IFT</ift> projects. Logos Research consists of specialised <units>R&D service units</units> and innovative <incubator>incubator projects</incubator>. We focus on developing foundational components and unopinionated protocols that both IFT projects and the broader community can utilise.'

  const renderers = {
    logos: (text: string) => anchor('https://logos.co/', text),
    ift: (text: string) => anchor('https://free.technology', text),
    units: (text: string) => anchor('https://research.logos.co/vsus', text),
    incubator: (text: string) => anchor('https://research.logos.co/vips', text),
  }

  it('renders visible text with tags stripped', () => {
    const result = renderTaggedText(p1, renderers)
    const html = renderToStaticMarkup(React.createElement(React.Fragment, null, ...result))
    expect(html).toContain('Logos Research, formerly Vac')
    expect(html).toContain('Logos')
    expect(html).toContain('IFT')
    expect(html).toContain('R&amp;D service units')
    expect(html).toContain('incubator projects')
  })

  it('renders the logos link with correct href and label', () => {
    const result = renderTaggedText(p1, renderers)
    const html = renderToStaticMarkup(React.createElement(React.Fragment, null, ...result))
    expect(html).toContain('href="https://logos.co/"')
    expect(html).toContain('>Logos<')
  })

  it('renders the IFT link with correct href', () => {
    const result = renderTaggedText(p1, renderers)
    const html = renderToStaticMarkup(React.createElement(React.Fragment, null, ...result))
    expect(html).toContain('href="https://free.technology"')
    expect(html).toContain('>IFT<')
  })

  it('renders the R&D service units link', () => {
    const result = renderTaggedText(p1, renderers)
    const html = renderToStaticMarkup(React.createElement(React.Fragment, null, ...result))
    expect(html).toContain('href="https://research.logos.co/vsus"')
  })

  it('renders the incubator projects link', () => {
    const result = renderTaggedText(p1, renderers)
    const html = renderToStaticMarkup(React.createElement(React.Fragment, null, ...result))
    expect(html).toContain('href="https://research.logos.co/vips"')
  })
})

// ---------------------------------------------------------------------------
// Research content: contribute contact line
// The template is taken verbatim from content/pages/en/research.json
// ---------------------------------------------------------------------------

describe('renderTaggedText with research contribute contact', () => {
  const contact = 'Get in touch with us by <discord></discord>, <forum></forum>, or <github></github>.'
  const links = {
    discord: 'joining our Discord',
    forum: 'opening a thread in our forum',
    github: 'opening issues / PRs on GitHub',
  }

  const renderers = {
    discord: () => anchor('https://discord.gg/PQFdubGt6d', links.discord),
    forum: () => anchor('https://forum.research.logos.co/', links.forum),
    github: () => anchor('https://github.com/vacp2p', links.github),
  }

  it('renders visible surroundings text', () => {
    const result = renderTaggedText(contact, renderers)
    const html = renderToStaticMarkup(React.createElement(React.Fragment, null, ...result))
    expect(html).toContain('Get in touch with us by')
    expect(html).toContain(', or ')
  })

  it('renders the discord link with correct href and label', () => {
    const result = renderTaggedText(contact, renderers)
    const html = renderToStaticMarkup(React.createElement(React.Fragment, null, ...result))
    expect(html).toContain('href="https://discord.gg/PQFdubGt6d"')
    expect(html).toContain('joining our Discord')
  })

  it('renders the forum link with correct href and label', () => {
    const result = renderTaggedText(contact, renderers)
    const html = renderToStaticMarkup(React.createElement(React.Fragment, null, ...result))
    expect(html).toContain('href="https://forum.research.logos.co/"')
    expect(html).toContain('opening a thread in our forum')
  })

  it('renders the github link with correct href and label', () => {
    const result = renderTaggedText(contact, renderers)
    const html = renderToStaticMarkup(React.createElement(React.Fragment, null, ...result))
    expect(html).toContain('href="https://github.com/vacp2p"')
    expect(html).toContain('opening issues / PRs on GitHub')
  })

  it('renders all three links in document order', () => {
    const result = renderTaggedText(contact, renderers)
    const html = renderToStaticMarkup(React.createElement(React.Fragment, null, ...result))
    const discordIdx = html.indexOf('discord.gg')
    const forumIdx = html.indexOf('forum.research')
    const githubIdx = html.indexOf('github.com')
    expect(discordIdx).toBeLessThan(forumIdx)
    expect(forumIdx).toBeLessThan(githubIdx)
  })
})
