import { NextResponse } from 'next/server'

/** Octokit request errors carry the HTTP status of the GitHub response. */
const isGithubRequestError = (error: unknown): boolean =>
  error instanceof Error &&
  'status' in error &&
  typeof error.status === 'number'

/**
 * Editors see the CMS's own validation messages, never raw GitHub client
 * errors, which can name tokens, rulesets or internal URLs. Those are logged.
 */
export const getEditorErrorMessage = (
  error: unknown,
  fallback: string,
  context: string
): string => {
  if (error instanceof Error && !isGithubRequestError(error))
    return error.message
  console.error(`[${context}]`, error)
  return fallback
}

export const logWorkflowError = (context: string, error: unknown): void => {
  console.error(`[${context}]`, error)
}

export const githubConfigErrorResponse = (
  context: string,
  error: unknown
): NextResponse => {
  logWorkflowError(context, error)
  return NextResponse.json(
    { error: 'GitHub is not configured for this CMS.' },
    { status: 500 }
  )
}
