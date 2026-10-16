import { describe, expect, it } from 'vitest'

import { mapGraphqlDynamicBlocks } from '../from-cms'

describe('CMS media blocks', () => {
  it('keeps mixed content in editorial order without mutating the CMS response', () => {
    const blocks = Object.freeze([
      Object.freeze({
        __typename: 'ComponentBlocksRichText',
        body: '<p>Before</p>',
      }),
      Object.freeze({
        __typename: 'ComponentBlocksInteractiveEmbed',
        title: 'Diagram',
        html: '<button>Explore</button>',
        css: 'button { color: green }',
        js: 'init()',
        height: 320,
      }),
      Object.freeze({
        __typename: 'ComponentBlocksCodeBlock',
        code: 'const answer = 42',
        language: 'js',
      }),
      Object.freeze({
        __typename: 'ComponentBlocksRichText',
        body: '<p>After</p>',
      }),
    ])
    expect(mapGraphqlDynamicBlocks(blocks)).toEqual([
      { type: 'rich-text', body: '<p>Before</p>' },
      {
        type: 'interactive-embed',
        title: 'Diagram',
        html: '<button>Explore</button>',
        css: 'button { color: green }',
        js: 'init()',
        height: 320,
      },
      { type: 'code-block', code: 'const answer = 42', language: 'js' },
      { type: 'rich-text', body: '<p>After</p>' },
    ])
  })

  it('leaves legacy articles without a block list', () => {
    expect(mapGraphqlDynamicBlocks()).toBeUndefined()
    expect(mapGraphqlDynamicBlocks(null)).toBeUndefined()
    expect(mapGraphqlDynamicBlocks([])).toBeUndefined()
  })

  it('preserves full HTML documents and normalises optional CMS fields', () => {
    expect(
      mapGraphqlDynamicBlocks([
        {
          __typename: 'ComponentBlocksInteractiveEmbed',
          full_html: '<!doctype html><html><body>Document</body></html>',
          html: null,
          height: null,
        },
        { __typename: 'ComponentBlocksCodeBlock', code: null, language: null },
      ])
    ).toEqual([
      {
        type: 'interactive-embed',
        fullHtml: '<!doctype html><html><body>Document</body></html>',
        html: '',
      },
      { type: 'code-block', code: '' },
    ])
  })
})
