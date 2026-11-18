import { d1Query } from '@/lib/d1';

export type ProfileInput = {
  name?: string | null;
  phone?: string | null;
  nationality?: string | null;
  residenceCountry?: string | null;
  residenceCity?: string | null;
  role?: string | null;
  university?: string | null;
  program?: string | null;
  startYear?: string | null;
  jobTitle?: string | null;
  why?: string | null;
  propertiesCount?: number | string | null;
  propertyCities?: string | null;
  managementType?: string | null;
};

const MANAGEMENT_TYPES = new Set(['private', 'agency', 'company']);

export function normalizeRole(role: unknown): 'student' | 'landlord' {
  return role === 'landlord' ? 'landlord' : 'student';
}

// Shared by POST /api/user/profile and the one-shot signup in /api/auth/sync.
// COALESCE keeps stored values for fields a caller doesn't send: residence and the
// landlord fields only come from registration, and a blank name (e.g. a Google
// account without a display name) must never wipe a stored one.
export async function saveProfile(uid: string, p: ProfileInput) {
  const count = Number(p.propertiesCount);
  const propertiesCount = Number.isInteger(count) && count >= 0 && count <= 10000 ? count : null;
  const managementType = p.managementType && MANAGEMENT_TYPES.has(p.managementType) ? p.managementType : null;

  await d1Query(
    `UPDATE users SET
      name = COALESCE(NULLIF(TRIM(?), ''), name), phone = ?, nationality = ?,
      residence_country = COALESCE(?, residence_country), residence_city = COALESCE(?, residence_city), role = ?,
      university = ?, program = ?, start_year = ?,
      job_title = ?, why = ?,
      properties_count = COALESCE(?, properties_count), property_cities = COALESCE(NULLIF(TRIM(?), ''), property_cities),
      management_type = COALESCE(?, management_type),
      profile_complete = 1, updated_at = ?
     WHERE id = ?`,
    [p.name ?? null, p.phone ?? null, p.nationality ?? null, p.residenceCountry ?? null, p.residenceCity ?? null,
     normalizeRole(p.role),
     p.university ?? null, p.program ?? null, p.startYear ?? null,
     p.jobTitle ?? null, p.why ?? null,
     propertiesCount, p.propertyCities ?? null, managementType,
     Date.now(), uid]
  );
}
