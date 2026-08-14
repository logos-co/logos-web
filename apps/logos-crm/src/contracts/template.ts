import type { CaseDecision } from './evaluation'

export interface TemplateContext {
  applicantName: string
  caseTitle: string
  organisationName: string | null
  profile: string | null
  decisionReason: string | null
  coordinatorName: string
}

export interface ResponseTemplate {
  id: Exclude<CaseDecision, 'pending'>
  label: string
  subject: string
  body: string
}

/**
 * Response wording for the three outcomes, so the same decision does not get
 * explained three different ways depending on who typed it.
 *
 * These are drafts to send from a normal mail client, not messages this app
 * sends. Outbound mail to applicants needs suppression and a consent-withdrawal
 * path, and neither exists yet — a send button here would be the fastest way to
 * mail somebody who asked not to be contacted.
 */
const TEMPLATES: ResponseTemplate[] = [
  {
    id: 'approved',
    label: 'Approved',
    subject: 'Your Logos application — next steps',
    body: [
      'Hi {{applicantName}},',
      '',
      'Thank you for applying to Logos{{organisationClause}}. We have reviewed your submission and would like to move forward.',
      '',
      '{{decisionReason}}',
      '',
      'Someone from the team will be in touch shortly to arrange the next conversation.',
      '',
      'Best,',
      '{{coordinatorName}}',
    ].join('\n'),
  },
  {
    id: 'redirected',
    label: 'Redirected',
    subject: 'Your Logos application — a better fit',
    body: [
      'Hi {{applicantName}},',
      '',
      'Thank you for applying to Logos{{organisationClause}}. Having read your submission, we think another part of the movement is a better fit for what you are building.',
      '',
      '{{decisionReason}}',
      '',
      'We would still like to stay in touch, and we will point you at the right people.',
      '',
      'Best,',
      '{{coordinatorName}}',
    ].join('\n'),
  },
  {
    id: 'declined',
    label: 'Declined',
    subject: 'Your Logos application',
    body: [
      'Hi {{applicantName}},',
      '',
      'Thank you for taking the time to apply to Logos{{organisationClause}}. After reviewing your submission we are not able to take this forward at the moment.',
      '',
      '{{decisionReason}}',
      '',
      'We appreciate the effort you put into applying, and you are welcome to apply again as things change.',
      '',
      'Best,',
      '{{coordinatorName}}',
    ].join('\n'),
  },
]

function fill(template: string, context: Readonly<TemplateContext>): string {
  const values: Record<string, string> = {
    applicantName: context.applicantName,
    caseTitle: context.caseTitle,
    coordinatorName: context.coordinatorName,
    organisationClause: context.organisationName
      ? ` on behalf of ${context.organisationName}`
      : '',
    // An empty reason removes the paragraph rather than leaving a placeholder
    // in a message somebody is about to send to a real person.
    decisionReason: context.decisionReason ?? '',
  }

  return template
    .replace(/\{\{(\w+)\}\}/g, (_match, key: string) => values[key] ?? '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function renderResponseTemplate(
  decision: Exclude<CaseDecision, 'pending'>,
  context: Readonly<TemplateContext>
): ResponseTemplate | null {
  const template = TEMPLATES.find((item) => item.id === decision)
  if (!template) return null

  return {
    ...template,
    subject: fill(template.subject, context),
    body: fill(template.body, context),
  }
}

export function listResponseTemplates(): ResponseTemplate[] {
  return TEMPLATES.map((template) => ({ ...template }))
}
