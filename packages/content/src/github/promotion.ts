import { getOctokit } from './client'
import { getGithubConfig } from './config'
import { getBranchSha } from './mutations'
import { getManagedPullRequest, verifyContentDiff } from './managed-pr'
import { createOrGetPullRequest } from './pull-requests'

export type BranchComparisonStatus =
  | 'ahead'
  | 'behind'
  | 'diverged'
  | 'identical'

export type BranchSyncDecision =
  | {
      kind: 'fast-forward'
      sha: string
    }
  | {
      kind: 'already-synced'
      sha: string
    }
  | {
      kind: 'blocked'
      reason: string
    }

export interface BranchSyncComparison {
  aheadBy: number
  behindBy?: number
  productionBranch: string
  productionSha: string
  stagingBranch: string
  stagingSha: string
  status: BranchComparisonStatus
}

export interface BranchSyncLinks {
  compareUrl: string
  productionBranchUrl: string
  stagingBranchUrl: string
}

export type ReleasePullRequestReason = 'code-changes' | 'fast-forward-refused'

export type BranchPromotion =
  | { kind: 'fast-forward' }
  | {
      kind: 'release-pr'
      reason: ReleasePullRequestReason
      pullRequestNumber: number
      pullRequestUrl: string
    }

export interface BranchSyncResult {
  comparison: BranchSyncComparison
  decision: BranchSyncDecision
  links: BranchSyncLinks
  /** How production moved. Absent when there was nothing to promote. */
  promotion?: BranchPromotion
  updated: boolean
}

export interface MergePullRequestResult {
  merged: boolean
  message: string
  pullRequestNumber: number
  pullRequestUrl: string
  readyForReview: boolean
  sha: string | null
}

const markPullRequestReadyForReview = async ({
  nodeId,
}: {
  nodeId: string
}): Promise<void> => {
  const octokit = getOctokit()
  await octokit.graphql(
    `mutation MarkPullRequestReadyForReview($pullRequestId: ID!) {
      markPullRequestReadyForReview(input: { pullRequestId: $pullRequestId }) {
        pullRequest {
          id
        }
      }
    }`,
    {
      pullRequestId: nodeId,
    }
  )
}

export const getBranchSyncLinks = ({
  owner,
  productionBranch,
  repo,
  stagingBranch,
}: {
  owner: string
  productionBranch: string
  repo: string
  stagingBranch: string
}): BranchSyncLinks => {
  const repoUrl = `https://github.com/${owner}/${repo}`
  return {
    compareUrl: `${repoUrl}/compare/${productionBranch}...${stagingBranch}`,
    productionBranchUrl: `${repoUrl}/tree/${productionBranch}`,
    stagingBranchUrl: `${repoUrl}/tree/${stagingBranch}`,
  }
}

export const getBranchSyncDecision = (
  comparison: BranchSyncComparison
): BranchSyncDecision => {
  if (comparison.status === 'identical') {
    return {
      kind: 'already-synced',
      sha: comparison.productionSha,
    }
  }

  if (comparison.status === 'ahead' && comparison.aheadBy > 0) {
    return {
      kind: 'fast-forward',
      sha: comparison.stagingSha,
    }
  }

  return {
    kind: 'blocked',
    reason:
      comparison.status === 'behind'
        ? `${comparison.stagingBranch} is behind ${comparison.productionBranch}`
        : `${comparison.productionBranch} and ${comparison.stagingBranch} have diverged`,
  }
}

export const compareProductionToStaging =
  async (): Promise<BranchSyncComparison> => {
    const octokit = getOctokit()
    const { owner, productionBranch, repo, stagingBranch } = getGithubConfig()
    const [productionSha, stagingSha] = await Promise.all([
      getBranchSha(productionBranch),
      getBranchSha(stagingBranch),
    ])

    const { data } = await octokit.repos.compareCommitsWithBasehead({
      owner,
      repo,
      basehead: `${productionBranch}...${stagingBranch}`,
    })

    return {
      aheadBy: data.ahead_by,
      behindBy: data.behind_by,
      productionBranch,
      productionSha,
      stagingBranch,
      stagingSha,
      status: data.status as BranchComparisonStatus,
    }
  }

