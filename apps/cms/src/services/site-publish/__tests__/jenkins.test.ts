import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createJenkinsClient } from '../jenkins'
import { loadJenkinsConfig } from '../jenkins-config'
import { DispatchUncertainError } from '../dispatch-error'

const source = {
  JENKINS_DEV_JOB_URL:
    'https://ci.infra.status.im/job/website/job/dev.logos.co/',
  JENKINS_PRODUCTION_JOB_URL:
    'https://ci.infra.status.im/job/website/job/logos.co/',
  JENKINS_USER: 'test',
  JENKINS_API_TOKEN: 'test-token',
}
const config = loadJenkinsConfig(source)

describe('Jenkins API', () => {
  it('accepts the deployed domain-named website jobs', () => {
    assert.deepEqual(config.jobs, {
      dev: source.JENKINS_DEV_JOB_URL,
      production: source.JENKINS_PRODUCTION_JOB_URL,
    })
  })
  it('distinguishes an unconfirmed submission from a rejected request', async () => {
    const lost: typeof fetch = async () => {
      throw new Error('connection lost')
    }
    await assert.rejects(
      () => createJenkinsClient(config, lost).dispatch('dev'),
      DispatchUncertainError
    )
    const rejected: typeof fetch = async () =>
      new Response(null, { status: 503 })
    await assert.rejects(
      () => createJenkinsClient(config, rejected).dispatch('dev'),
      /Jenkins request failed \(503\)/
    )
  })
  it('uses the configured job, authentication and reviewed build parameter', async () => {
    const request: typeof fetch = async (url, init) => {
      assert.equal(String(url), `${config.jobs.production}buildWithParameters`)
      assert.equal(
        new Headers(init?.headers).get('authorization'),
        config.authorization
      )
      assert.equal(init?.redirect, 'error')
      assert.equal(init?.method, 'POST')
      assert.equal(String(init?.body), 'SITE_PUBLISH=true&PREVIEW_BUILD=42')
      return new Response(null, { status: 201 })
    }
    await createJenkinsClient(config, request).dispatch('production', 42)
  })
  it('includes queued requests before the completed build and requires the archived snapshot', async () => {
    const request: typeof fetch = async () =>
      Response.json({
        queueItem: { id: 99, inQueueSince: 1000 },
        builds: [
          {
            number: 42,
            building: false,
            result: 'SUCCESS',
            timestamp: 0,
            duration: 7000,
            artifacts: [{ relativePath: 'press-snapshot.json' }],
          },
        ],
      })
    const runs = await createJenkinsClient(config, request).listRuns('dev')
    assert.equal(runs[0]?.state, 'queued')
    assert.equal(runs[1]?.id, 42)
    assert.equal(runs[1]?.hasSnapshot, true)
    assert.equal(runs[1]?.finishedAt, '1970-01-01T00:00:07.000Z')
  })
  it('does not report authenticated failures as empty successful history', async () => {
    const request: typeof fetch = async () =>
      new Response('secret diagnostic', { status: 403 })
    await assert.rejects(
      () => createJenkinsClient(config, request).listRuns('dev'),
      /^Error: Jenkins request failed \(403\)$/
    )
  })
  it('validates missing and unsafe configuration', () => {
    assert.throws(() => loadJenkinsConfig({}), /required/)
    assert.throws(
      () =>
        loadJenkinsConfig({
          ...source,
          JENKINS_DEV_JOB_URL: 'http://ci.example.com/job/a/',
        }),
      /HTTPS/
    )
    assert.throws(
      () =>
        loadJenkinsConfig({
          ...source,
          JENKINS_DEV_JOB_URL: source.JENKINS_PRODUCTION_JOB_URL,
        }),
      /must differ/
    )
    assert.throws(
      () =>
        loadJenkinsConfig({
          ...source,
          JENKINS_DEV_JOB_URL:
            'https://other.example.com/job/website/job/dev.logos.co/',
        }),
      /same controller/
    )
    assert.throws(
      () =>
        loadJenkinsConfig({
          ...source,
          JENKINS_PRODUCTION_JOB_URL:
            'https://ci.infra.status.im/job/another/job/logos.co/',
        }),
      /sibling/
    )
  })
})
