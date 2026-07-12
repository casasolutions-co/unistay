const FROM = process.env.EMAIL_FROM ?? 'UniStay <notifications@unistay.com>';

// Fire-and-forget transactional email via Resend's HTTP API. Never throws —
// a failed notification email should never break the request that triggered it.
export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!to) return;

  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set, skipping:', subject, '->', to);
    return;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
    if (!res.ok) {
      console.error('[email] send failed', subject, '->', to, await res.text());
    }
  } catch (err) {
    console.error('[email] send error', subject, '->', to, err);
  }
}
