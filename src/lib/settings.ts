import { d1Query } from './d1';

// Kill switches written by the admin console's Settings screen (app_settings
// table). A key with no row means it was never touched by an admin — fall
// back to each switch's own "off the shelf" behavior, not a blanket true.
const DEFAULTS = {
  signups_enabled: true,
  listing_submission_enabled: true,
  maintenance_mode: false,
} as const;

// Runs on (almost) every request via proxy.ts, so a D1 hiccup must never take
// the whole site down with it — fail open to each switch's own default, and
// cache briefly so a healthy D1 isn't hit on every single page load either.
// ponytail: process-local cache, per-instance TTL races are fine for a
// kill-switch that changes a few times a year; add a shared cache if that changes.
const CACHE_TTL_MS = 30_000;
const cache = new Map<string, { value: boolean; expiresAt: number }>();

export async function getAppSetting(key: keyof typeof DEFAULTS): Promise<boolean> {
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  let value: boolean;
  try {
    const rows = await d1Query<{ value: string }>(
      'SELECT value FROM app_settings WHERE key = ?',
      [key]
    );
    value = rows.length === 0 ? DEFAULTS[key] : rows[0].value === 'true';
  } catch (err) {
    console.error(`getAppSetting(${key}) failed, falling back to default`, err);
    value = DEFAULTS[key];
  }

  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}
