'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider, deleteUser } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/unistay/firebase';
import { useAuth } from '@/lib/unistay/auth-context';
import { DOC_TYPES, DocKey, DocsMap, uploadDocument } from '@/lib/unistay/documents';
import Image from 'next/image';
import {
  Heart, MapPin, BedDouble, Ruler,
  LogOut, User, ChevronRight, Clock, CheckCircle2, XCircle,
  Bell, Shield, FileText, Upload, Trash2,
  Eye, EyeOff, Lock, Loader2, ExternalLink,
  Globe, GraduationCap, Calendar, Edit3, X, ArrowRight, PlusCircle,
  Mail, Phone,
} from 'lucide-react';
import { Button } from '@/components/unistay/ui/button';
import { Card } from '@/components/unistay/ui/card';
import { casaProperties } from '@/lib/unistay/properties';
import {
  FieldLabel, SoftInput, SoftTextarea, SoftSelect,
  PrimaryBtn, OutlineBtn,
} from '@/components/unistay/ui/form-elements';
import { seedCasaProperties } from '@/lib/unistay/seed-properties';
import { Breadcrumbs } from '@/components/unistay/ui/breadcrumbs';
import type { LandlordStatus } from '@/lib/unistay/types';

type Tab = 'profile' | 'saved' | 'documents' | 'notifications' | 'security';

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'profile',       label: 'Profile',       icon: <User     className="h-4 w-4" /> },
  { key: 'saved',         label: 'Saved',          icon: <Heart    className="h-4 w-4" /> },
  { key: 'documents',     label: 'Documents',      icon: <FileText className="h-4 w-4" /> },
  { key: 'notifications', label: 'Notifications',  icon: <Bell     className="h-4 w-4" /> },
  { key: 'security',      label: 'Security',       icon: <Shield   className="h-4 w-4" /> },
];

const NATIONALITIES = [
  'British', 'German', 'French', 'Spanish', 'Italian', 'Indian', 'Chinese',
  'American', 'Nigerian', 'Brazilian', 'Turkish', 'Pakistani', 'Other',
];

