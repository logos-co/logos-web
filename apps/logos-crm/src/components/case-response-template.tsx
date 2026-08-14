'use client'

import { useState } from 'react'

import type { CaseRecord } from '@/contracts/case'
import { renderResponseTemplate } from '@/contracts/template'

interface CaseResponseTemplateProps {
  item: CaseRecord
  coordinatorName: string
  /** Suppression on the applicant this draft would be addressed to. */
  isSuppressed?: boolean
}

/**
 * Drafts the reply that goes with a decision.
 *
 * Copy, not send. Outbound mail to applicants needs suppression and a
 * consent-withdrawal path, and until those exist a send button here would be
 * the quickest way to contact somebody who asked not to be.
 */
export function CaseResponseTemplate({
  item,
  coordinatorName,
  isSuppressed = false,
}: CaseResponseTemplateProps) {
  const [copied, setCopied] = useState(false)

  if (item.decision === 'pending') return null

  // Handing over a ready-to-send draft for somebody who asked not to be
  // contacted is how that request gets broken by accident.
  if (isSuppressed) {
    return (
      <section className="report-card response-card">
        <p className="utility-label">Response draft</p>
        <p className="report-note">
          This applicant asked not to be contacted, so no draft is offered.
          Record the outcome on the case instead.
        </p>
      </section>
    )
  }

  const template = renderResponseTemplate(item.decision, {
    applicantName: item.relatedPeople[0]?.fullName ?? 'there',
    caseTitle: item.title,
    organisationName: item.organisationName,
    profile: null,
    decisionReason: item.decisionReason,
    coordinatorName,
  })

  if (!template) return null

  async function copy() {
    if (!template) return
    await navigator.clipboard.writeText(
      `Subject: ${template.subject}\n\n${template.body}`
    )
    setCopied(true)
    window.setTimeout(() => setCopied(false), 3_000)
  }

  return (
    <section className="report-card response-card">
      <div className="evaluation-header">
        <p className="utility-label">Response draft</p>
        <button
          className="work-text-action cursor-pointer"
          type="button"
          onClick={() => void copy()}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <p className="report-note">
        Send this from your own mail client. The CRM does not contact applicants
        yet — suppression and consent withdrawal are not built.
      </p>

      <p className="response-subject">{template.subject}</p>
      <pre className="response-body">{template.body}</pre>
    </section>
  )
}
