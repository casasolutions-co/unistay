import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAppSetting } from '@/lib/settings';

// Runs ahead of every request, including statically-prerendered pages —
// unlike a check inside layout.tsx, which only runs once at build time for
// any route Next decides to prerender and would never see a live toggle.
export async function proxy(request: NextRequest) {
  if (!(await getAppSetting('maintenance_mode'))) {
    return NextResponse.next();
  }

  return new NextResponse(MAINTENANCE_HTML, {
    status: 503,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Retry-After': '3600' },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.png).*)'],
};

const MAINTENANCE_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>UniStay — Down for maintenance</title>
<style>
  body { margin:0; min-height:100dvh; display:flex; flex-direction:column; align-items:center;
    justify-content:center; gap:12px; padding:32px; text-align:center;
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
  h1 { font-size:26px; font-weight:800; margin:0; }
  p { font-size:15px; color:#6b6675; max-width:380px; margin:0; }
</style>
</head>
<body>
  <h1>Down for maintenance</h1>
  <p>UniStay is briefly offline for scheduled maintenance. Please check back shortly.</p>
</body>
</html>`;
