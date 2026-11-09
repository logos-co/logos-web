import { GITHUB_TOKEN } from '@config/site'
import { expect } from '@playwright/test'

import type { APIRequestContext } from '@playwright/test'

export type GitHubRelease = {
  tag_name: string
  assets: { name: string; state: string; browser_download_url: string }[]
}

/**
 * Fetches the latest full release (no draft, no prerelease) through the GitHub
 * REST API, authenticated when GITHUB_TOKEN is set. The suite never calls
 * github.com itself: GitHub answers anonymous traffic there with 504s when it
 * is under load.
 */
export async function getLatestRelease(
  request: APIRequestContext,
  repo: string
): Promise<GitHubRelease> {
  const url = `https://api.github.com/repos/${repo}/releases/latest`
  const response = await request.get(url, {
    headers: {
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
      ...(GITHUB_TOKEN && { authorization: `Bearer ${GITHUB_TOKEN}` }),
    },
  })
  expect(response.status(), `${url}: ${await response.text()}`).toBe(200)
  return response.json()
}
