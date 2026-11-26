import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

import { pageCopySchema } from '../pages'

const content = JSON.parse(
  await readFile(
    new URL(
      '../../../../../content/pages/en/logos-node-referral-programme.json',
      import.meta.url
    ),
    'utf8'
  )
)

test('the standalone node referral page parses through the page schema', () => {
  const page = pageCopySchema.parse(content)
  assert.equal(page.route, '/logos-node-referral-programme')
  assert.equal(page.sections[0]?.componentType, 'nodeReferralProgrammeCopy')
})

test('FAQ links reject unsafe protocols', () => {
  const invalid = structuredClone(content)
  invalid.sections[0].faqs.items[0].answer[0].href = 'javascript:alert(1)'
  assert.equal(pageCopySchema.safeParse(invalid).success, false)
})
