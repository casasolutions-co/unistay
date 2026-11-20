// Landlord application: the questions and declarations asked before an admin
// approves someone as a landlord. Pure data + checks, safe to import from
// client and server. Each submission is stored in `landlord_applications`.

export const RENTAL_TYPES = [
  { value: 'owner', title: 'I own the place', sub: 'Private owner' },
  { value: 'sublet', title: 'I’m subletting', sub: 'Main tenant renting out a room' },
  { value: 'agency', title: 'Agency', sub: 'Property manager or company' },
] as const;
export type RentalType = (typeof RENTAL_TYPES)[number]['value'];

export const LISTING_COUNTS = ['1', '2-5', '6+'] as const;
export type ListingCount = (typeof LISTING_COUNTS)[number];

export const DECLARATIONS = [
  { key: 'right_to_rent', title: 'I have the right to rent these places', sub: 'I own them, or have written permission to rent or sublet them.' },
  { key: 'accurate_listings', title: 'My listings will be accurate', sub: 'Photos and details show the real place.' },
  { key: 'no_payment_before_contract', title: 'I won’t ask for money before a contract', sub: 'No rent or deposit outside UniStay before a viewing and a signed contract.' },
  { key: 'fair_treatment', title: 'I’ll treat every applicant fairly', sub: 'In line with German equal-treatment law (AGG).' },
] as const;
export type DeclarationKey = (typeof DECLARATIONS)[number]['key'];

// Bump when the Terms the applicant agrees to change; stored per application.
export const LANDLORD_TERMS_VERSION = '2026-06';

export type LandlordApplication = {
  rentalType: RentalType;
  listingCount: ListingCount;
  phone: string;
  companyName: string | null;
  companyWebsite: string | null;
  declarations: DeclarationKey[];
  termsVersion: string;
};

const PHONE_RE = /^\+?[0-9][0-9 ()/-]{5,22}$/;

// Validates untrusted input. Returns the cleaned application or an error message.
export function parseLandlordApplication(raw: unknown): { ok: true; value: LandlordApplication } | { ok: false; error: string } {
  const b = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

  const rentalType = str(b.rentalType);
  if (!RENTAL_TYPES.some(t => t.value === rentalType)) return { ok: false, error: 'Choose how you rent out.' };

  const listingCount = str(b.listingCount);
  if (!(LISTING_COUNTS as readonly string[]).includes(listingCount)) return { ok: false, error: 'Choose how many places you’ll list.' };

  const phone = str(b.phone);
  if (!PHONE_RE.test(phone) || phone.replace(/\D/g, '').length < 6) return { ok: false, error: 'Enter a valid phone number.' };

  let companyName: string | null = null;
  let companyWebsite: string | null = null;
  if (rentalType === 'agency') {
    companyName = str(b.companyName).slice(0, 120);
    if (!companyName) return { ok: false, error: 'Enter your company name.' };
    companyWebsite = str(b.companyWebsite).slice(0, 200);
    if (companyWebsite && !/^https?:\/\//i.test(companyWebsite)) companyWebsite = `https://${companyWebsite}`;
    try {
      if (!companyWebsite || !new URL(companyWebsite).hostname.includes('.')) throw new Error();
    } catch {
      return { ok: false, error: 'Enter your company website.' };
    }
  }

  const given = Array.isArray(b.declarations) ? b.declarations : [];
  if (!DECLARATIONS.every(d => given.includes(d.key))) return { ok: false, error: 'Please confirm every statement.' };

  if (b.termsVersion !== LANDLORD_TERMS_VERSION) return { ok: false, error: 'Please accept the Terms and Privacy Policy.' };

  return {
    ok: true,
    value: {
      rentalType: rentalType as RentalType,
      listingCount: listingCount as ListingCount,
      phone,
      companyName,
      companyWebsite,
      declarations: DECLARATIONS.map(d => d.key),
      termsVersion: LANDLORD_TERMS_VERSION,
    },
  };
}
