'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

// Shared by the desktop + mobile sign-up and complete-profile forms. Each passes its own
// CSS module; the class names used here exist in both page.module.css and RegisterMobile.module.css.
type Styles = Record<string, string>;

export type Role = 'student' | 'employed' | 'landlord' | null;

export type LandlordInfo = { propertiesCount: string; propertyCities: string; managementType: string };
export const EMPTY_LANDLORD: LandlordInfo = { propertiesCount: '', propertyCities: '', managementType: '' };

type Details = {
  name?: string; nationality: string; phone: string; residenceCountry: string; residenceCity: string;
  role: Role; university: string; program: string; startYear: string;
};

// Labels of required fields still empty, in form order — shown under the submit button
// so a disabled button always says why.
export function missingFields(d: Details): string[] {
  const missing: string[] = [];
  if (d.name !== undefined && !d.name.trim()) missing.push('full name');
  if (!d.nationality) missing.push('nationality');
  if (!d.phone.trim()) missing.push('phone');
  if (!d.residenceCountry) missing.push('country');
  if (!d.residenceCity.trim()) missing.push('city');
  if (!d.role) missing.push('who you are');
  if (d.role === 'student') {
    if (!d.university.trim()) missing.push('university');
    if (!d.program.trim()) missing.push('program');
    if (!d.startYear) missing.push('start year');
  }
  return missing;
}

export function MissingHint({ missing, styles }: { missing: string[]; styles: Styles }) {
  if (!missing.length) return null;
  return <p className={styles.hint}>Still needed: {missing.join(', ')}</p>;
}

// Landlords go straight to listing (verify → apply); housing preferences are for tenants.
export function afterSignupPath(role: Role) {
  return role === 'landlord' ? '/list' : '/register/preferences';
}

export function landlordPayload(role: Role, l: LandlordInfo) {
  if (role !== 'landlord') return {};
  return {
    propertiesCount: l.propertiesCount || null,
    propertyCities: l.propertyCities.trim() || null,
    managementType: l.managementType || null,
  };
}

export function passwordStrength(pw: string): { score: 0 | 1 | 2 | 3; label: string } {
  if (!pw) return { score: 0, label: '' };
  if (pw.length < 8) return { score: 1, label: `${8 - pw.length} more character${pw.length === 7 ? '' : 's'}` };
  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter(r => r.test(pw)).length;
  return pw.length >= 12 && variety >= 3 ? { score: 3, label: 'Strong password' } : { score: 2, label: 'Good — longer or mixed is stronger' };
}

export function PasswordMeter({ password, styles }: { password: string; styles: Styles }) {
  const { score, label } = passwordStrength(password);
  if (!score) return null;
  return (
    <div className={styles.pwMeter} data-score={score}>
      <div className={styles.pwBars}><span /><span /><span /></div>
      <span className={styles.pwLabel}>{label}</span>
    </div>
  );
}

export function Spinner({ styles }: { styles: Styles }) {
  return <span className={styles.spinner} aria-hidden="true" />;
}

// Firebase restores the session asynchronously, so read displayName once it's known.
// True when the signed-in account has no name (some Google accounts) and the form must ask.
export function useNeedsName() {
  const [needsName, setNeedsName] = useState(false);
  useEffect(() => onAuthStateChanged(auth, u => setNeedsName(!!u && !u.displayName?.trim())), []);
  return needsName;
}

const ROLES: { value: Exclude<Role, null>; title: string; sub: string; icon: React.ReactNode }[] = [
  {
    value: 'student', title: 'Student', sub: 'Studying in Germany',
    icon: <><path d="M22 10 12 5 2 10l10 5 10-5Z" /><path d="M6 12v5c0 1 2.7 3 6 3s6-2 6-3v-5" /></>,
  },
  {
    value: 'employed', title: 'Professional', sub: 'Working or relocating',
    icon: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>,
  },
  {
    value: 'landlord', title: 'Landlord', sub: 'I rent out a place',
    icon: <><path d="M3 11 12 4l9 7" /><path d="M5 10v10h14V10" /><path d="M10 20v-5h4v5" /></>,
  },
];

export function RoleCards({ role, onChange, styles }: { role: Role; onChange: (r: Role) => void; styles: Styles }) {
  return (
    <div className={styles.roleRow} role="radiogroup" aria-label="I am a">
      {ROLES.map(r => (
        <button
          key={r.value}
          type="button"
          role="radio"
          aria-checked={role === r.value}
          className={role === r.value ? styles.roleBtnActive : styles.roleBtn}
          onClick={() => onChange(r.value)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{r.icon}</svg>
          <span className={styles.roleTitle}>{r.title}</span>
          <span className={styles.roleSub}>{r.sub}</span>
        </button>
      ))}
    </div>
  );
}

export function LandlordFields({ value, onChange, styles, fieldClass }: {
  value: LandlordInfo; onChange: (v: LandlordInfo) => void; styles: Styles; fieldClass: string;
}) {
  const set = (k: keyof LandlordInfo) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...value, [k]: e.target.value });
  return (
    <div>
      <p className={styles.landlordNote}>
        You can list once your ID is verified and our team approves your landlord profile — we&apos;ll guide you next.
      </p>
      <label className={styles.label}>How do you rent? <span className={styles.optional}>(optional)</span></label>
      <div className={styles.chipRow}>
        {[['private', 'Private owner'], ['agency', 'Agency'], ['company', 'Company']].map(([v, label]) => (
          <button key={v} type="button" className={value.managementType === v ? styles.chipActive : styles.chip}
            onClick={() => onChange({ ...value, managementType: value.managementType === v ? '' : v })}>
            {label}
          </button>
        ))}
      </div>
      <label className={styles.label}>Number of properties <span className={styles.optional}>(optional)</span></label>
      <input type="number" min={1} inputMode="numeric" className={fieldClass} placeholder="e.g. 2"
        value={value.propertiesCount} onChange={set('propertiesCount')} />
      <label className={styles.label}>Cities <span className={styles.optional}>(optional)</span></label>
      <input type="text" className={fieldClass} placeholder="e.g. Berlin, Munich"
        value={value.propertyCities} onChange={set('propertyCities')} />
    </div>
  );
}
