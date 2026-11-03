import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import {
  lambdaPrizeCopySectionSchema,
  pageCopySchema,
  pageSectionSchema,
} from '../pages'

const fixture = JSON.parse(
  readFileSync(
    new URL(
      '../../../../../content/pages/en/lambda-prize.json',
      import.meta.url
    ),
    'utf8'
  )
)

test('Lambda Prize v3 survives the page loader and CMS schema round trip', () => {
  const page = pageCopySchema.parse(fixture)
  assert.deepEqual(page.sections[0], fixture.sections[0])
  assert.equal(
    pageSectionSchema.parse(page.sections[0]).componentType,
    'lambdaPrizeCopy'
  )
})

test('Lambda Prize rejects unsafe edited CTA URLs', () => {
  const copy = structuredClone(fixture.sections[0])
  copy.resources.items[0].cta.href = 'javascript:alert(1)'
  assert.equal(lambdaPrizeCopySectionSchema.safeParse(copy).success, false)
})

test('Lambda Prize requires complete section copy and explicit image alternatives', () => {
  const copy = structuredClone(fixture.sections[0])
  delete copy.rules
  assert.equal(lambdaPrizeCopySectionSchema.safeParse(copy).success, false)
  const imageCopy = structuredClone(fixture.sections[0])
  delete imageCopy.hero.image.alt
  assert.equal(lambdaPrizeCopySectionSchema.safeParse(imageCopy).success, false)
})
