import { getOctokit } from './client'
import { getGithubConfig } from './config'
import { getBranchSha } from './mutations'
import { getPullRequest } from './pull-requests'

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

export interface BranchSyncResult {
  comparison: BranchSyncComparison
  decision: BranchSyncDecision
  updated: boolean
}

export interface MergePullRequestResult {
  merged: boolean
  message: string
  pullRequestNumber: number
  sha: string | null
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

export const syncProductionBranchToStaging =
  async (): Promise<BranchSyncResult> => {
    const comparison = await compareProductionToStaging()
    const decision = getBranchSyncDecision(comparison)
    if (decision.kind !== 'fast-forward') {
      return {
        comparison,
        decision,
        updated: false,
      }
    }

    const octokit = getOctokit()
    const { owner, productionBranch, repo } = getGithubConfig()
    await octokit.git.updateRef({
      owner,
      repo,
      force: false,
      ref: `heads/${productionBranch}`,
      sha: decision.sha,
    })

    return {
      comparison,
      decision,
      updated: true,
    }
  }

export const mergePullRequestToBase = async ({
  pullRequestNumber,
}: {
  pullRequestNumber: number
}): Promise<MergePullRequestResult> => {
  const { prBaseBranch, owner, repo } = getGithubConfig()
  const pr = await getPullRequest(pullRequestNumber)
  if (pr.baseBranch !== prBaseBranch) {
    throw new Error(
      `PR #${pullRequestNumber} targets "${pr.baseBranch}", expected "${prBaseBranch}"`
    )
  }

  const octokit = getOctokit()
  const { data } = await octokit.pulls.merge({
    owner,
    repo,
    pull_number: pullRequestNumber,
    merge_method: 'merge',
  })

  return {
    merged: data.merged,
    message: data.message,
    pullRequestNumber,
    sha: data.sha,
  }
}
