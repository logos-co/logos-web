import nodemailer, { type Transporter } from 'nodemailer'

import { getServerEnv } from '@/server/env'

/** Matches the timeouts the existing internal SMTP contract already uses. */
const SMTP_TIMEOUT_MS = 10_000

export interface MailMessage {
  to: string
  subject: string
  text: string
}

/**
 * Named so the delivery record says why it failed. "Error" in that column tells
 * whoever investigates nothing, which defeats the point of keeping it.
 */
export class SmtpNotConfiguredError extends Error {
  constructor() {
    super('SMTP is not configured.')
    this.name = 'SmtpNotConfigured'
  }
}

let transporter: Transporter | null = null

function getTransporter(): Transporter | null {
  const env = getServerEnv()
  if (!env.SMTP_SERVER || !env.SMTP_FROM) return null
  if (transporter) return transporter

  transporter = nodemailer.createTransport({
    host: env.SMTP_SERVER,
    port: env.SMTP_PORT ?? 587,
    secure: env.SMTP_TLS_ENABLE === 'true' && (env.SMTP_PORT ?? 587) === 465,
    requireTLS: env.SMTP_TLS_ENABLE === 'true',
    ...(env.SMTP_USER && env.SMTP_PASSWORD
      ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } }
      : {}),
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS,
  })

  return transporter
}

/**
 * Sends one message through the Infra SMTP relay.
 *
 * The sender address is server configuration and is never taken from request
 * data: a caller that could choose the From line could send mail as anyone.
 *
 * With no SMTP configured this throws rather than silently succeeding, so a
 * misconfigured deployment shows up as failed deliveries to investigate instead
 * of notifications nobody ever receives.
 */
export async function sendMail(message: Readonly<MailMessage>): Promise<void> {
  const env = getServerEnv()
  const mailer = getTransporter()

  if (!mailer || !env.SMTP_FROM) {
    throw new SmtpNotConfiguredError()
  }

  await mailer.sendMail({
    from: env.SMTP_FROM,
    to: message.to,
    subject: message.subject,
    text: message.text,
  })
}

/** Test seam: drops the memoised transporter so config changes take effect. */
export function resetMailer(): void {
  transporter = null
}
