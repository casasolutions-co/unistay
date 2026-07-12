import { wrapEmail, esc, APP_URL } from './layout'

export type EmailPayload = { subject: string; html: string }

// --- Support tickets --------------------------------------------------------
// Mirrors supportTicketReplyEmail/supportTicketResolvedEmail in the student/host
// app's reference/emails/templates.ts — these two are the admin-triggered half
// (reply and resolve happen from this panel), so only they live here.

export function supportTicketReplyEmail(opts: {
  name?: string | null
  ticketNo: number
  subject: string
}): EmailPayload {
  const name = opts.name?.trim() || 'there'
  return {
    subject: `New reply on ticket #${opts.ticketNo}`,
    html: wrapEmail({
      preheader: `Support replied to ticket #${opts.ticketNo}.`,
      heading: 'Support replied to your ticket',
      bodyHtml: `
        <p>Hi ${esc(name)}, you have a new reply on <strong>ticket #${opts.ticketNo}</strong>: "${esc(opts.subject)}".</p>
      `,
      ctaLabel: 'View reply',
      ctaUrl: `${APP_URL}/messages`,
    }),
  }
}

export function supportTicketResolvedEmail(opts: {
  name?: string | null
  ticketNo: number
  subject: string
}): EmailPayload {
  const name = opts.name?.trim() || 'there'
  return {
    subject: `Ticket #${opts.ticketNo} resolved`,
    html: wrapEmail({
      preheader: `Ticket #${opts.ticketNo} has been marked resolved.`,
      heading: 'Your ticket has been resolved',
      bodyHtml: `
        <p>Hi ${esc(name)}, <strong>ticket #${opts.ticketNo}</strong>: "${esc(opts.subject)}" has been marked resolved. If this didn't fully solve things, just reply to reopen it.</p>
      `,
      ctaLabel: 'View ticket',
      ctaUrl: `${APP_URL}/messages`,
    }),
  }
}
