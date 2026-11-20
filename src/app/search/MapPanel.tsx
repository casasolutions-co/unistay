'use client';

import { useState, useCallback, useEffect, useRef, type RefObject } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import 'leaflet/dist/leaflet.css';
import styles from './MapPanel.module.css';
import { areaTooBig, type Bbox } from '@/lib/mapArea';

export interface MapProperty {
  id: string;
  title: string;
  address: string;
  price: number;
  featured: boolean;
  badge: 'CASA' | 'PARTNER' | 'PRIVATE';
  lat: number;
  lng: number;
  now: boolean;
  avail: string;
}

interface Props {
  properties: MapProperty[];
  /** Appended to listing links (chosen dates), same as the cards. */
  linkQuery?: string;
  /** Shows a "Search this area" button once the user pans/zooms; called with the visible bounds. */
  onSearchArea?: (bbox: Bbox) => void;
  /** Fit the map to the results when the city changes. Off while an area search is active, so the map stays put. */
  autoFit?: boolean;
  /** Start the map on these bounds (an active area search) instead of the default centre. */
  initialBounds?: Bbox;
}

function fmtN(n: number) {
  return n.toLocaleString('en-US');
}

function makePinIcon(price: number, featured: boolean, badge: 'CASA' | 'PARTNER' | 'PRIVATE') {
  const label = `€${fmtN(price)}`;
  const bg = badge === 'PRIVATE' ? '#0d7a5f' : featured ? '#6d28d9' : '#fff';
  const color = (badge === 'PRIVATE' || featured) ? '#fff' : '#1c1530';
  const html = `<div style="
    display: inline-block;
    font-family: system-ui, sans-serif;
    font-weight: 800;
    font-size: 12.5px;
    color: ${color};
    background: ${bg};
    padding: 6px 11px;
    border-radius: 999px;
    box-shadow: 0 4px 12px -2px rgba(76,29,149,.4);
    border: 1.5px solid #fff;
    white-space: nowrap;
    cursor: pointer;
    transform: translate(-50%, -50%);
  ">${label}</div>`;
  return L.divIcon({ html, className: '', iconSize: [0, 0], iconAnchor: [0, 0] });
}

function ZoomControls() {
  const map = useMap();
  return (
    <div className={styles.zoomControls}>
      <button className={styles.zoomBtn} style={{ borderBottom: '1px solid #efecf5' }} onClick={() => map.zoomIn()}>+</button>
      <button className={styles.zoomBtn} onClick={() => map.zoomOut()}>−</button>
    </div>
  );
}

function FitBoundsOnCity({ cityKey, pins, enabled, fittingRef }: { cityKey: string; pins: MapProperty[]; enabled: boolean; fittingRef: RefObject<boolean> }) {
  const map = useMap();
  const lastKey = useRef('');

  useEffect(() => {
    // Forget the last fit while disabled, so returning to a city search refits even to the same city.
    if (!enabled) { lastKey.current = ''; return; }
    if (pins.length === 0 || cityKey === lastKey.current) return;
    lastKey.current = cityKey;
    // Non-animated so movestart fires synchronously inside the flag — that's how
    // SearchAreaControl tells this programmatic move apart from the user's.
    fittingRef.current = true;
    if (pins.length === 1) {
      map.setView([pins[0].lat, pins[0].lng], 13, { animate: false });
    } else {
      map.fitBounds(L.latLngBounds(pins.map(p => [p.lat, p.lng] as [number, number])), { padding: [48, 48], animate: false });
    }
    fittingRef.current = false;
  }, [map, cityKey, pins, enabled, fittingRef]);
  return null;
}

