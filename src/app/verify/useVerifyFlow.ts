'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { aboutMeMissing } from '@/lib/aboutMe';
import { nextPath } from '@/lib/nextPath';

export type Stage = 'loading' | 'profile' | 'intro' | 'consent' | 'redirecting' | 'pending' | 'verified';

type ProfileUser = {
  verification_status?: string; role?: string; photo_url?: string | null; occupation?: string | null; traits?: string[]; about?: string | null;
};

type ProfileResponse = { user?: ProfileUser };

function stageForStatus(status: string | undefined): Stage | null {
  if (status === 'verified') return 'verified';
  if (status === 'pending') return 'pending';
  return null;
}

export function useVerifyFlow() {
  const [user, setUser] = useState<User | null>(null);
  const [stage, setStage] = useState<Stage>('loading');
  const [aboutMissing, setAboutMissing] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [checkingPending, setCheckingPending] = useState(false);
  const [stillPendingNotice, setStillPendingNotice] = useState(false);
  const [redirectError, setRedirectError] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [role, setRole] = useState<string | undefined>();

  useEffect(() => onAuthStateChanged(auth, u => {
    setUser(u);
    if (!u) setStage(s => (s === 'loading' ? 'intro' : s));
  }), []);

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
          const u = d.user ?? {};
          // The profile itself is filled in on /profile; here we only check it's complete.
          const missing = aboutMeMissing({
            hasPhoto: !!u.photo_url, occupation: u.occupation ?? null, traits: u.traits ?? [], about: u.about ?? '',
          });
          setAboutMissing(missing);
          setRole(u.role);
          setStage(stageForStatus(u.verification_status) ?? (missing.length ? 'profile' : 'intro'));
        })
        // Server still refuses to start Didit with an incomplete profile.
        .catch(() => { if (!cancelled) setStage('intro'); })
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
        // Page the user came from (?next=); the server validates it before handing it to Didit.
        body: JSON.stringify({ token, next: new URLSearchParams(window.location.search).get('next') }),
      });
      const data = await res.json() as { url?: string; status?: string; error?: string; details?: string };
      // Didit already decided this user's earlier session (e.g. the webhook was missed).
      const decided = res.ok ? stageForStatus(data.status) : null;
      if (decided) { setStage(decided); return; }
      if (!res.ok || !data.url) {
        const reason = data.details ? `${data.error}: ${data.details}` : data.error;
        throw new Error(reason ?? 'Failed to start verification');
      }
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
      const status = data.user?.verification_status;
      if (status === 'verified') setStage('verified');
      else if (status === 'unverified') setStage('consent');
      else setStillPendingNotice(true);
    } catch {
      setStillPendingNotice(true);
    } finally {
      setCheckingPending(false);
    }
  }

  // Where the "You're verified" screen sends people: back to the page that sent
  // them here (e.g. a listing they wanted to book), else by role.
  const next = nextPath('');
  const done = next
    ? { href: next, label: 'Continue', text: "You're all set — pick up where you left off." }
    : role === 'landlord'
      ? { href: '/list', label: 'Continue to list your place', text: 'You can publish listings on UniStay whenever you’re ready.' }
      : { href: '/search', label: 'Find a place', text: 'You can now send booking requests to hosts.' };

  return {
    done,
    stage, setStage,
    aboutMissing,
    consent, setConsent,
    checkingPending, stillPendingNotice, redirectError,
    canSubmit,
    submitId, refreshPending,
    goBack: () => setStage('intro'),
    goConsent: () => setStage('consent'),
  };
}
