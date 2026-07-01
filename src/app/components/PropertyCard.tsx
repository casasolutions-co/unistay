'use client';

import Link from 'next/link';
import styles from './PropertyCard.module.css';

export interface PropertyCardListing {
  id: string;
  title: string;
  address: string;
  area: number;
  beds: string;
  price: number;
  badge: 'CASA' | 'PARTNER' | 'HOST';
  avail: string;
  now: boolean;
  incl: boolean;
  coverPhoto?: string | null;
}

interface PropertyCardProps {
  listing: PropertyCardListing;
  hue?: { a: string; b: string };
  saved?: boolean;
  onToggleSave?: (id: string) => void;
  className?: string;
}

const DEFAULT_HUE = { a: '#e9e3f5', b: '#f1ecfa' };

function fmtN(n: number) {
  return n.toLocaleString('en-US');
}

const IArea = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b0aabf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 3 3 21M9 3H3v6M21 15v6h-6" />
  </svg>
);

const IBed = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b0aabf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 11h20M2 11V6a2 2 0 0 1 2-2h6v7M22 11v6M2 17h20M4 20v-3M20 20v-3" />
  </svg>
);

const IHeart = ({ saved }: { saved: boolean }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill={saved ? '#6d28d9' : 'none'} stroke={saved ? '#6d28d9' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
  </svg>
);

export default function PropertyCard({ listing: p, hue = DEFAULT_HUE, saved, onToggleSave, className }: PropertyCardProps) {
  return (
    <div className={`${styles.card} ${className ?? ''}`}>
      <Link href={`/search/${p.id}`} className={styles.cardLink}>
        <div
          className={styles.cardImg}
          style={p.coverPhoto ? { backgroundImage: `url(${p.coverPhoto})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: `repeating-linear-gradient(135deg, ${hue.a} 0 15px, ${hue.b} 15px 30px)` }}
        >
          <span className={styles.cardBadge} style={{ background: p.badge === 'PARTNER' ? '#1c1530' : p.badge === 'HOST' ? '#0d7a5f' : '#6d28d9' }}>
            {p.badge === 'HOST' ? 'Private' : p.badge}
          </span>
          {!p.coverPhoto && <span className={styles.cardImgLabel}>[ photo ]</span>}
        </div>

        <div className={styles.cardBody}>
          <h3 className={styles.cardTitle}>{p.title}</h3>
          <p className={styles.cardAddress}>{p.address}</p>

          <div className={styles.cardMeta}>
            <span className={styles.cardMetaItem}><IArea /> {p.area} m²</span>
            <span className={styles.cardMetaItem}><IBed /> {p.beds}</span>
          </div>

          <div className={styles.cardFooter}>
            <div>
              <span className={styles.cardPrice}>€{fmtN(p.price)}</span>
              <span className={styles.cardPriceUnit}> /month</span>
              {p.incl && <div className={styles.cardIncl}>incl. utilities</div>}
            </div>
            <span className={styles.cardAvail} style={{ color: p.now ? '#1f8a5b' : '#9a94a8' }}>
              <span className={styles.cardAvailDot} style={{ background: p.now ? '#27ae73' : '#cfc8dd' }} />
              {p.avail}
            </span>
          </div>
        </div>
      </Link>

      {onToggleSave && (
        <button
          type="button"
          className={styles.saveBtn}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSave(p.id); }}
          aria-label={saved ? 'Remove from saved homes' : 'Save home'}
        >
          <IHeart saved={!!saved} />
        </button>
      )}
    </div>
  );
}
