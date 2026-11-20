'use client';

import { useRouter } from 'next/navigation';

// Shown instead of the Didit step while the "about me" profile is incomplete.
// Sends the user to /profile and back here once they've saved it.
export default function ProfileNeeded({ missing }: { missing: string[] }) {
  const router = useRouter();
  const goToProfile = () =>
    router.push(`/profile?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '10px 0' }}>
      <div style={{ width: 74, height: 74, borderRadius: '50%', background: '#f3effe', display: 'grid', placeItems: 'center', marginBottom: 20 }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21a8 8 0 1 0-16 0" /><circle cx="12" cy="7" r="4" />
        </svg>
      </div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, letterSpacing: '-.02em', margin: 0, color: 'var(--text)' }}>Complete your profile first</h2>
      <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--text-muted)', margin: '10px 0 0', maxWidth: 380 }}>
        Before you verify your identity, add a photo and tell people a bit about yourself. It takes about a minute.
      </p>
      {missing.length > 0 && (
        <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-soft)', margin: '12px 0 0', maxWidth: 380 }}>Still needed: {missing.join(', ')}</p>
      )}
      <button
        type="button"
        onClick={goToProfile}
        style={{ marginTop: 22, height: 50, padding: '0 28px', border: 'none', cursor: 'pointer', borderRadius: 13, fontFamily: 'var(--font-display)', fontSize: 14.5, fontWeight: 700, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, background: 'linear-gradient(180deg, #7c3aed, #6d28d9)', boxShadow: '0 10px 22px -6px rgba(109,40,217,.45), inset 0 1px 0 rgba(255,255,255,.22)' }}
      >
        Complete my profile
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </button>
    </div>
  );
}
