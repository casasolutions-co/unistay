'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { aboutMeMissing, type Occupation } from '@/lib/aboutMe';

export type Stage = 'loading' | 'profile' | 'intro' | 'consent' | 'redirecting' | 'pending' | 'verified';

type ProfileUser = {
  verification_status?: string; role?: string; job_title?: string | null; university?: string | null;
  photo_url?: string | null; occupation?: string | null; traits?: string[]; about?: string | null;
};

// What the "about me" step starts from: saved values, else a guess from signup.
export type AboutMeDraft = { photoUrl: string | null; occupation: Occupation | null; traits: string[]; about: string };

type ProfileResponse = { user?: ProfileUser };

function stageForStatus(status: string | undefined): Stage | null {
  if (status === 'verified') return 'verified';
  if (status === 'pending') return 'pending';
  return null;
}

export function useVerifyFlow() {
  const [user, setUser] = useState<User | null>(null);
  const [stage, setStage] = useState<Stage>('loading');
  const [aboutDraft, setAboutDraft] = useState<AboutMeDraft>({ photoUrl: null, occupation: null, traits: [], about: '' });
  const [consent, setConsent] = useState(false);
  const [checkingPending, setCheckingPending] = useState(false);
  const [stillPendingNotice, setStillPendingNotice] = useState(false);
  const [redirectError, setRedirectError] = useState('');
  const [initialized, setInitialized] = useState(false);

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
          const draft: AboutMeDraft = {
            photoUrl: u.photo_url ?? null,
            occupation: (u.occupation as Occupation | null)
              ?? (u.role === 'landlord' ? 'landlord' : u.job_title ? 'professional' : u.university ? 'student' : null),
            traits: u.traits ?? [],
            about: u.about ?? '',
          };
          setAboutDraft(draft);
          const incomplete = aboutMeMissing({ ...draft, hasPhoto: !!draft.photoUrl }).length > 0;
          setStage(stageForStatus(u.verification_status) ?? (incomplete ? 'profile' : 'intro'));
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

  return {
    stage, setStage,
    aboutDraft, profileSaved: () => setStage('intro'), editProfile: () => setStage('profile'),
    user,
    consent, setConsent,
    checkingPending, stillPendingNotice, redirectError,
    canSubmit,
    submitId, refreshPending,
    goBack: () => setStage('intro'),
    goConsent: () => setStage('consent'),
  };
}
