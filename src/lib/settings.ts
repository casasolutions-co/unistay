import { d1Query } from './d1';

// Kill switches written by the admin console's Settings screen (app_settings
// table). A key with no row means it was never touched by an admin — fall
// back to each switch's own "off the shelf" behavior, not a blanket true.
const DEFAULTS = {
  signups_enabled: true,
  listing_submission_enabled: true,
  maintenance_mode: false,
} as const;

export async function getAppSetting(key: keyof typeof DEFAULTS): Promise<boolean> {
  const rows = await d1Query<{ value: string }>(
    'SELECT value FROM app_settings WHERE key = ?',
    [key]
  );
  if (rows.length === 0) return DEFAULTS[key];
  return rows[0].value === 'true';
}
