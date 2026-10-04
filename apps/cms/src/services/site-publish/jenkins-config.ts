import type { PublishEnvironment } from './environments'

export interface JenkinsConfig {
  authorization: string
  jobs: Record<PublishEnvironment, string>
}

export const loadJenkinsConfig = (
  source: Readonly<Record<string, string | undefined>> = process.env
): JenkinsConfig => {
  const required = (name: string): string => {
    const value = source[name]?.trim()
    if (!value) throw new Error(`${name} is required for site publishing`)
    return value
  }
  const jobUrl = (name: string): string => {
    const url = new URL(required(name))
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) {
      throw new Error(
        `${name} must be an HTTPS Jenkins job URL without credentials or a query`
      )
    }
    return `${url.href.replace(/\/$/, '')}/`
  }
  const jobs = {
    dev: jobUrl('JENKINS_DEV_JOB_URL'),
    production: jobUrl('JENKINS_PRODUCTION_JOB_URL'),
  }
  if (jobs.dev === jobs.production)
    throw new Error('Jenkins staging and production jobs must differ')
  if (new URL(jobs.dev).origin !== new URL(jobs.production).origin) {
    throw new Error('Jenkins jobs must use the same controller')
  }
  if (
    !jobs.production.endsWith('/job/master/') ||
    new URL('../develop/', jobs.production).href !== jobs.dev
  ) {
    throw new Error(
      'Jenkins jobs must be sibling develop and master branch jobs'
    )
  }
  return {
    authorization: `Basic ${Buffer.from(`${required('JENKINS_USER')}:${required('JENKINS_API_TOKEN')}`).toString('base64')}`,
    jobs,
  }
}
