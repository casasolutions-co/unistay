'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './page.module.css';

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

export default function ListYourPlace() {
  const [ptype, setPtype] = useState<PType>('studio');
  const [title, setTitle] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [size, setSize] = useState(30);
  const [floor, setFloor] = useState(1);
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
  const [photoCount, setPhotoCount] = useState(0);

  // Derived
  const titleOk = title.length >= 12 && title.length <= 60;
  const descOk = desc.length >= 60 && desc.length <= 600;
  const selectedAmen = AMEN_DEFS.filter(([k]) => amenities[k]);
  const amenCount = selectedAmen.length;
  const photosOk = photoCount >= 3;
  const warm = (parseInt(rent) || 0) + (parseInt(utilities) || 0);
  const depositNum = parseInt(deposit) || 0;
  const depositHint = depositNum && warm
    ? `≈ ${(depositNum / warm).toFixed(1).replace('.0', '')} months of warm rent`
    : "Most students expect 1–3 months' rent";

  const todayISO = new Date().toISOString().slice(0, 10);
  const startsNow = !!availFrom && availFrom <= todayISO;
  const fromText = availFrom ? (startsNow ? 'immediately' : fmtDate(availFrom)) : null;
  const toText = openEnded ? null : (availTo ? fmtDate(availTo) : null);
  const datesOk = !(availFrom && availTo && !openEnded && availTo < availFrom);
  const availOk = !!availFrom && (openEnded || !!availTo) && datesOk;

  let rentalMsg = 'Pick a move-in date, then an end date or open-ended';
  let rentalColor = NEUTRAL;
  if (!datesOk) { rentalMsg = 'End date must be after the start date'; rentalColor = WARN; }
  else if (openEnded) rentalMsg = 'Open-ended (unlimited) rental';
  else if (fromText && toText) rentalMsg = 'Fixed-term rental';

  let availPreview = 'date TBD';
  if (fromText && openEnded) availPreview = `${fromText} · open-ended`;
  else if (fromText && toText) availPreview = `${fromText} – ${toText}`;
  else if (fromText) availPreview = fromText;

  const reqs = [
    !!title.trim() && titleOk,
    !!(street.trim() && city.trim() && postcode.trim()),
    amenCount >= 1,
    descOk,
    !!rent.trim() && availOk,
    photosOk,
  ];
  const pct = Math.round(reqs.filter(Boolean).length / reqs.length * 100);
  const canPublish = reqs.every(Boolean);

  const checklist = [
    { done: !!title.trim() && titleOk, label: 'Title (12–60 characters)' },
    { done: !!(street.trim() && city.trim() && postcode.trim()), label: 'Full address' },
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

  const ptypeLabel = PTYPE_DEFS.find(t => t.id === ptype)?.label ?? 'Studio';
  const amenPreview = selectedAmen.slice(0, 5).map(([, label]) => label);
  const moreAmen = Math.max(0, amenCount - 5);

  function ptypeIcon(id: PType) {
    const p: Record<PType, string[]> = {
      studio: ['M3 9.5 12 3l9 6.5', 'M5 8.5V21h14V8.5', 'M9 21v-6h6v6'],
      apartment: ['M4 21V4h16v17', 'M9 8h2M13 8h2M9 12h2M13 12h2M9 16h2M13 16h2'],
      room: ['M3 21h18M5 21V8l7-4 7 4v13', 'M10 21v-5h4v5'],
      house: ['M3 21h18M6 21V8h12v13', 'M9 12h.01M15 12h.01'],
    };
    return <Icon paths={p[id]} />;
  }

  const seg = (on: boolean) => ({
    border: on ? '#6d28d9' : '#e6e2ef',
    bg: on ? '#f3effe' : '#fff',
    color: on ? '#6d28d9' : '#5a5568',
  });

  return (
    <div className={styles.page}>

      {/* NAV */}
      <nav className={styles.nav}>
        <Link href="/" className={styles.navBrand}>
          <Image src="/primary-logo.png" alt="UniStay" width={2049} height={1772} style={{ height: 44, width: 'auto' }} priority />
        </Link>
        <div className={styles.navRight}>
          <span className={styles.navDraft}>Draft saved automatically</span>
          <Link href="/" className={styles.navExit}>Exit</Link>
        </div>
      </nav>

      {/* PROGRESS */}
      <div className={styles.progressBar}>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${pct}%` }} />
        </div>
        <span className={styles.progressPct}>{pct}% complete</span>
      </div>

      {/* BODY */}
      <div className={styles.body}>

        {/* ── FORM COLUMN ── */}
        <div className={styles.formCol}>

          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 38, lineHeight: 1.04, letterSpacing: '-0.03em', margin: 0, color: 'var(--text)' }}>List your place</h1>
            <p style={{ fontSize: 15, color: 'var(--text-muted)', margin: '10px 0 0' }}>Fill in the details below. Your listing preview updates live as you type.</p>
          </div>

          {/* SECTION 1 – BASICS */}
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionNum}>1</span>
              <h2 className={styles.sectionTitle}>The basics</h2>
            </div>

            <label className={styles.usLab}>Property type <span style={{ color: '#e0457b' }}>*</span></label>
            <div className={styles.ptypeGrid}>
              {PTYPE_DEFS.map(t => {
                const on = ptype === t.id;
                return (
                  <button key={t.id} type="button" onClick={() => setPtype(t.id)} className={styles.ptypeBtn}
                    style={{ borderColor: on ? '#6d28d9' : '#e6e2ef', background: on ? '#f3effe' : '#faf9fc', color: on ? '#6d28d9' : '#5a5568' }}>
                    {ptypeIcon(t.id)}
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            <label className={styles.usLab}>Listing title <span style={{ color: '#e0457b' }}>*</span></label>
            <input type="text" placeholder="e.g. Sunny studio near TU Berlin campus"
              value={title} onChange={e => setTitle(e.target.value.slice(0, 60))}
              className={styles.usField} style={{ padding: '0 14px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '7px 0 20px' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: titleOk ? OK : title.length ? WARN : NEUTRAL }}>{hintFor(title, 12)}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: NEUTRAL }}>{title.length}/60</span>
            </div>

            <label className={styles.usLab}>Address <span style={{ color: '#e0457b' }}>*</span></label>
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#b0aabf' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx={12} cy={10} r={3} />
                </svg>
              </span>
              <input type="text" placeholder="Street & house number" value={street} onChange={e => setStreet(e.target.value)}
                className={styles.usField} style={{ padding: '0 14px 0 42px' }} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <input type="text" placeholder="City" value={city} onChange={e => setCity(e.target.value)}
                className={styles.usField} style={{ padding: '0 14px', flex: 1 }} />
              <input type="text" placeholder="Postcode" value={postcode} onChange={e => setPostcode(e.target.value)}
                className={styles.usField} style={{ padding: '0 14px', flex: 0.55 }} />
            </div>
          </section>

          {/* SECTION 2 – SPACE & DETAILS */}
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionNum}>2</span>
              <h2 className={styles.sectionTitle}>Space &amp; details</h2>
            </div>

            <div className={styles.countersRow}>
              {[
                { label: 'Bedrooms', val: bedrooms, dec: () => setBedrooms(v => Math.max(0, v - 1)), inc: () => setBedrooms(v => v + 1) },
                { label: 'Bathrooms', val: bathrooms, dec: () => setBathrooms(v => Math.max(1, v - 1)), inc: () => setBathrooms(v => v + 1) },
                { label: 'Size', val: `${size} m²`, dec: () => setSize(v => Math.max(10, v - 1)), inc: () => setSize(v => v + 1) },
                { label: 'Floor', val: floor, dec: () => setFloor(v => Math.max(0, v - 1)), inc: () => setFloor(v => v + 1) },
                { label: 'Suitable for', val: `${suitableFor} ppl`, dec: () => setSuitableFor(v => Math.max(1, v - 1)), inc: () => setSuitableFor(v => v + 1) },
              ].map(({ label, val, dec, inc }) => (
                <div key={label} style={{ flex: 1 }}>
                  <label className={styles.usLab}>{label}</label>
                  <div className={styles.counterBox}>
                    <button type="button" onClick={dec} className={styles.counterBtn}>−</button>
                    <span className={styles.counterVal}>{val}</span>
                    <button type="button" onClick={inc} className={styles.counterBtn}>+</button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
              <label className={styles.usLab} style={{ margin: 0 }}>Amenities <span style={{ color: '#e0457b' }}>*</span></label>
              <span style={{ fontSize: 12, fontWeight: 700, color: NEUTRAL }}>{amenCount} selected</span>
            </div>
            <div className={styles.amenitiesRow}>
              {AMEN_DEFS.map(([k, label, paths]) => {
                const on = !!amenities[k];
                return (
                  <button key={k} type="button" onClick={() => setAmenities(p => ({ ...p, [k]: !p[k] }))}
                    className={styles.amenBtn}
                    style={{ borderColor: on ? '#6d28d9' : '#e6e2ef', background: on ? '#f3effe' : '#faf9fc', color: on ? '#6d28d9' : '#5a5568' }}>
                    <span style={{ color: on ? '#6d28d9' : '#9a94a8', display: 'grid', placeItems: 'center' }}>
                      <Icon paths={paths} size={15} />
                    </span>
                    {label}
                  </button>
                );
              })}
            </div>

            <label className={styles.usLab}>Description <span style={{ color: '#e0457b' }}>*</span></label>
            <textarea placeholder="Describe the space, light, neighbourhood, transit links, and who it's perfect for…"
              value={desc} onChange={e => setDesc(e.target.value.slice(0, 600))}
              className={`${styles.usField} ${styles.usFieldTextarea}`} rows={5} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: descOk ? OK : desc.length ? WARN : NEUTRAL }}>{hintFor(desc, 60)}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: NEUTRAL }}>{desc.length}/600</span>
            </div>

            {/* Housemates (optional) */}
            <div className={styles.houseBox}>
              <div className={styles.houseBoxHead}>
                <label className={styles.usLab} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx={9} cy={8} r={3.5} /><path d="M2 20a7 7 0 0 1 14 0" />
                    <path d="M17 7.5a3.5 3.5 0 0 1 0 6.8M22 20a6 6 0 0 0-4-5.6" />
                  </svg>
                  About the housemates
                </label>
                <span style={{ fontSize: 11, fontWeight: 700, color: NEUTRAL }}>Optional</span>
              </div>

              <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                <div style={{ flexShrink: 0, width: 150 }}>
                  <span style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>No. of housemates</span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 48, border: '1.5px solid var(--border)', background: 'var(--white)', borderRadius: 12, padding: '0 7px' }}>
                    <button type="button" onClick={() => setNumMates(v => Math.max(0, v - 1))} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'var(--page)', cursor: 'pointer', color: 'var(--brand)', fontSize: 18, display: 'grid', placeItems: 'center' }}>−</button>
                    <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{numMates}</span>
                    <button type="button" onClick={() => setNumMates(v => v + 1)} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'var(--page)', cursor: 'pointer', color: 'var(--brand)', fontSize: 18, display: 'grid', placeItems: 'center' }}>+</button>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>Current housemates</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {mateGenderOpts.map(g => {
                      const s = seg(mateGender === g.id);
                      return (
                        <button key={g.id} type="button" onClick={() => setMateGender(g.id)}
                          style={{ height: 48, padding: '0 14px', borderRadius: 12, border: `1.5px solid ${s.border}`, background: s.bg, color: s.color, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, transition: 'all .14s' }}>
                          {g.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <span style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>Preferred new housemate</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
                {prefGenderOpts.map(g => {
                  const s = seg(prefGender === g.id);
                  return (
                    <button key={g.id} type="button" onClick={() => setPrefGender(g.id)}
                      style={{ height: 42, padding: '0 16px', borderRadius: 999, border: `1.5px solid ${s.border}`, background: s.bg, color: s.color, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, transition: 'all .14s' }}>
                      {g.label}
                    </button>
                  );
                })}
              </div>

              <textarea placeholder="Anything else about the household? e.g. quiet weekdays, no smoking…"
                value={mates} onChange={e => setMates(e.target.value.slice(0, 240))}
                className={`${styles.usField} ${styles.usFieldTextarea}`} rows={2} style={{ background: 'var(--white)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: NEUTRAL }}>{mates.length ? 'Optional · adds a nice personal touch' : 'Optional'}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: NEUTRAL }}>{mates.length}/240</span>
              </div>
            </div>
          </section>

          {/* SECTION 3 – PRICING */}
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionNum}>3</span>
              <h2 className={styles.sectionTitle}>Pricing</h2>
            </div>

            <div className={styles.priceRow}>
              {[
                { label: <>Cold rent (Kaltmiete) <span style={{ color: '#e0457b' }}>*</span></>, ph: '650', val: rent, set: setRent },
                { label: 'Utilities (Nebenkosten)', ph: '120', val: utilities, set: setUtilities },
              ].map(({ label, ph, val, set }, i) => (
                <div key={i} style={{ flex: 1 }}>
                  <label className={styles.usLab}>{label}</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--brand)', fontWeight: 800, fontSize: 16 }}>€</span>
                    <input type="text" placeholder={ph} value={val} onChange={e => set(e.target.value)} className={styles.usField} style={{ padding: '0 14px 0 34px' }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 18 }}>
              <label className={styles.usLab}>Deposit</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--brand)', fontWeight: 800, fontSize: 16 }}>€</span>
                <input type="text" placeholder="1300" value={deposit} onChange={e => setDeposit(e.target.value)}
                  className={styles.usField} style={{ padding: '0 14px 0 34px', maxWidth: 240 }} />
              </div>
              <p style={{ fontSize: 12, color: NEUTRAL, fontWeight: 600, margin: '7px 0 0' }}>{depositHint}</p>
            </div>

            <div style={{ borderTop: '1px solid #f1eef7', paddingTop: 18, marginBottom: 18 }}>
              <label className={styles.usLab}>Availability <span style={{ color: '#e0457b' }}>*</span></label>
              <div className={styles.availRow}>
                <div style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>Available from</span>
                  <input type="date" value={availFrom} onChange={e => setAvailFrom(e.target.value)} className={styles.usField} style={{ padding: '0 14px' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Available until</span>
                    <button type="button" onClick={() => setOpenEnded(v => !v)}
                      style={{ fontSize: 12, fontWeight: 700, color: openEnded ? 'var(--brand)' : '#9a94a8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      {openEnded ? '✓ ' : ''}Open-ended
                    </button>
                  </div>
                  <input type="date" value={availTo} onChange={e => setAvailTo(e.target.value)} disabled={openEnded}
                    className={styles.usField}
                    style={{ padding: '0 14px', background: openEnded ? '#f1eef7' : 'var(--page)', color: openEnded ? NEUTRAL : 'var(--text)' }} />
                </div>
              </div>
              <p style={{ fontSize: 12, color: rentalColor, fontWeight: 600, margin: '9px 0 0' }}>{rentalMsg}</p>

              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                {[
                  { label: 'Minimum rental period', val: minPeriod, set: setMinPeriod, opts: [['', 'No minimum'], ['1', '1 month'], ['2', '2 months'], ['3', '3 months'], ['6', '6 months'], ['12', '12 months']] },
                  { label: 'Maximum rental period', val: maxPeriod, set: setMaxPeriod, opts: [['', 'No maximum'], ['6', '6 months'], ['12', '12 months'], ['24', '24 months'], ['36', '36 months']] },
                ].map(({ label, val, set, opts }) => (
                  <div key={label} style={{ flex: 1, position: 'relative' }}>
                    <label className={styles.usLab}>{label}</label>
                    <select value={val} onChange={e => set(e.target.value)}
                      className={`${styles.usField} ${styles.usFieldSelect}`}
                      style={{ padding: '0 32px 0 14px', color: val ? 'var(--text)' : '#9aa0ad' }}>
                      {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                    <span style={{ position: 'absolute', right: 12, bottom: 17, pointerEvents: 'none', color: 'var(--brand)' }}>
                      <Icon paths={['m6 9 6 6 6-6']} size={16} sw={2.4} />
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.warmRentBar}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#4a2c8f' }}>Warm rent students will pay</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--brand)' }}>
                €{warm || '—'}<span style={{ fontSize: 13, fontWeight: 600, color: '#8a7bb5' }}>/mo</span>
              </span>
            </div>
          </section>

          {/* SECTION 4 – PHOTOS */}
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionNum}>4</span>
              <h2 className={styles.sectionTitle}>Photos</h2>
            </div>
            <p style={{ fontSize: 13.5, fontWeight: 600, color: photosOk ? OK : WARN, margin: '0 0 18px 41px' }}>
              {photosOk ? `${photoCount} photos added · drag to reorder` : `Add at least 3 photos — ${photoCount}/3 so far. First photo is the cover.`}
            </p>
            <div className={styles.photosGrid}>
              <button type="button" onClick={() => setPhotoCount(v => Math.min(8, v + 1))}
                className={styles.addPhotoBtn} style={{ borderColor: photosOk ? '#cfc8dd' : WARN }}>
                <Icon paths={['M12 5v14M5 12h14']} size={24} sw={2} />
                <span style={{ fontSize: 11, fontWeight: 700 }}>Add photo</span>
              </button>
              {Array.from({ length: photoCount }, (_, i) => (
                <div key={i} className={styles.photoThumb}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x={3} y={5} width={18} height={14} rx={2} />
                    <circle cx={9} cy={10} r={1.6} />
                    <path d="m21 17-5-5L5 19" />
                  </svg>
                  {i === 0 && <span className={styles.photoCoverBadge}>COVER</span>}
                  <button type="button" onClick={() => setPhotoCount(v => Math.max(0, v - 1))} className={styles.photoRemoveBtn}>
                    <Icon paths={['M18 6 6 18M6 6l12 12']} size={13} sw={2.6} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ── PREVIEW COLUMN ── */}
        <div className={styles.previewCol}>
          <p className={styles.previewLabel}>Live preview · what students see</p>

          <div className={styles.previewCard}>
            <div className={styles.previewCover}>
              {photoCount === 0 ? (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,.5)' }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <rect x={3} y={5} width={18} height={14} rx={2} />
                    <circle cx={9} cy={10} r={1.6} />
                    <path d="m21 17-5-5L5 19" />
                  </svg>
                  <div style={{ fontSize: 11, marginTop: 6 }}>Add photos to see the cover</div>
                </div>
              ) : (
                <span style={{ color: 'rgba(255,255,255,.4)', fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>[ cover photo ]</span>
              )}
              <span className={styles.previewTypeBadge}>{ptypeLabel}</span>
            </div>

            <div className={styles.previewBody}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 19, lineHeight: 1.15, letterSpacing: '-0.02em', margin: 0, color: title.trim() ? 'var(--text)' : NEUTRAL }}>
                {title.trim() || 'Your listing title appears here'}
              </h3>
              <p style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13.5, color: 'var(--text-muted)', margin: '8px 0 0' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9a94a8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx={12} cy={10} r={3} />
                </svg>
                {city.trim() ? (street.trim() ? `${street}, ${city}` : city) : 'City, neighbourhood'}
              </p>

              <div className={styles.previewStats}>
                <div className={styles.previewStat}>
                  <Icon paths={['M3 18v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3M3 18v2M21 18v2']} size={16} stroke="#6d28d9" sw={1.9} />
                  {bedrooms} bed
                </div>
                <div className={styles.previewStat}>
                  <Icon paths={['M5 12V6a2 2 0 0 1 2-2 2 2 0 0 1 2 2M4 12h16v2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-2Z']} size={16} stroke="#6d28d9" sw={1.9} />
                  {bathrooms} bath
                </div>
                <div className={styles.previewStat}>
                  <Icon paths={['M3 3h18v18H3z', 'M3 9h18M9 3v18']} size={16} stroke="#6d28d9" sw={1.9} />
                  {size} m²
                </div>
              </div>

              <p style={{ fontSize: 13.5, lineHeight: 1.55, color: '#5a5568', margin: 0, minHeight: 40 }}>
                {desc.trim() || 'Your description will show here once you start writing it.'}
              </p>

              {mates.trim() && (
                <div className={styles.previewMatesBox}>
                  <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--brand)', marginBottom: 5 }}>Your housemates</div>
                  <p style={{ fontSize: 13, lineHeight: 1.5, color: '#4a2c8f', margin: 0 }}>{mates.trim()}</p>
                </div>
              )}

              {amenCount > 0 && (
                <div className={styles.previewAmenChips}>
                  {amenPreview.map(label => <span key={label} className={styles.previewAmenChip}>{label}</span>)}
                  {moreAmen > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand)', padding: '5px 4px' }}>+{moreAmen} more</span>}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 20 }}>
                <div>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: 'var(--text)' }}>€{warm || '—'}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-soft)' }}>/month</span>
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-soft)' }}>from {availPreview}</span>
              </div>
            </div>
          </div>

          {/* CHECKLIST + PUBLISH */}
          <div className={styles.checklistCard}>
            <div className={styles.checklistItems}>
              {checklist.map(ck => (
                <div key={ck.label} className={styles.checkItem}>
                  <span className={styles.checkDot} style={{ background: ck.done ? OK : 'var(--white)', borderColor: ck.done ? OK : '#d9d3e4' }}>
                    {ck.done && <Icon paths={['M20 6 9 17l-5-5']} size={11} stroke="#fff" sw={3} />}
                  </span>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: ck.done ? 'var(--text)' : '#9a94a8' }}>{ck.label}</span>
                </div>
              ))}
            </div>
            <button type="button" disabled={!canPublish} className={styles.publishBtn}>
              Publish listing
              <Icon paths={['M5 12h14M13 6l6 6-6 6']} size={18} sw={2.4} />
            </button>
            <p style={{ textAlign: 'center', fontSize: 12, color: '#9a94a8', margin: '12px 0 0' }}>
              {canPublish ? 'Everything looks ready to go live.' : 'Complete the checklist above to publish.'}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
