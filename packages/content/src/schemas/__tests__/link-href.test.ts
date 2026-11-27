import assert from 'node:assert/strict'
import { test } from 'node:test'

import { linkHrefSchema } from '../common'

test('linkHrefSchema accepts internal, https and anchor links', () => {
  for (const href of ['/about', 'https://logos.co', '#top']) {
    assert.equal(linkHrefSchema.safeParse(href).success, true, href)
  }
})

test('linkHrefSchema rejects protocol-relative and other schemes', () => {
  for (const href of [
    '//evil.example',
    '//',
    '/\\evil.example',
    '/\\/evil.example',
    '/\t/evil.example',
    'http://logos.co',
    'javascript:alert(1)',
  ]) {
    assert.equal(linkHrefSchema.safeParse(href).success, false, href)
  }
})
