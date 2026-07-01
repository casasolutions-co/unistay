'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { previewUrlFor } from '@/lib/heicPreview';
import styles from './ListMobile.module.css';

type Photo = { r2Key: string; previewUrl: string; uploading?: boolean; error?: string };
type PType = 'studio' | 'apartment' | 'room' | 'house';

const PTYPE_DEFS: { id: PType; label: string }[] = [
  { id: 'studio', label: 'Studio' },
  { id: 'apartment', label: 'Apartment' },
  { id: 'room', label: 'Room in WG' },
  { id: 'house', label: 'House' },
];

const AMEN_DEFS: [string, string, string[]][] = [
  ['wifi', 'Wi-Fi', ['M5 13a10 10 0 0 1 14 0', 'M8.5 16.5a5 5 0 0 1 7 0', 'M12 20h.01']],
  ['furnished', 'Furnished', ['M4 18v-5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5', 'M6 11V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3M4 18v2M20 18v2']],
  ['kitchen', 'Kitchen', ['M6 3v7M9 3v7a3 3 0 0 1-6 0V3M6 13v8', 'M17 3c-1.5 0-2 2-2 5s.5 4 2 4 2-1 2-4-.5-5-2-5ZM17 16v5']],
  ['washer', 'Washer', ['M4 3h16v18H4z', 'M8 7h.01', 'M12 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z']],
  ['heating', 'Heating', ['M8 3v6M12 3v6M16 3v6', 'M5 12h14v3a7 7 0 0 1-14 0v-3Z']],
  ['balcony', 'Balcony', ['M3 21h18M5 21v-7h14v7', 'M8 14v7M12 14v7M16 14v7M5 14V8a7 7 0 0 1 14 0v6']],
  ['parking', 'Parking', ['M5 3h14v18H5z', 'M9 16V8h3a3 3 0 0 1 0 6H9']],
  ['elevator', 'Elevator', ['M5 3h14v18H5z', 'M10 8l2-2 2 2M10 16l2 2 2-2']],
  ['dishwasher', 'Dishwasher', ['M4 3h16v18H4z', 'M4 8h16', 'M8 5.5h.01M11 5.5h.01']],
  ['tv', 'TV', ['M3 5h18v12H3z', 'M8 21h8M12 17v4']],
  ['desk', 'Study desk', ['M3 10h18', 'M5 10v10M19 10v10', 'M4 6h16v4H4z']],
  ['bikes', 'Bike storage', ['M5.5 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM18.5 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z', 'M5.5 15l4-7h5l3 7M9 8h3']],
  ['garden', 'Garden', ['M12 22V11', 'M12 11c0-3 2-5 5-5 0 3-2 5-5 5ZM12 14c0-3-2-5-5-5 0 3 2 5 5 5Z']],
  ['accessible', 'Accessible', ['M12 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z', 'M9 8h5l1 5h3M9 8v5a4 4 0 1 0 4 4']],
  ['petsok', 'Pets OK', ['M5 11a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM10 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM14 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM19 11a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z', 'M12 12c-2.5 0-4 2-4 4a3 3 0 0 0 8 0c0-2-1.5-4-4-4Z']],
  ['security', 'Secure entry', ['M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6l8-3Z', 'M9 12l2 2 4-4']],
];

