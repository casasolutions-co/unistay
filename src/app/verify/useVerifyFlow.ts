'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export type Stage = 'intro' | 'consent' | 'redirecting' | 'pending' | 'rejected' | 'verified';

type ProfileResponse = { user?: { verification_status?: string } };

function stageForStatus(status: string | undefined): Stage | null {
  if (status === 'verified') return 'verified';
  if (status === 'pending') return 'pending';
  if (status === 'rejected') return 'rejected';
  return null;
}

export function useVerifyFlow() {
  const [user, setUser] = useState<User | null>(null);
  const [stage, setStage] = useState<Stage>('intro');
  const [consent, setConsent] = useState(false);
  const [checkingPending, setCheckingPending] = useState(false);
  const [stillPendingNotice, setStillPendingNotice] = useState(false);
  const [redirectError, setRedirectError] = useState('');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  // On first load, jump straight to whatever stage matches the user's real status
  // (e.g. returning to this page after a Didit session, or re-visiting while pending).
  useEffect(() => {
    if (!user || initialized) return;
    let cancelled = false;
    user.getIdToken().then(token =>
      fetch('/api/user/profile', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then((d: ProfileResponse) => {
          if (cancelled) return;
          const s = stageForStatus(d.user?.verification_status);
          if (s) setStage(s);
        })
        .catch(() => {})
        .finally(() => { if (!cancelled) setInitialized(true); })
    );
    return () => { cancelled = true; };
  }, [user, initialized]);

  const canSubmit = consent && !!user;

  async function submitId() {
    if (!consent || !user) return;
    setRedirectError('');
    setStage('redirecting');
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/kyc/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Failed to start verification');
      window.location.href = data.url;
    } catch (err) {
      setRedirectError(err instanceof Error ? err.message : 'Something went wrong — please try again.');
      setStage('consent');
    }
  }

  async function refreshPending() {
    if (checkingPending || !user) return;
    setCheckingPending(true);
    setStillPendingNotice(false);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/user/profile', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json() as ProfileResponse;
      const s = stageForStatus(data.user?.verification_status);
      if (s === 'verified' || s === 'rejected') setStage(s);
      else setStillPendingNotice(true);
    } catch {
      setStillPendingNotice(true);
    } finally {
      setCheckingPending(false);
    }
  }

  return {
    stage, setStage,
    consent, setConsent,
    checkingPending, stillPendingNotice, redirectError,
    canSubmit,
    submitId, refreshPending,
    goBack: () => setStage('intro'),
    goConsent: () => setStage('consent'),
    resubmit: () => setStage('consent'),
  };
}
