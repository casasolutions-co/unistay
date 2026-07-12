const BRAND = '#6d28d9';
const INK = '#2a1259';

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://unistay.com';

export function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function wrapEmail(opts: {
  preheader: string;
  heading: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
}): string {
  const { preheader, heading, bodyHtml, ctaLabel, ctaUrl } = opts;

  const cta = ctaLabel && ctaUrl
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
         <tr><td style="border-radius:8px;background:${BRAND};">
           <a href="${ctaUrl}" style="display:inline-block;padding:12px 24px;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;border-radius:8px;">${ctaLabel}</a>
         </td></tr>
       </table>`
    : '';

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${heading}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f2fa;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2fa;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(42,18,89,0.08);">
            <tr>
              <td style="background:#ffffff;padding:24px 32px;border-bottom:3px solid ${BRAND};">
                <img src="${APP_URL}/primary-logo.png" alt="UniStay" width="124" height="107" style="display:block;height:36px;width:auto;border:0;" />
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:${INK};">${heading}</h1>
                <div style="font-size:15px;line-height:1.6;color:#3f3350;">${bodyHtml}</div>
                ${cta}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background:#faf9fc;border-top:1px solid #ece7f5;">
                <p style="margin:0;font-size:12px;line-height:1.5;color:#9086a3;">UniStay &middot; Student housing, sorted.<br />Need help? Reply to this email or reach out from the Support tab in the app.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
