'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User } from 'firebase/auth';

export type LandlordStatus = 'none' | 'pending' | 'approved' | 'rejected';

// Shown in place of the "List your place" form until the current user is an
// admin-approved landlord. Sits behind the identity-verification gate this
// flow already has (../verify/page.tsx) — status/note come from the parent,
// which already fetches it once to decide whether to render this at all.
export default function ApplyLandlordGate({
  user, status, note, onApplied,
}: {
  user: User;
  status: Exclude<LandlordStatus, 'approved'>;
  note: string | null;
  onApplied: (status: LandlordStatus) => void;
}) {
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');

  async function apply() {
    setApplying(true);
    setError('');
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/user/apply-landlord', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json() as { landlordStatus?: LandlordStatus; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Could not submit application');
      onApplied(data.landlordStatus ?? 'pending');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit application');
    } finally {
      setApplying(false);
    }
  }

  const copy: Record<typeof status, { title: string; body: string }> = {
    none: {
      title: 'Apply to become a landlord',
      body: 'Listing a place requires admin approval. Apply below — you’ll hear back once it’s reviewed.',
    },
    pending: {
      title: 'Application under review',
      body: 'Your landlord application is pending review. We’ll let you know as soon as it’s approved.',
    },
    rejected: {
      title: 'Application not approved',
      body: note ? `Reason: ${note}` : 'Your last application wasn’t approved. You can re-apply below.',
    },
  };
  const { title, body } = copy[status];

  return (
    <div style={{
      maxWidth: 480, margin: '80px auto', padding: '40px 36px',
      background: '#fff', border: '1px solid #e6e2ef', borderRadius: 16,
      textAlign: 'center', fontFamily: 'inherit',
    }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: '0 0 10px' }}>{title}</h1>
      <p style={{ fontSize: 14.5, color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 22px' }}>{body}</p>
      {status !== 'pending' && (
        <button
          type="button"
          disabled={applying}
          onClick={apply}
          style={{
            border: 'none', borderRadius: 10, padding: '12px 26px',
            background: '#6d28d9', color: '#fff', fontWeight: 700, fontSize: 14.5,
            cursor: applying ? 'default' : 'pointer', opacity: applying ? 0.7 : 1,
          }}
        >
          {applying ? 'Submitting…' : 'Apply now'}
        </button>
      )}
      {error && <p style={{ color: '#c2557a', fontSize: 12.5, fontWeight: 600, marginTop: 14 }}>{error}</p>}
      <p style={{ marginTop: 22 }}>
        <Link href="/" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'underline' }}>Back to home</Link>
      </p>
    </div>
  );
}
