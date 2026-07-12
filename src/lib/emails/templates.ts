import { wrapEmail, esc, APP_URL } from './layout';

export type EmailPayload = { subject: string; html: string };

// --- Welcome -----------------------------------------------------------

export function welcomeEmail(opts: { name?: string | null; role: 'student' | 'landlord' }): EmailPayload {
  const name = opts.name?.trim() || 'there';
  const isLandlord = opts.role === 'landlord';
  return {
    subject: 'Welcome to UniStay',
    html: wrapEmail({
      preheader: 'Your UniStay account is ready to go.',
      heading: `Welcome, ${esc(name)}`,
      bodyHtml: `
        <p>Your UniStay account is set up. ${isLandlord
          ? 'You can now list a property and start hearing from students looking for a place to stay.'
          : 'You can now browse verified student housing and message hosts directly.'}</p>
      `,
      ctaLabel: isLandlord ? 'List a property' : 'Browse listings',
      ctaUrl: isLandlord ? `${APP_URL}/list` : `${APP_URL}/search`,
    }),
  };
}

// --- KYC / identity verification ----------------------------------------

export function kycApprovedEmail(opts: { name?: string | null }): EmailPayload {
  const name = opts.name?.trim() || 'there';
  return {
    subject: 'You’re verified on UniStay',
    html: wrapEmail({
      preheader: 'Your identity verification was approved.',
      heading: `You're verified, ${esc(name)}`,
      bodyHtml: `
        <p>Your identity verification has been approved. Your profile now shows the verified badge, which helps build trust with other students and hosts.</p>
      `,
      ctaLabel: 'View your profile',
      ctaUrl: `${APP_URL}/settings`,
    }),
  };
}

export function kycRejectedEmail(opts: { name?: string | null; reason?: string | null }): EmailPayload {
  const name = opts.name?.trim() || 'there';
  return {
    subject: 'Action needed: identity verification',
    html: wrapEmail({
      preheader: 'We couldn’t verify your identity with the documents provided.',
      heading: `We couldn't verify your identity`,
      bodyHtml: `
        <p>Hi ${esc(name)}, we weren't able to complete your identity verification.</p>
        ${opts.reason ? `<p style="margin:12px 0;padding:12px 16px;background:#faf9fc;border-radius:8px;color:#6b6480;"><strong>Reason:</strong> ${esc(opts.reason)}</p>` : ''}
        <p>You can restart verification at any time from your account settings.</p>
      `,
      ctaLabel: 'Restart verification',
      ctaUrl: `${APP_URL}/settings`,
    }),
  };
}

// --- Inquiries & bookings -------------------------------------------------

export function newInquiryEmail(opts: {
  landlordName?: string | null;
  studentName?: string | null;
  listingTitle: string;
  message: string;
}): EmailPayload {
  const landlordName = opts.landlordName?.trim() || 'there';
  const studentName = opts.studentName?.trim() || 'A student';
  return {
    subject: `New inquiry: ${opts.listingTitle}`,
    html: wrapEmail({
      preheader: `${studentName} messaged you about ${opts.listingTitle}.`,
      heading: 'New inquiry on your listing',
      bodyHtml: `
        <p>Hi ${esc(landlordName)}, ${esc(studentName)} sent a message about <strong>${esc(opts.listingTitle)}</strong>:</p>
        <p style="margin:12px 0;padding:12px 16px;background:#faf9fc;border-radius:8px;color:#3f3350;">${esc(opts.message)}</p>
      `,
      ctaLabel: 'Reply in Messages',
      ctaUrl: `${APP_URL}/messages`,
    }),
  };
}

export function bookingRequestEmail(opts: {
  landlordName?: string | null;
  studentName?: string | null;
  listingTitle: string;
  moveIn?: string | null;
}): EmailPayload {
  const landlordName = opts.landlordName?.trim() || 'there';
  const studentName = opts.studentName?.trim() || 'A student';
  return {
    subject: `Booking request: ${opts.listingTitle}`,
    html: wrapEmail({
      preheader: `${studentName} requested to book ${opts.listingTitle}.`,
      heading: 'New booking request',
      bodyHtml: `
        <p>Hi ${esc(landlordName)}, ${esc(studentName)} requested to book <strong>${esc(opts.listingTitle)}</strong>${opts.moveIn ? `, moving in ${esc(opts.moveIn)}` : ''}.</p>
        <p>Accept or decline the request from your Messages inbox.</p>
      `,
      ctaLabel: 'Review request',
      ctaUrl: `${APP_URL}/messages`,
    }),
  };
}

export function bookingStatusEmail(opts: {
  studentName?: string | null;
  listingTitle: string;
  status: 'accepted' | 'declined';
}): EmailPayload {
  const studentName = opts.studentName?.trim() || 'there';
  const accepted = opts.status === 'accepted';
  return {
    subject: accepted ? `Booking accepted: ${opts.listingTitle}` : `Booking update: ${opts.listingTitle}`,
    html: wrapEmail({
      preheader: accepted
        ? `Your booking request for ${opts.listingTitle} was accepted.`
        : `Your booking request for ${opts.listingTitle} was declined.`,
      heading: accepted ? 'Your booking request was accepted' : 'Your booking request was declined',
      bodyHtml: accepted
        ? `<p>Hi ${esc(studentName)}, good news — your booking request for <strong>${esc(opts.listingTitle)}</strong> was accepted. Head to Messages to sort out next steps with the host.</p>`
        : `<p>Hi ${esc(studentName)}, the host declined your booking request for <strong>${esc(opts.listingTitle)}</strong>. Keep browsing — there are other listings that might be a better fit.</p>`,
      ctaLabel: accepted ? 'View in Messages' : 'Browse listings',
      ctaUrl: accepted ? `${APP_URL}/messages` : `${APP_URL}/search`,
    }),
  };
}

// --- Support tickets -------------------------------------------------------

export function supportTicketCreatedEmail(opts: {
  name?: string | null;
  ticketNo: number;
  subject: string;
}): EmailPayload {
  const name = opts.name?.trim() || 'there';
  return {
    subject: `We got your message [Ticket #${opts.ticketNo}]`,
    html: wrapEmail({
      preheader: `Ticket #${opts.ticketNo} has been opened.`,
      heading: `We've got your message`,
      bodyHtml: `
        <p>Hi ${esc(name)}, thanks for reaching out. We've opened <strong>ticket #${opts.ticketNo}</strong>: "${esc(opts.subject)}".</p>
        <p>Our support team will reply here as soon as possible.</p>
      `,
      ctaLabel: 'View ticket',
      ctaUrl: `${APP_URL}/messages`,
    }),
  };
}

export function supportTicketReplyEmail(opts: {
  name?: string | null;
  ticketNo: number;
  subject: string;
}): EmailPayload {
  const name = opts.name?.trim() || 'there';
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
  };
}

export function supportTicketResolvedEmail(opts: {
  name?: string | null;
  ticketNo: number;
  subject: string;
}): EmailPayload {
  const name = opts.name?.trim() || 'there';
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
  };
}
