import { lookup } from 'mrmime'

import { getOctokit } from './client'
import { getGithubConfig } from './config'

interface GithubPullRequest {
  number: number
  title: string
  body?: string | null
  state: string
  draft?: boolean
  node_id: string
  html_url: string
  user: { login: string; type: string } | null
  head: { ref: string; sha: string; repo: { full_name: string } | null }
  base: { ref: string; sha: string }
}

const appLogin = async () => {
  const { data: app } = await getOctokit().apps.getAuthenticated()
  if (!app?.slug) throw new Error('Could not identify the CMS GitHub App')
  return `${app.slug}[bot]`
}

const managedPr = (pr: GithubPullRequest, login: string) => {
  const { owner, repo, prBaseBranch, contentBranchPrefix } = getGithubConfig()
  if (
    pr.state !== 'open' ||
    pr.base.ref !== prBaseBranch ||
    pr.head.repo?.full_name.toLowerCase() !==
      `${owner}/${repo}`.toLowerCase() ||
    !pr.head.ref.startsWith(contentBranchPrefix) ||
    pr.user?.type !== 'Bot' ||
    pr.user.login !== login
  )
    return null
  return {
    number: pr.number,
    ...(pr.title && { title: pr.title }),
    ...(pr.body && { body: pr.body }),
    branchName: pr.head.ref,
    headSha: pr.head.sha,
    baseSha: pr.base.sha,
    htmlUrl: pr.html_url,
    nodeId: pr.node_id,
    draft: pr.draft ?? false,
  }
}

export const listManagedPullRequests = async () => {
  const octokit = getOctokit()
  const { owner, repo, prBaseBranch } = getGithubConfig()
  const [prs, login] = await Promise.all([
    octokit.paginate(octokit.pulls.list, {
      owner,
      repo,
      state: 'open',
      base: prBaseBranch,
      per_page: 100,
    }),
    appLogin(),
  ])
  return prs.map((pr) => managedPr(pr, login)).filter((pr) => pr !== null)
}

export const getManagedPullRequest = async (number: number) => {
  const { owner, repo } = getGithubConfig()
  const [{ data }, login] = await Promise.all([
    getOctokit().pulls.get({ owner, repo, pull_number: number }),
    appLogin(),
  ])
  const pr = managedPr(data, login)
  if (!pr)
    throw new Error(
      'Only open content PRs created by this CMS can be changed here'
    )
  return pr
}

const isContentPath = (path: string) => {
  if (path.startsWith('content/') && path.endsWith('.json')) return true
  const upload =
    /^apps\/web\/public\/cms\/uploads\/[^/]+\.([a-zA-Z0-9]+)$/.exec(path)
  const mime = upload && lookup(upload[1]!)
  return typeof mime === 'string' && mime.startsWith('image/')
}

export const compareContentFiles = async (pr: {
  baseSha: string
  headSha: string
}) => {
  const { owner, repo } = getGithubConfig()
  const octokit = getOctokit()
  const { data: comparison } = await octokit.repos.compareCommitsWithBasehead({
    owner,
    repo,
    basehead: `${pr.baseSha}...${pr.headSha}`,
    per_page: 1,
  })
  return {
    files: comparison.files,
    mergeBaseSha: comparison.merge_base_commit.sha,
  }
}

export const verifyContentDiff = async (
  pr: { baseSha: string; headSha: string },
  comparison?: Awaited<ReturnType<typeof compareContentFiles>>
) => {
  const { owner, repo } = getGithubConfig()
  const octokit = getOctokit()
  const { files } = comparison ?? (await compareContentFiles(pr))
  // GitHub caps a comparison at 300 filenames. Never approve a partial diff.
  if (
    !files ||
    files.length >= 300 ||
    files.some(
      (file) =>
        !isContentPath(file.filename) ||
        (file.previous_filename && !isContentPath(file.previous_filename))
    )
  )
    throw new Error(
      'The complete PR diff must contain only content JSON and CMS uploads'
    )

  const { data } = await octokit.git.getTree({
    owner,
    repo,
    tree_sha: pr.headSha,
    recursive: '1',
  })
  const regularFiles = new Set(
    data.tree
      .filter((entry) => entry.mode === '100644')
      .map((entry) => entry.path)
  )
  if (
    data.truncated ||
    files.some(
      (file) => file.status !== 'removed' && !regularFiles.has(file.filename)
    )
  ) {
    throw new Error('The CMS can only change regular files')
  }
  return files.flatMap((file) =>
    file.previous_filename
      ? [file.previous_filename, file.filename]
      : [file.filename]
  )
}