const DEFAULT_NOTIFS = {
  newListings:   true,
  enquiryUpdate: true,
  newsletter:    false,
  smsAlerts:     false,
  appPush:       true,
};

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('profile');

  // ── Profile ───────────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState({
    name: '', email: '', phone: '', nationality: '',
    university: '', program: '', moveInDate: '', bio: '',
  });
  const [draft, setDraft] = useState(profile);
  const [editing, setEditing] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [landlordStatus, setLandlordStatus] = useState<LandlordStatus | null>(null);

  // ── Saved properties ──────────────────────────────────────────────────────────
  const [savedIds, setSavedIds] = useState<string[]>([]);

  // ── Documents ─────────────────────────────────────────────────────────────────
  const [documents, setDocuments]    = useState<DocsMap>({});
  const [docProgress, setDocProgress] = useState<Partial<Record<DocKey, number>>>({});
  const [docError, setDocError]       = useState<Partial<Record<DocKey, string>>>({});
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const activeDocKey   = useRef<DocKey | null>(null);

  // ── Notifications ─────────────────────────────────────────────────────────────
  const [notifs, setNotifs] = useState(DEFAULT_NOTIFS);

  // ── Security ──────────────────────────────────────────────────────────────────
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState('');

  // ── Read initial tab from URL ?tab= param ─────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab') as Tab | null;
    if (tabParam && TABS.some((t) => t.key === tabParam)) {
      setTab(tabParam);
    }
  }, []);

  // ── Load user data from Firestore ─────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/unistay/register'); return; }

    const base = { name: user.displayName ?? '', email: user.email ?? '' };
    setProfile((p) => ({ ...p, ...base })); // eslint-disable-line react-hooks/set-state-in-effect
    setDraft((p) => ({ ...p, ...base }));   // eslint-disable-line react-hooks/set-state-in-effect

    getDoc(doc(db, 'users', user.uid)).then((snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      const profileData = {
        name:        (data.name        as string) ?? user.displayName ?? '',
        email:       (data.email       as string) ?? user.email ?? '',
        phone:       (data.phone       as string) ?? '',
        nationality: (data.nationality as string) ?? '',
        university:  (data.university  as string) ?? '',
        program:     (data.program     as string) ?? '',
        moveInDate:  (data.moveInDate  as string) ?? '',
        bio:         (data.bio         as string) ?? '',
      };
      setProfile(profileData);                                                                   // eslint-disable-line react-hooks/set-state-in-effect
      setDraft(profileData);                                                                     // eslint-disable-line react-hooks/set-state-in-effect
      if (data.savedProperties)  setSavedIds(data.savedProperties as string[]);                 // eslint-disable-line react-hooks/set-state-in-effect
      if (data.documents)        setDocuments(data.documents as DocsMap);                       // eslint-disable-line react-hooks/set-state-in-effect
      if (data.notifications)    setNotifs((n) => ({ ...n, ...(data.notifications as object) })); // eslint-disable-line react-hooks/set-state-in-effect
      if (data.landlordStatus)   setLandlordStatus(data.landlordStatus as LandlordStatus);      // eslint-disable-line react-hooks/set-state-in-effect
    });

  }, [user, authLoading, router]);

  const savedProperties = casaProperties.filter((p) => savedIds.includes(p.id));

  // ── Profile save ──────────────────────────────────────────────────────────────
  async function handleProfileSave(e: React.SyntheticEvent) {
    e.preventDefault();
    if (user) await setDoc(doc(db, 'users', user.uid), draft, { merge: true });
    setProfile(draft);
    setEditing(false);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  }

  // ── Unsave property ───────────────────────────────────────────────────────────
  async function unsave(id: string) {
    const updated = savedIds.filter((s) => s !== id);
    setSavedIds(updated);
    if (user) await updateDoc(doc(db, 'users', user.uid), { savedProperties: updated });
  }

  // ── Document upload ───────────────────────────────────────────────────────────
  function triggerUpload(key: DocKey) {
    activeDocKey.current = key;
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    const key = activeDocKey.current;
    if (!file || !key || !user) return;
    activeDocKey.current = null;
    setDocError((p) => ({ ...p, [key]: undefined }));
    setDocProgress((p) => ({ ...p, [key]: 0 }));
    try {
      const record = await uploadDocument(user.uid, key, file, (pct) =>
        setDocProgress((p) => ({ ...p, [key]: pct })),
      );
      setDocuments((p) => ({ ...p, [key]: record }));
    } catch {
      setDocError((p) => ({ ...p, [key]: 'Upload failed. Please try again.' }));
    } finally {
      setDocProgress((p) => { const n = { ...p }; delete n[key]; return n; });
    }
  }

  async function removeDoc(key: DocKey) {
    setDocuments((p) => { const n = { ...p }; delete n[key]; return n; });
    if (user) await updateDoc(doc(db, 'users', user.uid), { [`documents.${key}`]: null });
  }

  // ── Notifications ─────────────────────────────────────────────────────────────
  async function toggleNotif(key: keyof typeof DEFAULT_NOTIFS) {
    const updated = { ...notifs, [key]: !notifs[key] };
    setNotifs(updated);
    if (user) await updateDoc(doc(db, 'users', user.uid), { notifications: updated });
  }

  // ── Auth ──────────────────────────────────────────────────────────────────────
  async function handleSignOut() {
    await signOut(auth);
    router.replace('/unistay/register');
  }

  async function handlePwChange(e: React.SyntheticEvent) {
    e.preventDefault();
    setPwError('');
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) return;
    try {
      const cred = EmailAuthProvider.credential(currentUser.email, oldPw);
      await reauthenticateWithCredential(currentUser, cred);
      await updatePassword(currentUser, newPw);
      setPwSaved(true);
      setOldPw('');
      setNewPw('');
      setTimeout(() => setPwSaved(false), 2500);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      setPwError(code === 'auth/wrong-password' ? 'Current password is incorrect.' : 'Failed to update password. Try again.');
    }
  }

  async function handleDeleteAccount() {
    setDeleteError('');
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      await deleteUser(currentUser);
      router.replace('/unistay/register');
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      if (code === 'auth/requires-recent-login') {
        setDeleteError('Please sign out and sign back in, then try again.');
      } else {
        setDeleteError('Could not delete account. Please try again.');
      }
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const docsCount = DOC_TYPES.filter(({ key }) => !!documents[key]).length;
  const profileComplete = Math.round(
    ([profile.name, profile.email, profile.phone, profile.nationality,
      profile.university, profile.program, profile.moveInDate, profile.bio]
      .filter(Boolean).length / 8) * 100,
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Breadcrumbs crumbs={[{ label: 'Browse', href: '/unistay/browse' }, { label: 'Dashboard' }]} />

        <div className="mb-6 mt-2">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Your profile, saved properties and account settings</p>
        </div>

        {/* User identity banner */}
        {user && (
          <div className="flex items-center gap-4 mb-6 p-4 bg-white rounded-2xl border border-gray-100">
            <div className="w-14 h-14 rounded-full bg-blue-50 border-2 border-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl shrink-0 select-none">
              {(profile.name || user.displayName || user.email || '?')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-lg leading-tight truncate">
                {profile.name || user.displayName || 'Your Name'}
              </p>
              <p className="text-sm text-gray-400 truncate">{profile.email || user.email}</p>
              {(profile.university || profile.program) && (
                <p className="text-xs text-gray-400 mt-0.5 truncate">
                  {[profile.university, profile.program].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Stats strip */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {[
            { icon: <Heart className="h-5 w-5 text-red-500" />,     bg: 'bg-red-50',   value: savedProperties.length, label: 'Saved'     },
            { icon: <FileText className="h-5 w-5 text-green-600" />, bg: 'bg-green-50', value: docsCount,               label: 'Documents' },
          ].map(({ icon, bg, value, label }) => (
            <Card key={label} className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center shrink-0`}>{icon}</div>
              <div>
                <p className="text-xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left sidebar */}
          <div className="lg:w-52 shrink-0">
            <Card className="p-2 flex flex-col">
              <div className="flex-1">
                {TABS.map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5 ${
                      tab === key ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {icon}{label}
                  </button>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-gray-100">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            </Card>
          </div>

          {/* Right content */}
          <div className="flex-1 min-w-0">

            {/* ── PROFILE ── */}
            {tab === 'profile' && (
              <div className="space-y-5">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="font-semibold text-gray-900">Personal Information</h2>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-28 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-500"
                            style={{ width: `${profileComplete}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">{profileComplete}% complete</span>
                      </div>
                    </div>
                    {!editing ? (
                      <button
                        onClick={() => { setDraft(profile); setEditing(true); }}
                        className="flex items-center gap-1.5 text-sm font-medium text-blue-600 border border-blue-200 hover:border-blue-400 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Edit3 className="h-3.5 w-3.5" /> Edit
                      </button>
                    ) : (
                      <button
                        onClick={() => { setDraft(profile); setEditing(false); }}
                        className="flex items-center gap-1.5 text-sm font-medium text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors hover:bg-gray-50"
                      >
                        <X className="h-3.5 w-3.5" /> Cancel
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleProfileSave}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <FieldLabel>Full Name</FieldLabel>
                        <SoftInput icon={User} value={draft.name} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} placeholder="Jane Smith" disabled={!editing} />
                      </div>
                      <div>
                        <FieldLabel>Email</FieldLabel>
                        <SoftInput icon={Mail} type="email" value={draft.email} placeholder="you@example.com" disabled />
                      </div>
                      <div>
                        <FieldLabel>Phone</FieldLabel>
                        <SoftInput icon={Phone} type="tel" value={draft.phone} onChange={(e) => setDraft((p) => ({ ...p, phone: e.target.value }))} placeholder="+49 ..." disabled={!editing} />
                      </div>
                      <div>
                        <FieldLabel>Nationality</FieldLabel>
                        <SoftSelect icon={Globe} value={draft.nationality} onChange={(e) => setDraft((p) => ({ ...p, nationality: e.target.value }))} disabled={!editing}>
                          <option value="">Select...</option>
                          {NATIONALITIES.map((n) => <option key={n} value={n}>{n}</option>)}
                        </SoftSelect>
                      </div>
                      <div>
                        <FieldLabel>University</FieldLabel>
                        <SoftInput icon={GraduationCap} value={draft.university} onChange={(e) => setDraft((p) => ({ ...p, university: e.target.value }))} placeholder="Technical University of Berlin" disabled={!editing} />
                      </div>
                      <div>
                        <FieldLabel>Program / Course</FieldLabel>
                        <SoftInput value={draft.program} onChange={(e) => setDraft((p) => ({ ...p, program: e.target.value }))} placeholder="MSc Computer Science" disabled={!editing} />
                      </div>
                      <div className="sm:col-span-2">
                        <FieldLabel>Expected Move-in Date</FieldLabel>
                        <SoftInput icon={Calendar} type="date" value={draft.moveInDate} onChange={(e) => setDraft((p) => ({ ...p, moveInDate: e.target.value }))} disabled={!editing} />
                      </div>
                    </div>

                    <div className="mt-5">
                      <FieldLabel>
                        Bio <span className="normal-case font-normal text-gray-300">(optional)</span>
                      </FieldLabel>
                      <SoftTextarea rows={3} value={draft.bio} onChange={(e) => setDraft((p) => ({ ...p, bio: e.target.value }))} placeholder="Tell landlords about yourself..." disabled={!editing} />
                    </div>

                    {editing && (
                      <div className="flex items-center gap-3 mt-6 pt-5 border-t border-gray-100">
                        <PrimaryBtn type="submit">
                          Save Changes <ArrowRight className="h-4 w-4" />
                        </PrimaryBtn>
                        <OutlineBtn type="button" onClick={() => { setDraft(profile); setEditing(false); }}>
                          Cancel
                        </OutlineBtn>
                        {profileSaved && (
                          <span className="flex items-center gap-1 text-sm text-green-600">
                            <CheckCircle2 className="h-4 w-4" /> Saved
                          </span>
                        )}
                      </div>
                    )}
                  </form>
                </Card>

                {/* Landlord / List a property */}
                <Card className="p-6">
                  <h2 className="font-semibold text-gray-900 mb-4">List a Property</h2>
                  {landlordStatus === 'approved' ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs text-green-600 font-medium bg-green-50 px-3 py-2 rounded-xl">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Verified landlord
                      </div>
                      <Link
                        href="/unistay/list-property"
                        className="flex items-center justify-between gap-2 w-full px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
                      >
                        <span>List a property</span>
                        <PlusCircle className="h-4 w-4" />
                      </Link>
                    </div>
                  ) : landlordStatus === 'pending' ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-amber-600 font-medium bg-amber-50 px-3 py-2 rounded-xl">
                        <Clock className="h-3.5 w-3.5 shrink-0" /> Application under review
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Our team is verifying your application. You'll hear back within 1–2 business days.
                      </p>
                    </div>
                  ) : landlordStatus === 'rejected' ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs text-red-600 font-medium bg-red-50 px-3 py-2 rounded-xl">
                        <XCircle className="h-3.5 w-3.5 shrink-0" /> Application not approved
                      </div>
                      <Link
                        href="/unistay/landlord/apply"
                        className="flex items-center justify-between gap-2 w-full px-4 py-3 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:border-blue-400 hover:text-blue-600 transition-colors"
                      >
                        <span>Re-apply</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-500 leading-relaxed">
                        Become a verified landlord to list your property and reach vetted international students.
                      </p>
                      <Link
                        href="/unistay/landlord"
                        className="flex items-center justify-between gap-2 w-full px-4 py-3 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:border-blue-400 hover:text-blue-600 transition-colors"
                      >
                        <span>Become a landlord</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* ── SAVED ── */}
            {tab === 'saved' && (
              <div className="space-y-4">
                <h2 className="font-semibold text-gray-900">Saved Properties</h2>
                {savedProperties.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Heart className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-1 font-medium">No saved properties yet</p>
                    <p className="text-gray-400 text-sm mb-4">Tap the heart on any listing to save it here.</p>
                    <Link href="/unistay/search">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">Browse properties</Button>
                    </Link>
                  </Card>
                ) : (
                  savedProperties.map((p) => (
                    <Card key={p.id} className="flex gap-4 p-4 items-center">
                      <div className="relative w-24 h-20 rounded-lg overflow-hidden shrink-0">
                        <Image src={p.images[0]} alt={p.title} fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{p.title}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />{p.address}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" />{p.bedrooms} bed</span>
                          <span className="flex items-center gap-1"><Ruler className="h-3.5 w-3.5" />{p.size}m²</span>
                          <span className="font-semibold text-blue-600">€{p.price}/mo</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <Link href={`/unistay/properties/${p.id}`}>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3">
                            View <ChevronRight className="h-3.5 w-3.5 ml-1" />
                          </Button>
                        </Link>
                        <button
                          onClick={() => unsave(p.id)}
                          className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 justify-center"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remove
                        </button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* ── DOCUMENTS ── */}
            {tab === 'documents' && (
              <div className="space-y-4">
                <div>
                  <h2 className="font-semibold text-gray-900">Documents</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Upload your verification documents. PDF, JPG or PNG · Max 10 MB.</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {DOC_TYPES.map(({ key, label, hint }) => {
                  const record    = documents[key];
                  const progress  = docProgress[key];
                  const error     = docError[key];
                  const uploading = progress !== undefined;
                  return (
                    <Card key={key} className="p-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${record ? 'bg-green-50' : 'bg-gray-100'}`}>
                          {uploading
                            ? <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                            : <FileText className={`h-5 w-5 ${record ? 'text-green-600' : 'text-gray-400'}`} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{label}</p>
                          {error ? (
                            <p className="text-xs text-red-500 mt-0.5">{error}</p>
                          ) : uploading ? (
                            <div className="mt-1.5">
                              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                              </div>
                              <p className="text-xs text-gray-400 mt-0.5">{progress}%</p>
                            </div>
                          ) : record ? (
                            <p className="text-xs text-green-600 mt-0.5 truncate">{record.name}</p>
                          ) : (
                            <p className="text-xs text-gray-400 mt-0.5">{hint}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {record && (
                            <>
                              <a href={record.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                <ExternalLink className="h-3.5 w-3.5" /> View
                              </a>
                              <button onClick={() => removeDoc(key)} className="text-gray-300 hover:text-red-400 transition-colors">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => triggerUpload(key)}
                            disabled={uploading}
                            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-40 ${
                              record
                                ? 'border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600'
                                : 'border-blue-600 text-blue-600 hover:bg-blue-50'
                            }`}
                          >
                            <Upload className="h-3.5 w-3.5" />
                            {record ? 'Replace' : 'Upload'}
                          </button>
                          {record && !uploading && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* ── NOTIFICATIONS ── */}
            {tab === 'notifications' && (
              <Card className="p-6">
                <h2 className="font-semibold text-gray-900 mb-5">Notification Preferences</h2>
                <div className="space-y-1">
                  {([
                    { key: 'newListings',   label: 'New listings matching my search', desc: 'Get notified when a new property matches your filters', category: 'Email' },
                    { key: 'enquiryUpdate', label: 'Enquiry updates',                 desc: 'When Casa replies to your enquiry',                    category: 'Email' },
                    { key: 'newsletter',    label: 'Newsletter & tips',               desc: 'Monthly tips for international students',              category: 'Email' },
                    { key: 'smsAlerts',     label: 'SMS alerts',                      desc: 'Text messages for urgent updates only',                category: 'SMS'   },
                    { key: 'appPush',       label: 'Browser notifications',           desc: 'Push notifications in your browser',                  category: 'Push'  },
                  ] as const).map(({ key, label, desc, category }) => (
                    <div key={key} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-800">{label}</p>
                          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{category}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                      </div>
                      <button
                        onClick={() => toggleNotif(key)}
                        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${notifs[key] ? 'bg-blue-600' : 'bg-gray-200'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifs[key] ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-300 mt-4">Preferences are saved automatically.</p>
              </Card>
            )}

            {/* ── SECURITY ── */}
            {tab === 'security' && (
              <div className="space-y-4">
                <Card className="p-6">
                  <h2 className="font-semibold text-gray-900 mb-4">Change Password</h2>
                  <form onSubmit={handlePwChange} className="space-y-4 max-w-sm">
                    <div>
                      <FieldLabel>Current Password</FieldLabel>
                      <div className="relative">
                        <SoftInput icon={Lock} type={showOld ? 'text' : 'password'} value={oldPw} onChange={(e) => setOldPw(e.target.value)} required />
                        <button type="button" onClick={() => setShowOld((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600">
                          {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <FieldLabel>New Password</FieldLabel>
                      <div className="relative">
                        <SoftInput icon={Lock} type={showNew ? 'text' : 'password'} value={newPw} onChange={(e) => setNewPw(e.target.value)} required placeholder="Min. 8 characters" />
                        <button type="button" onClick={() => setShowNew((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600">
                          {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    {pwError && <p className="text-sm text-red-600">{pwError}</p>}
                    <div className="flex items-center gap-3 pt-1">
                      <PrimaryBtn type="submit" className="py-3">Update Password</PrimaryBtn>
                      {pwSaved && <span className="text-sm text-green-600 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Updated!</span>}
                    </div>
                  </form>
                </Card>

                <Card className="p-6">
                  <h2 className="font-semibold text-gray-900 mb-1">Database</h2>
                  <p className="text-sm text-gray-500 mb-4">Upload all Casa properties to Firestore. Safe to run multiple times — skips already-seeded properties.</p>
                  <div className="flex items-center gap-3">
                    <PrimaryBtn
                      type="button"
                      disabled={seeding}
                      className="py-3"
                      onClick={async () => {
                        setSeeding(true);
                        setSeedResult('');
                        try {
                          const { seeded, skipped } = await seedCasaProperties();
                          setSeedResult(`Done — ${seeded} uploaded, ${skipped} already existed.`);
                        } catch {
                          setSeedResult('Seed failed. Check Firestore rules and console.');
                        } finally {
                          setSeeding(false);
                        }
                      }}
                    >
                      {seeding ? 'Seeding…' : 'Seed Casa Properties to Firestore'}
                    </PrimaryBtn>
                    {seedResult && <span className="text-sm text-green-600 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> {seedResult}</span>}
                  </div>
                </Card>

                <Card className="p-6 border-red-200">
                  <h2 className="font-semibold text-red-600 mb-1">Danger Zone</h2>
                  <p className="text-sm text-gray-500 mb-4">Once you delete your account, all your data will be permanently removed.</p>
                  {!showDeleteConfirm ? (
                    <button onClick={() => setShowDeleteConfirm(true)} className="text-sm text-red-600 border border-red-300 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors">
                      Delete my account
                    </button>
                  ) : (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-700 font-medium mb-3">Are you sure? This cannot be undone.</p>
                      {deleteError && <p className="text-sm text-red-600 mb-2">{deleteError}</p>}
                      <div className="flex gap-2">
                        <button onClick={handleDeleteAccount} className="text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">Yes, delete my account</button>
                        <button onClick={() => setShowDeleteConfirm(false)} className="text-sm text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50">Cancel</button>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
