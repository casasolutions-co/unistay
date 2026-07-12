import 'server-only'
import { Resend } from 'resend'
import type { EmailPayload } from './templates'

// TODO: switch to a UniStay address once a sending domain is verified in Resend
// (resend.com/domains) — resend.dev only delivers to the account owner's own inbox.
const FROM = 'UniStay Support <onboarding@resend.dev>'

export async function sendEmail(to: string, payload: EmailPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY is not set')
  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({ from: FROM, to, subject: payload.subject, html: payload.html })
  if (error) throw new Error(`Resend error: ${error.message}`)
}
