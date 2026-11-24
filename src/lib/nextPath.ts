// Where to go after login: the `?next=` path (e.g. back to a listing with its
// dates), else the fallback. Only same-site paths — never `//evil.com`.
export function nextPath(fallback: string): string {
  const next = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('next');
  return next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : fallback;
}

export function loginUrl(next: string): string {
  return `/login?next=${encodeURIComponent(next)}`;
}

// `path` with the current page's `?next=` carried along, so a sign-up detour
// (login → register → complete → preferences) still ends on the original page.
export function withNext(path: string): string {
  const next = nextPath('');
  return next ? `${path}${path.includes('?') ? '&' : '?'}next=${encodeURIComponent(next)}` : path;
}
