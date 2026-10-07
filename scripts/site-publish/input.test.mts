import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  publicationInput,
  validateDeployedPreview,
  validateReviewedRun,
  type ReviewedRun,
} from './input.mts'

describe('site publication input', () => {
  it('accepts App dispatches and manual workflow runs', () => {
    assert.deepEqual(
      publicationInput({ client_payload: { environment: 'dev' } }),
      { environment: 'dev' }
    )
    assert.deepEqual(
      publicationInput({
        inputs: { environment: 'production', previewBuild: '42' },
      }),
      { environment: 'production', previewBuild: 42 }
    )
  })
  it('rejects unknown targets, missing review, shell expressions and fractional run IDs', () => {
    for (const input of [
      null,
      {},
      { environment: 'master' },
      { environment: 'production' },
      { environment: 'production', previewBuild: '42; echo secret' },
      { environment: 'production', previewBuild: '42.0' },
      { environment: 'production', previewBuild: -1 },
      { environment: 'production', previewBuild: 1.2 },
      { environment: 'production', previewBuild: true },
    ]) {
      assert.throws(() => publicationInput({ client_payload: input }))
    }
  })
  it('requires the latest successful preview from the trusted workflow and ref', () => {
    const run: ReviewedRun = {
      id: 42,
      display_title: 'Site publish: dev',
      status: 'completed',
      conclusion: 'success',
      path: '.github/workflows/site-publish.yml',
      head_branch: 'develop',
      event: 'repository_dispatch',
    }
    validateReviewedRun(run, 42)
    for (const overrides of [
      { status: 'in_progress' },
      { conclusion: 'failure' },
      { display_title: 'Site publish: production' },
      { head_branch: 'feature/unreviewed' },
      { path: '.github/workflows/test.yml' },
      { event: 'pull_request' },
    ]) {
      assert.throws(() => validateReviewedRun({ ...run, ...overrides }, 42))
    }
    assert.throws(() => validateReviewedRun(run, 43))
    assert.throws(() => validateReviewedRun(run, undefined))
  })
  it('rejects previews replaced by another publisher', () => {
    validateDeployedPreview({ runId: 42 }, 42)
    for (const marker of [null, {}, { runId: 43 }, { runId: '42' }]) {
      assert.throws(() => validateDeployedPreview(marker, 42))
    }
  })
})