export interface SyncProductionDependencies {
  compareProductionToStaging: () => Promise<BranchSyncComparison>
  createReleasePullRequest: (input: {
    base: string
    branchName: string
    title: string
    body: string
  }) => Promise<{ htmlUrl: string; number: number }>
  fastForward: (input: { branch: string; sha: string }) => Promise<void>
  isContentOnly: (diff: { baseSha: string; headSha: string }) => Promise<void>
}

export interface SyncProductionOptions {
  onFastForwardRefused?: (error: unknown) => void
}

const releasePullRequestBody = (reason: ReleasePullRequestReason): string =>
  reason === 'code-changes'
    ? 'Opened by the CMS. The changes include more than content, so a maintainer has to review and merge this release.'
    : 'Opened by the CMS. The CMS could not fast-forward production, so a maintainer has to review and merge this release.'

export const createSyncProductionBranchToStaging =
  (dependencies: SyncProductionDependencies) =>
  async (options: SyncProductionOptions = {}): Promise<BranchSyncResult> => {
    const comparison = await dependencies.compareProductionToStaging()
    const decision = getBranchSyncDecision(comparison)
    const { owner, repo, productionBranch, stagingBranch } = getGithubConfig()
    const links = getBranchSyncLinks({
      owner,
      repo,
      productionBranch: comparison.productionBranch,
      stagingBranch: comparison.stagingBranch,
    })
    if (decision.kind !== 'fast-forward') {
      return { comparison, decision, links, updated: false }
    }

    const openReleasePullRequest = async (
      reason: ReleasePullRequestReason
    ): Promise<BranchSyncResult> => {
      const pr = await dependencies.createReleasePullRequest({
        base: productionBranch,
        branchName: stagingBranch,
        title: `Release ${stagingBranch} to ${productionBranch}`,
        body: releasePullRequestBody(reason),
      })
      return {
        comparison,
        decision,
        links,
        promotion: {
          kind: 'release-pr',
          reason,
          pullRequestNumber: pr.number,
          pullRequestUrl: pr.htmlUrl,
        },
        updated: false,
      }
    }

    try {
      await dependencies.isContentOnly({
        baseSha: comparison.productionSha,
        headSha: decision.sha,
      })
    } catch {
      return openReleasePullRequest('code-changes')
    }

    try {
      await dependencies.fastForward({
        branch: productionBranch,
        sha: decision.sha,
      })
    } catch (error) {
      options.onFastForwardRefused?.(error)
      return openReleasePullRequest('fast-forward-refused')
    }

    return {
      comparison,
      decision,
      links,
      promotion: { kind: 'fast-forward' },
      updated: true,
    }
  }

export const syncProductionBranchToStaging =
  createSyncProductionBranchToStaging({
    compareProductionToStaging,
    createReleasePullRequest: (input) =>
      createOrGetPullRequest({ ...input, draft: false }),
    fastForward: async ({ branch, sha }) => {
      const { owner, repo } = getGithubConfig()
      await getOctokit().git.updateRef({
        owner,
        repo,
        force: false,
        ref: `heads/${branch}`,
        sha,
      })
    },
    isContentOnly: async (diff) => {
      await verifyContentDiff(diff)
    },
  })

export const mergePullRequestToBase = async ({
  pullRequestNumber,
  branchName,
  commitSha,
}: {
  pullRequestNumber: number
  branchName: string
  commitSha: string
}): Promise<MergePullRequestResult> => {
  const { owner, repo } = getGithubConfig()
  const pr = await getManagedPullRequest(pullRequestNumber)
  if (pr.branchName !== branchName || pr.headSha !== commitSha) {
    throw new Error('This PR no longer matches the saved CMS change')
  }
  if (!(await verifyContentDiff(pr)).length)
    throw new Error('This PR has no content changes to merge')

  const octokit = getOctokit()
  let readyForReview = false
  if (pr.draft) {
    await markPullRequestReadyForReview({ nodeId: pr.nodeId })
    readyForReview = true
  }

  const { data } = await octokit.pulls.merge({
    owner,
    repo,
    pull_number: pullRequestNumber,
    merge_method: 'squash',
    sha: pr.headSha,
  })

  return {
    merged: data.merged,
    message: data.message,
    pullRequestNumber,
    pullRequestUrl: pr.htmlUrl,
    readyForReview,
    sha: data.sha,
  }
}