function SearchAreaControl({ onSearch, fittingRef }: { onSearch: (b: Bbox) => void; fittingRef: RefObject<boolean> }) {
  const [moved, setMoved] = useState(false);
  const [tooBig, setTooBig] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const bbox = (m: L.Map): Bbox => {
    const b = m.getBounds();
    return [b.getSouth(), b.getWest(), b.getNorth(), b.getEast()];
  };
  const map = useMapEvents({
    movestart: () => { if (!fittingRef.current) setMoved(true); },
    moveend: () => setTooBig(areaTooBig(bbox(map))),
  });
  // Clicks/drags on the button must not reach the map underneath.
  useEffect(() => {
    if (ref.current) { L.DomEvent.disableClickPropagation(ref.current); L.DomEvent.disableScrollPropagation(ref.current); }
  }, [moved]);

  if (!moved) return null;
  return (
    <button
      ref={ref}
      type="button"
      className={styles.searchAreaBtn}
      disabled={tooBig}
      onClick={() => { onSearch(bbox(map)); setMoved(false); }}
    >
      {tooBig ? 'Zoom in to search this area' : 'Search this area'}
    </button>
  );
}

export default function MapPanel({ properties, linkQuery, onSearchArea, autoFit = true, initialBounds }: Props) {
  const fittingRef = useRef(false);
  const router = useRouter();
  const href = (id: string) => linkQuery ? `/search/${id}?${linkQuery}` : `/search/${id}`;
  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState<MapProperty | null>(null);
  // react-leaflet v5 bug: MapContainer never clears its internal mapInstanceRef on cleanup,
  // so after React Strict Mode's simulated unmount the remounted instance skips map creation
  // and hands a destroyed map (no panes) to children. Bumping the key forces a fresh instance.
  const [mapKey, setMapKey] = useState(0);
  const cleanedUpRef = useRef(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- client-mount flag for SSR-safe map rendering; can't be known during the server render
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (cleanedUpRef.current) {
      setMapKey(k => k + 1);
      cleanedUpRef.current = false;
    }
    return () => { cleanedUpRef.current = true; };
  }, []);

  const onEnter = useCallback((p: MapProperty) => setHovered(p), []);
  const onLeave = useCallback(() => setHovered(null), []);

  if (!mounted) return null;

  // One pin per unique coordinate — show cheapest listing at each location
  const pinMap: Record<string, MapProperty> = {};
  for (const p of properties) {
    const k = `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`;
    if (!pinMap[k] || p.price < pinMap[k].price) pinMap[k] = p;
  }
  const pins = Object.values(pinMap);
  // Stable key that only changes when the city changes, not on filter tweaks
  const cityKey = pins.length > 0 ? `${pins[0].lat.toFixed(1)},${pins[0].lng.toFixed(1)}` : '';

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapContainer
        key={mapKey}
        {...(initialBounds
          ? { bounds: L.latLngBounds([initialBounds[0], initialBounds[1]], [initialBounds[2], initialBounds[3]]) }
          : { center: [48.137, 11.582] as [number, number], zoom: 12 })}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
        attributionControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <ZoomControls />
        <FitBoundsOnCity cityKey={cityKey} pins={pins} enabled={autoFit} fittingRef={fittingRef} />
        {onSearchArea && <SearchAreaControl onSearch={onSearchArea} fittingRef={fittingRef} />}
        {pins.map(p => (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            icon={makePinIcon(p.price, p.featured, p.badge)}
            eventHandlers={{ mouseover: () => onEnter(p), mouseout: onLeave, click: () => router.push(href(p.id)) }}
          >
            {hovered?.id === p.id && (
              <Popup offset={[0, -8]} closeButton={false} autoPan={false}>
                <Link href={href(p.id)} className={styles.popup} style={{ display: 'block', color: 'inherit', textDecoration: 'none' }}>
                  <p className={styles.popupTitle}>{p.title}</p>
                  <p className={styles.popupAddress}>{p.address}</p>
                  <div className={styles.popupFooter}>
                    <span className={styles.popupPrice}>€{fmtN(p.price)}<span className={styles.popupUnit}>/mo</span></span>
                    <span className={styles.popupAvail} style={{ color: p.now ? '#1f8a5b' : '#9a94a8' }}>
                      <span className={styles.popupDot} style={{ background: p.now ? '#27ae73' : '#cfc8dd' }} />
                      {p.avail}
                    </span>
                  </div>
                </Link>
              </Popup>
            )}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