function Icon({ paths, size = 24, stroke = 'currentColor', sw = 1.9 }: { paths: string[]; size?: number; stroke?: string; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {paths.map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}

const CITY_POPULAR = ['Berlin', 'München', 'Hamburg', 'Frankfurt am Main', 'Köln', 'Stuttgart', 'Düsseldorf', 'Nürnberg'];

function normaliseCityName(s: string): string {
  return s
    .replace(/\bi\.d\.\s*/g, 'in der ').replace(/\ba\.d\.\s*/g, 'an der ')
    .replace(/\bi\.\s*/g, 'im ').replace(/\bv\.\s*/g, 'vor ').replace(/\bb\.\s*/g, 'bei ')
    .replace(/\bNbg\./g, 'Nürnberg').replace(/\bOPf\./g, 'Oberpfalz')
    .replace(/\bThür\./g, 'Thüringen').replace(/\bSachs\./g, 'Sachsen')
    .replace(/\bObb\./g, 'Oberbayern').replace(/\bWestf\./g, 'Westfalen')
    .replace(/[-()]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
}

type CityEntry = { name: string; search: string };
let cityCache: CityEntry[] | null = null;
let cityFetch: Promise<void> | null = null;

function CityPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [cities, setCities] = useState<CityEntry[]>(cityCache ?? []);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cityCache) { setCities(cityCache); return; }
    if (!cityFetch) {
      cityFetch = fetch('/api/cities')
        .then(r => r.json())
        .then((d: { name: string }[]) => {
          cityCache = d.map(c => ({ name: c.name, search: normaliseCityName(c.name) }));
        })
        .catch(() => { cityFetch = null; });
    }
    cityFetch.then(() => { if (cityCache) setCities(cityCache); });
  }, []);

  useEffect(() => { if (!value) setQuery(''); }, [value]);

  const q = normaliseCityName(query.trim());
  const suggestions = q.length > 0
    ? cities.filter(c => c.search.startsWith(q)).slice(0, 6)
    : CITY_POPULAR.map(name => ({ name, search: name.toLowerCase() }));

  function select(name: string) { setQuery(name); onChange(name); setOpen(false); }

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  return (
    <div ref={wrapRef} style={{ position: 'relative', flex: 1 }}>
      <input
        type="text" placeholder="City" value={query} autoComplete="off"
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        className={styles.field}
        style={{ padding: '0 14px', width: '100%', boxSizing: 'border-box' }}
      />
      {open && suggestions.length > 0 && (
        <div className={styles.cityDrop}>
          {!q && <div className={styles.cityDropLabel}>Popular cities</div>}
          {suggestions.map(c => (
            <button key={c.name} type="button"
              onMouseDown={e => { e.preventDefault(); select(c.name); }}
              className={styles.cityDropItem}
              style={{ background: query === c.name ? '#f3effe' : 'none', color: query === c.name ? '#6d28d9' : '#1c1530' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={query === c.name ? '#6d28d9' : '#9a94a8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
              </svg>
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function hintFor(s: string, lo: number) {
  if (!s.length) return `Minimum ${lo} characters`;
  if (s.length < lo) return `${lo - s.length} more characters needed`;
  return 'Looks good';
}

function fmtDate(iso: string) {
  const d = new Date(iso + 'T00:00');
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const OK = '#1f9d6b', WARN = '#c2557a', NEUTRAL = '#b3adbf';

const STEP_NAMES = ['The basics', 'Space & details', 'Pricing', 'Photos'];
const BANNER_TITLES = ['List your place in minutes.', 'Show off the space.', 'Set your price.', 'Add your best photos.'];

function ptypeIcon(id: PType) {
  const p: Record<PType, string[]> = {
    studio: ['M3 9.5 12 3l9 6.5', 'M5 8.5V21h14V8.5', 'M9 21v-6h6v6'],
    apartment: ['M4 21V4h16v17', 'M9 8h2M13 8h2M9 12h2M13 12h2M9 16h2M13 16h2'],
    room: ['M3 21h18M5 21V8l7-4 7 4v13', 'M10 21v-5h4v5'],
    house: ['M3 21h18M6 21V8h12v13', 'M9 12h.01M15 12h.01'],
  };
  return <Icon paths={p[id]} size={20} />;
}

export default function ListMobile() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [step, setStep] = useState(1);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState('');

  const listingIdRef = useRef(crypto.randomUUID());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { return onAuthStateChanged(auth, setUser); }, []);

  // Form state
  const [ptype, setPtype] = useState<PType>('studio');
  const [title, setTitle] = useState('');
  const [streetName, setStreetName] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [roomSize, setRoomSize] = useState(15);
  const [aptSize, setAptSize] = useState(50);
  const [suitableFor, setSuitableFor] = useState(1);
  const [amenities, setAmenities] = useState<Record<string, boolean>>({});
  const [desc, setDesc] = useState('');
  const [mates, setMates] = useState('');
  const [numMates, setNumMates] = useState(0);
  const [mateGender, setMateGender] = useState('');
  const [prefGender, setPrefGender] = useState('any');
  const [rent, setRent] = useState('');
  const [utilities, setUtilities] = useState('');
  const [deposit, setDeposit] = useState('');
  const [availFrom, setAvailFrom] = useState('');
  const [availTo, setAvailTo] = useState('');
  const [openEnded, setOpenEnded] = useState(false);
  const [minPeriod, setMinPeriod] = useState('');
  const [maxPeriod, setMaxPeriod] = useState('');
  const [photos, setPhotos] = useState<Photo[]>([]);

  // Derived
  const titleOk = title.length >= 12 && title.length <= 60;
  const descOk = desc.length >= 60 && desc.length <= 600;
  const amenCount = AMEN_DEFS.filter(([k]) => amenities[k]).length;
  const uploadedPhotos = photos.filter(p => !p.uploading && !p.error);
  const photosOk = uploadedPhotos.length >= 3;
  const warm = (parseInt(rent) || 0) + (parseInt(utilities) || 0);
  const depositNum = parseInt(deposit) || 0;
  const depositHint = depositNum && warm
    ? `≈ ${(depositNum / warm).toFixed(1).replace('.0', '')} months of warm rent`
    : "Most students expect 1–3 months' rent";
  const todayISO = new Date().toISOString().slice(0, 10);
  const datesOk = !(availFrom && availTo && !openEnded && availTo < availFrom);
  const availOk = !!availFrom && (openEnded || !!availTo) && datesOk;
  const fromText = availFrom ? (availFrom <= todayISO ? 'immediately' : fmtDate(availFrom)) : null;
  const toText = openEnded ? null : (availTo ? fmtDate(availTo) : null);

  let rentalMsg = 'Pick a move-in date, then an end date or open-ended';
  let rentalColor = NEUTRAL;
  if (!datesOk) { rentalMsg = 'End date must be after the start date'; rentalColor = WARN; }
  else if (openEnded) rentalMsg = 'Open-ended (unlimited) rental';
  else if (fromText && toText) rentalMsg = 'Fixed-term rental';

  const reqs = [
    !!title.trim() && titleOk,
    !!(streetName.trim() && city.trim() && postcode.trim()),
    amenCount >= 1,
    descOk,
    !!rent.trim() && availOk,
    photosOk,
  ];
  const pct = Math.round(reqs.filter(Boolean).length / reqs.length * 100);
  const canPublish = reqs.every(Boolean);

  const checklist = [
    { done: !!title.trim() && titleOk, label: 'Title (12–60 characters)' },
    { done: !!(streetName.trim() && city.trim() && postcode.trim()), label: 'Full address' },
    { done: amenCount >= 1, label: 'At least 1 amenity selected' },
    { done: descOk, label: 'Description (60+ characters)' },
    { done: !!rent.trim() && availOk, label: 'Rent & availability' },
    { done: photosOk, label: 'At least 3 photos' },
  ];

  const mateGenderOpts = [
    { id: 'female', label: 'All female' }, { id: 'male', label: 'All male' },
    { id: 'mixed', label: 'Mixed' }, { id: 'diverse', label: 'Diverse' },
  ];
  const prefGenderOpts = [
    { id: 'any', label: 'No preference' }, { id: 'female', label: 'Female' },
    { id: 'male', label: 'Male' }, { id: 'diverse', label: 'Diverse-friendly' },
  ];

  function seg(on: boolean) {
    return { border: on ? '#6d28d9' : '#e6e2ef', bg: on ? '#f3effe' : '#faf9fc', color: on ? '#6d28d9' : '#5a5568' };
  }

  async function uploadFiles(files: FileList) {
    const fileArray = Array.from(files);
    const startIdx = photos.length;
    const previewUrls = await Promise.all(fileArray.map(previewUrlFor));
    setPhotos(prev => [...prev, ...previewUrls.map(previewUrl => ({ r2Key: '', previewUrl, uploading: true }))]);
    if (!user) {
      setPhotos(prev => prev.map((p, j) => j >= startIdx ? { ...p, uploading: false, error: 'Sign in to upload photos' } : p));
      return;
    }
    let token: string;
    try { token = await user.getIdToken(); } catch {
      setPhotos(prev => prev.map((p, j) => j >= startIdx ? { ...p, uploading: false, error: 'Auth error' } : p));
      return;
    }
    await Promise.all(fileArray.map(async (file, i) => {
      const idx = startIdx + i;
      const fd = new FormData();
      fd.append('file', file);
      fd.append('listingId', listingIdRef.current);
      try {
        const res = await fetch('/api/listings/photos', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
        const data = await res.json() as { r2Key?: string; error?: string };
        if (!res.ok) throw new Error(data.error ?? 'Upload failed');
        setPhotos(prev => prev.map((p, j) => j === idx ? { ...p, r2Key: data.r2Key!, uploading: false } : p));
      } catch (err) {
        setPhotos(prev => prev.map((p, j) => j === idx ? { ...p, uploading: false, error: err instanceof Error ? err.message : 'Upload failed' } : p));
      }
    }));
  }

  function removePhoto(idx: number) {
    setPhotos(prev => { URL.revokeObjectURL(prev[idx].previewUrl); return prev.filter((_, i) => i !== idx); });
  }

  async function handlePublish() {
    if (!canPublish || publishing) return;
    if (!user) { setPublishError('You must be signed in to publish.'); return; }
    setPublishing(true);
    setPublishError('');
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          listingId: listingIdRef.current,
          ptype, title, streetName, houseNumber, city, postcode,
          bedrooms, bathrooms, roomSize, aptSize,
          amenities, desc, mates, numMates, mateGender, prefGender,
          rent, utilities, deposit, availFrom, availTo, openEnded, minPeriod, maxPeriod,
          photos: uploadedPhotos.map((p, i) => ({ r2Key: p.r2Key, position: i, isCover: i === 0 })),
        }),
      });
      const data = await res.json() as { listing_id?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Unknown error');
      router.push(`/search/${data.listing_id}`);
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Failed to publish. Please try again.');
      setPublishing(false);
    }
  }

  function goNext() {
    if (step < 4) { setStep(s => s + 1); scrollRef.current?.scrollTo({ top: 0 }); }
    else handlePublish();
  }
  function goBack() { if (step > 1) { setStep(s => s - 1); scrollRef.current?.scrollTo({ top: 0 }); } }

  const barColors = [1, 2, 3, 4].map(n => step >= n ? '#6d28d9' : '#ece8f6');

  return (
    <div className={styles.screen}>
      {/* ── Dark banner ── */}
      <div className={styles.banner}>
        {/* App bar */}
        <div className={styles.appBar}>
          <button type="button" onClick={goBack} className={styles.backBtn} style={{ opacity: step > 1 ? 1 : 0.4 }}>
            <Icon paths={['M19 12H5M11 6l-6 6 6 6']} size={19} stroke="#fff" sw={2.4} />
          </button>
          <span className={styles.draftLabel}>Draft saved automatically</span>
          <span className={styles.stepPill}>{step}/4</span>
        </div>

        {/* Headline */}
        <div className={styles.bannerContent}>
          <div className={styles.brandRow}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 11.2 12 4l9 7.2" /><path d="M5.5 9.8V20h13V9.8" /><path d="M10 20v-5h4v5" />
            </svg>
            <span className={styles.brandName}>UniStay</span>
          </div>
          <h1 className={styles.bannerTitle}>{BANNER_TITLES[step - 1]}</h1>
        </div>
      </div>

      {/* ── Bottom sheet ── */}
      <div className={styles.sheet}>
        {/* Progress bars + step info */}
        <div className={styles.sheetHead}>
          <div className={styles.progressBars}>
            {barColors.map((c, i) => (
              <div key={i} className={styles.progressBar} style={{ background: c }} />
            ))}
          </div>
          <div className={styles.stepInfo}>
            <span className={styles.stepName}>
              <span className={styles.stepNumBadge}>{step}</span>
              {STEP_NAMES[step - 1]}
            </span>
            <span className={styles.stepPct}>{pct}% complete</span>
          </div>
        </div>

        {/* Scrollable content */}
        <div className={styles.scrollContent} ref={scrollRef}>

          {/* ── STEP 1: BASICS ── */}
          {step === 1 && (
            <div>
              <p className={styles.stepDesc}>Tell us what kind of place you&apos;re listing and where it is.</p>

              <label className={styles.lab}>Property type <span className={styles.req}>*</span></label>
              <div className={styles.ptypeGrid}>
                {PTYPE_DEFS.map(t => {
                  const on = ptype === t.id;
                  const s = seg(on);
                  return (
                    <button key={t.id} type="button" onClick={() => setPtype(t.id)} className={styles.ptypeBtn}
                      style={{ borderColor: s.border, background: s.bg, color: s.color }}>
                      <span style={{ color: s.color, display: 'grid', placeItems: 'center' }}>{ptypeIcon(t.id)}</span>
                      <span className={styles.ptypeBtnLabel}>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              <label className={styles.lab}>Listing title <span className={styles.req}>*</span></label>
              <input type="text" placeholder="e.g. Sunny studio near TU Berlin"
                value={title} onChange={e => setTitle(e.target.value.slice(0, 60))}
                className={styles.field} style={{ padding: '0 14px' }} />
              <div className={styles.fieldMeta}>
                <span style={{ color: titleOk ? OK : title.length ? WARN : NEUTRAL }}>{hintFor(title, 12)}</span>
                <span style={{ color: NEUTRAL }}>{title.length}/60</span>
              </div>

              <label className={styles.lab} style={{ marginTop: 16 }}>Address <span className={styles.req}>*</span></label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <span className={styles.fieldIcon}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
                    </svg>
                  </span>
                  <input type="text" placeholder="Street name" value={streetName} onChange={e => setStreetName(e.target.value)}
                    className={styles.field} style={{ padding: '0 14px 0 38px' }} />
                </div>
                <input type="text" placeholder="No." value={houseNumber} onChange={e => setHouseNumber(e.target.value)}
                  className={styles.field} style={{ padding: '0 12px', width: 72, flex: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <CityPicker value={city} onChange={setCity} />
                <input type="text" placeholder="Postcode" value={postcode} onChange={e => setPostcode(e.target.value)}
                  className={styles.field} style={{ padding: '0 13px', flex: 0.6 }} />
              </div>
            </div>
          )}

          {/* ── STEP 2: SPACE & DETAILS ── */}
          {step === 2 && (
            <div>
              <p className={styles.stepDesc}>Help students picture living there.</p>

              <div className={styles.countersGrid}>
                {[
                  { label: 'Bedrooms', val: bedrooms, unit: '', dec: () => setBedrooms(v => Math.max(0, v - 1)), inc: () => setBedrooms(v => v + 1) },
                  { label: 'Bathrooms', val: bathrooms, unit: '', dec: () => setBathrooms(v => Math.max(1, v - 1)), inc: () => setBathrooms(v => v + 1) },
                  { label: 'Room size', val: roomSize, unit: ' m²', dec: () => setRoomSize(v => Math.max(5, v - 1)), inc: () => setRoomSize(v => v + 1) },
                  { label: 'Apt. size', val: aptSize, unit: ' m²', dec: () => setAptSize(v => Math.max(10, v - 1)), inc: () => setAptSize(v => v + 1) },
                  { label: 'Suitable for', val: suitableFor, unit: ' ppl', dec: () => setSuitableFor(v => Math.max(1, v - 1)), inc: () => setSuitableFor(v => v + 1) },
                ].map(({ label, val, unit, dec, inc }) => (
                  <div key={label}>
                    <label className={styles.lab}>{label}</label>
                    <div className={styles.counterBox}>
                      <button type="button" onClick={dec} className={styles.counterBtn}>−</button>
                      <span className={styles.counterVal}>{val}{unit}</span>
                      <button type="button" onClick={inc} className={styles.counterBtn}>+</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.amenHeader}>
                <label className={styles.lab} style={{ margin: 0 }}>Amenities <span className={styles.req}>*</span></label>
                <span className={styles.amenCount}>{amenCount} selected</span>
              </div>
              <div className={styles.amenPills}>
                {AMEN_DEFS.map(([k, label, paths]) => {
                  const on = !!amenities[k];
                  const s = seg(on);
                  return (
                    <button key={k} type="button" onClick={() => setAmenities(p => ({ ...p, [k]: !p[k] }))}
                      className={styles.amenBtn}
                      style={{ borderColor: s.border, background: s.bg, color: s.color }}>
                      <span style={{ color: on ? '#6d28d9' : '#9a94a8', display: 'grid', placeItems: 'center' }}>
                        <Icon paths={paths} size={14} />
                      </span>
                      {label}
                    </button>
                  );
                })}
              </div>

              <label className={styles.lab} style={{ marginTop: 20 }}>Description <span className={styles.req}>*</span></label>
              <textarea placeholder="Describe the space, light, neighbourhood, transit links, and who it's perfect for…"
                value={desc} onChange={e => setDesc(e.target.value.slice(0, 600))}
                className={`${styles.field} ${styles.textarea}`} rows={5} />
              <div className={styles.fieldMeta}>
                <span style={{ color: descOk ? OK : desc.length ? WARN : NEUTRAL }}>{hintFor(desc, 60)}</span>
                <span style={{ color: NEUTRAL }}>{desc.length}/600</span>
              </div>

              {/* Housemates */}
              <div className={styles.houseBox}>
                <div className={styles.houseBoxHead}>
                  <label className={styles.lab} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 7 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="9" cy="8" r="3.5" /><path d="M2 20a7 7 0 0 1 14 0" />
                      <path d="M17 7.5a3.5 3.5 0 0 1 0 6.8M22 20a6 6 0 0 0-4-5.6" />
                    </svg>
                    About the housemates
                  </label>
                  <span className={styles.optionalTag}>Optional</span>
                </div>

                <span className={styles.houseSubLabel}>No. of housemates</span>
                <div className={styles.matesCounter}>
                  <button type="button" onClick={() => setNumMates(v => Math.max(0, v - 1))} className={styles.counterBtn}>−</button>
                  <span className={styles.counterVal}>{numMates}</span>
                  <button type="button" onClick={() => setNumMates(v => v + 1)} className={styles.counterBtn}>+</button>
                </div>

                <span className={styles.houseSubLabel}>Current housemates</span>
                <div className={styles.segRow}>
                  {mateGenderOpts.map(g => {
                    const s = seg(mateGender === g.id);
                    return (
                      <button key={g.id} type="button" onClick={() => setMateGender(g.id)}
                        className={styles.segBtn}
                        style={{ borderColor: s.border, background: s.bg, color: s.color }}>
                        {g.label}
                      </button>
                    );
                  })}
                </div>

                <span className={styles.houseSubLabel} style={{ marginTop: 12 }}>Preferred new housemate</span>
                <div className={styles.segRow} style={{ marginBottom: 14 }}>
                  {prefGenderOpts.map(g => {
                    const s = seg(prefGender === g.id);
                    return (
                      <button key={g.id} type="button" onClick={() => setPrefGender(g.id)}
                        className={styles.segPill}
                        style={{ borderColor: s.border, background: s.bg, color: s.color }}>
                        {g.label}
                      </button>
                    );
                  })}
                </div>

                <textarea placeholder="Anything else about the household? e.g. quiet weekdays, no smoking…"
                  value={mates} onChange={e => setMates(e.target.value.slice(0, 240))}
                  className={`${styles.field} ${styles.textarea}`} rows={3} style={{ background: '#fff' }} />
                <div className={styles.fieldMeta}>
                  <span style={{ color: NEUTRAL }}>{mates.length ? 'Optional · adds a nice personal touch' : 'Optional'}</span>
                  <span style={{ color: NEUTRAL }}>{mates.length}/240</span>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: PRICING ── */}
          {step === 3 && (
            <div>
              <p className={styles.stepDesc}>Set your rent, deposit and availability.</p>

              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                {[
                  { label: <>Cold rent <span className={styles.req}>*</span></>, ph: '650', val: rent, set: setRent },
                  { label: 'Utilities', ph: '120', val: utilities, set: setUtilities },
                ].map(({ label, ph, val, set }, i) => (
                  <div key={i} style={{ flex: 1 }}>
                    <label className={styles.lab}>{label}</label>
                    <div style={{ position: 'relative' }}>
                      <span className={styles.euroSign}>€</span>
                      <input type="text" placeholder={ph} value={val} onChange={e => set(e.target.value)}
                        className={styles.field} style={{ padding: '0 14px 0 30px' }} />
                    </div>
                  </div>
                ))}
              </div>

              <label className={styles.lab}>Deposit</label>
              <div style={{ position: 'relative', marginBottom: 6 }}>
                <span className={styles.euroSign}>€</span>
                <input type="text" placeholder="1300" value={deposit} onChange={e => setDeposit(e.target.value)}
                  className={styles.field} style={{ padding: '0 14px 0 30px' }} />
              </div>
              <p className={styles.depositHint}>{depositHint}</p>

              <div className={styles.warmRentBar}>
                <span className={styles.warmRentLabel}>Warm rent students pay</span>
                <span className={styles.warmRentValue}>€{warm || '—'}<span className={styles.warmRentMo}>/mo</span></span>
              </div>

              <div className={styles.availSection}>
                <label className={styles.lab}>Availability <span className={styles.req}>*</span></label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <span className={styles.houseSubLabel}>Available from</span>
                    <input type="date" value={availFrom} onChange={e => setAvailFrom(e.target.value)}
                      className={styles.field} style={{ padding: '0 12px' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span className={styles.houseSubLabel} style={{ margin: 0 }}>Until</span>
                      <button type="button" onClick={() => setOpenEnded(v => !v)} className={styles.openEndedBtn}
                        style={{ color: openEnded ? '#6d28d9' : '#9a94a8' }}>
                        {openEnded ? '✓ ' : ''}Open-ended
                      </button>
                    </div>
                    <input type="date" value={availTo} onChange={e => setAvailTo(e.target.value)} disabled={openEnded}
                      className={styles.field}
                      style={{ padding: '0 12px', background: openEnded ? '#f1eef7' : '#faf9fc', color: openEnded ? NEUTRAL : '#1c1530' }} />
                  </div>
                </div>
                <p style={{ fontSize: 12, color: rentalColor, fontWeight: 600, margin: '8px 0 0' }}>{rentalMsg}</p>

                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  {[
                    { label: 'Min. period', val: minPeriod, set: setMinPeriod, opts: [['', 'No minimum'], ['1', '1 month'], ['2', '2 months'], ['3', '3 months'], ['6', '6 months'], ['12', '12 months']] as [string, string][] },
                    { label: 'Max. period', val: maxPeriod, set: setMaxPeriod, opts: [['', 'No maximum'], ['6', '6 months'], ['12', '12 months'], ['24', '24 months'], ['36', '36 months']] as [string, string][] },
                  ].map(({ label, val, set, opts }) => (
                    <div key={label} style={{ flex: 1, position: 'relative' }}>
                      <label className={styles.lab}>{label}</label>
                      <select value={val} onChange={e => set(e.target.value)}
                        className={`${styles.field} ${styles.select}`}
                        style={{ padding: '0 28px 0 12px', color: val ? '#1c1530' : '#9aa0ad' }}>
                        {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                      <span className={styles.selectChevron}>
                        <Icon paths={['m6 9 6 6 6-6']} size={14} stroke="#6d28d9" sw={2.4} />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 4: PHOTOS & PUBLISH ── */}
          {step === 4 && (
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: photosOk ? OK : WARN, margin: '0 0 14px' }}>
                {photosOk
                  ? `${uploadedPhotos.length} photos added · first is the cover`
                  : `Add at least 3 photos — ${uploadedPhotos.length}/3 so far. First is the cover.`}
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic"
                multiple
                style={{ display: 'none' }}
                onChange={e => { if (e.target.files?.length) { uploadFiles(e.target.files); e.target.value = ''; } }}
              />

              <div className={styles.photosGrid}>
                <button type="button"
                  disabled={photos.some(p => p.uploading) || photos.length >= 8}
                  onClick={() => fileInputRef.current?.click()}
                  className={styles.addPhotoBtn}
                  style={{ borderColor: photosOk ? '#cfc8dd' : WARN, opacity: photos.length >= 8 ? 0.4 : 1 }}>
                  <Icon paths={['M12 5v14M5 12h14']} size={22} sw={2} />
                  <span style={{ fontSize: 10, fontWeight: 700 }}>
                    {photos.some(p => p.uploading) ? 'Uploading…' : 'Add photo'}
                  </span>
                </button>

                {photos.map((photo, i) => (
                  <div key={i} className={styles.photoThumb} style={{ opacity: photo.uploading ? 0.55 : 1 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.previewUrl} alt={`Photo ${i + 1}`}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    {photo.uploading && (
                      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(20,14,32,.45)' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
                            <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur=".8s" repeatCount="indefinite" />
                          </path>
                        </svg>
                      </div>
                    )}
                    {photo.error && (
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(194,85,122,.9)', padding: '4px 6px', fontSize: 10, fontWeight: 700, color: '#fff', textAlign: 'center' }}>
                        Failed — tap × to remove
                      </div>
                    )}
                    {i === 0 && !photo.uploading && !photo.error && (
                      <span className={styles.coverBadge}>COVER</span>
                    )}
                    <button type="button" onClick={() => removePhoto(i)} className={styles.removeBtn}>
                      <Icon paths={['M18 6 6 18M6 6l12 12']} size={12} sw={2.6} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Checklist */}
              <div className={styles.checklist}>
                {checklist.map(ck => (
                  <div key={ck.label} className={styles.checkItem}>
                    <span className={styles.checkDot} style={{ background: ck.done ? OK : '#fff', borderColor: ck.done ? OK : '#d9d3e4' }}>
                      {ck.done && <Icon paths={['M20 6 9 17l-5-5']} size={10} stroke="#fff" sw={3} />}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: ck.done ? '#1c1530' : '#9a94a8' }}>{ck.label}</span>
                  </div>
                ))}
              </div>

              {publishError && (
                <p style={{ fontSize: 12, color: '#c2557a', fontWeight: 600, margin: '12px 0 0', textAlign: 'center' }}>{publishError}</p>
              )}
            </div>
          )}
        </div>

        {/* ── Sticky CTA ── */}
        <div className={styles.cta}>
          {step > 1 && (
            <button type="button" onClick={goBack} className={styles.ctaBack}>
              <Icon paths={['M19 12H5M11 6l-6 6 6 6']} size={18} stroke="#3a3646" sw={2.4} />
            </button>
          )}
          <button type="button" onClick={goNext}
            disabled={step === 4 && !canPublish}
            className={styles.ctaNext}
            style={{ opacity: step === 4 && !canPublish ? 0.5 : 1, cursor: step === 4 && !canPublish ? 'not-allowed' : 'pointer' }}>
            {step === 4 ? (publishing ? 'Publishing…' : 'Publish listing') : 'Continue'}
            {!(step === 4 && publishing) && <Icon paths={['M5 12h14M13 6l6 6-6 6']} size={18} stroke="#fff" sw={2.4} />}
          </button>
        </div>
      </div>
    </div>
  );
}
