'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface Props {
  user: User | null;
  onClose: () => void;
}

export default function DeleteAccountModal({ user, onClose }: Props) {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const canConfirm = confirmText.trim().toUpperCase() === 'DELETE' && !deleting;

  const handleDelete = async () => {
    if (!canConfirm || !user) return;
    setDeleting(true);
    setError('');
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/user/delete-account', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const text = await res.text();
        let msg = 'Failed to delete account. Try again.';
        try { msg = JSON.parse(text).error ?? msg; } catch { /* non-JSON body */ }
        setError(msg);
        setDeleting(false);
        return;
      }
      await signOut(auth);
      router.push('/');
    } catch (err) {
      console.error('[DeleteAccountModal]', err);
      setError('Network error. Try again.');
      setDeleting(false);
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(20,14,32,0.55)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 400, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ fontSize: 17, fontWeight: 800, color: '#1c1530', marginBottom: 8 }}>Delete your account</h3>
        <p style={{ fontSize: 13.5, color: '#6b6478', lineHeight: 1.5, marginBottom: 16 }}>
          This permanently removes your personal data and blocks future sign-in. It can&apos;t be undone.
          Type <strong>DELETE</strong> to confirm.
        </p>
        <input
          type="text"
          value={confirmText}
          onChange={e => setConfirmText(e.target.value)}
          placeholder="DELETE"
          style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #e2dde9', fontSize: 14, marginBottom: 12, fontFamily: 'inherit' }}
        />
        {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={onClose}
            style={{ flex: 1, padding: '11px 0', borderRadius: 999, border: '1px solid #e2dde9', background: '#fff', color: '#1c1530', fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!canConfirm}
            style={{ flex: 1, padding: '11px 0', borderRadius: 999, border: 'none', background: canConfirm ? '#dc2626' : '#f3a4a4', color: '#fff', fontWeight: 700, fontSize: 13.5, cursor: canConfirm ? 'pointer' : 'not-allowed' }}
          >
            {deleting ? 'Deleting…' : 'Delete account'}
          </button>
        </div>
      </div>
    </div>
  );
}
