import { d1Query } from '@/lib/d1';
import { normalizeOccupation, TRAITS, TRAITS_MAX, ABOUT_MAX } from '@/lib/aboutMe';

export type ProfileInput = {
  name?: string | null;
  phone?: string | null;
  nationality?: string | null;
  residenceCountry?: string | null;
  residenceCity?: string | null;
  role?: string | null;
  occupation?: string | null;
  university?: string | null;
  program?: string | null;
  startYear?: string | null;
  jobTitle?: string | null;
  why?: string | null;
  propertiesCount?: number | string | null;
  propertyCities?: string | null;
  managementType?: string | null;
  traits?: unknown;
  about?: string | null;
};

const MANAGEMENT_TYPES = new Set(['private', 'agency', 'company']);

export function normalizeRole(role: unknown): 'student' | 'landlord' {
  return role === 'landlord' ? 'landlord' : 'student';
}

// Shared by POST /api/user/profile and the one-shot signup in /api/auth/sync.
// COALESCE keeps stored values for fields a caller doesn't send: residence and the
// landlord fields only come from registration/profile, traits/about only from the
// profile page, and a blank name must never wipe a stored one.
export async function saveProfile(uid: string, p: ProfileInput) {
  const count = Number(p.propertiesCount);
  const propertiesCount = p.propertiesCount !== '' && Number.isInteger(count) && count >= 0 && count <= 10000 ? count : null;
  const managementType = p.managementType && MANAGEMENT_TYPES.has(p.managementType) ? p.managementType : null;
  // occupation is the user's type (student | professional | landlord); users.role only
  // distinguishes landlords, so it follows occupation when one is sent.
  const occupation = normalizeOccupation(p.occupation ?? p.role);
  const role = occupation ? normalizeRole(occupation) : normalizeRole(p.role);
  const traits = Array.isArray(p.traits)
    ? JSON.stringify([...new Set(p.traits.filter((t): t is string => typeof t === 'string' && TRAITS.includes(t)))].slice(0, TRAITS_MAX))
    : null;
  const about = typeof p.about === 'string' ? p.about.trim().slice(0, ABOUT_MAX) : null;

  await d1Query(
    `UPDATE users SET
      name = COALESCE(NULLIF(TRIM(?), ''), name), phone = ?, nationality = ?,
      residence_country = COALESCE(?, residence_country), residence_city = COALESCE(?, residence_city), role = ?,
      occupation = COALESCE(?, occupation),
      university = ?, program = ?, start_year = ?,
      job_title = ?, why = COALESCE(?, why),
      properties_count = COALESCE(?, properties_count), property_cities = COALESCE(NULLIF(TRIM(?), ''), property_cities),
      management_type = COALESCE(?, management_type),
      traits = COALESCE(?, traits), about = COALESCE(?, about),
      profile_complete = 1, updated_at = ?
     WHERE id = ?`,
    [p.name ?? null, p.phone ?? null, p.nationality ?? null, p.residenceCountry ?? null, p.residenceCity ?? null,
     role, occupation,
     p.university ?? null, p.program ?? null, p.startYear ?? null,
     p.jobTitle ?? null, p.why ?? null,
     propertiesCount, p.propertyCities ?? null, managementType,
     traits, about,
     Date.now(), uid]
  );
}

// Mirrors Firebase's email_verified claim into D1 so the admin panel can see it.
// Only ever flips 0 → 1; Firebase never un-verifies an address.
export async function markEmailVerified(uid: string) {
  await d1Query(
    'UPDATE users SET email_verified = 1, email_verified_at = ? WHERE id = ? AND email_verified = 0',
    [Date.now(), uid]
  );
}
