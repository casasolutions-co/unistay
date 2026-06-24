'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './MapPanel.module.css';

export interface MapProperty {
  id: string;
  title: string;
  address: string;
  price: number;
  featured: boolean;
  lat: number;
  lng: number;
  now: boolean;
  avail: string;
}

interface Props {
  properties: MapProperty[];
}

function fmtN(n: number) {
  return n.toLocaleString('en-US');
}

function makePinIcon(price: number, featured: boolean) {
  const label = `€${fmtN(price)}`;
  const bg = featured ? '#6d28d9' : '#fff';
  const color = featured ? '#fff' : '#1c1530';
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

function FitBoundsOnCity({ cityKey, pins }: { cityKey: string; pins: MapProperty[] }) {
  const map = useMap();
  const lastKey = useRef('');

  useEffect(() => {
    if (pins.length === 0 || cityKey === lastKey.current) return;
    lastKey.current = cityKey;
    if (pins.length === 1) {
      map.setView([pins[0].lat, pins[0].lng], 13);
      return;
    }
    const bounds = L.latLngBounds(pins.map(p => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [48, 48] });
  }, [map, cityKey, pins]);
  return null;
}

export default function MapPanel({ properties }: Props) {
  const [hovered, setHovered] = useState<MapProperty | null>(null);

  const onEnter = useCallback((p: MapProperty) => setHovered(p), []);
  const onLeave = useCallback(() => setHovered(null), []);

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
        center={[48.137, 11.582]}
        zoom={12}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
        attributionControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <ZoomControls />
        <FitBoundsOnCity cityKey={cityKey} pins={pins} />
        {pins.map(p => (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            icon={makePinIcon(p.price, p.featured)}
            eventHandlers={{ mouseover: () => onEnter(p), mouseout: onLeave }}
          >
            {hovered?.id === p.id && (
              <Popup offset={[0, -8]} closeButton={false} autoPan={false}>
                <div className={styles.popup}>
                  <p className={styles.popupTitle}>{p.title}</p>
                  <p className={styles.popupAddress}>{p.address}</p>
                  <div className={styles.popupFooter}>
                    <span className={styles.popupPrice}>€{fmtN(p.price)}<span className={styles.popupUnit}>/mo</span></span>
                    <span className={styles.popupAvail} style={{ color: p.now ? '#1f8a5b' : '#9a94a8' }}>
                      <span className={styles.popupDot} style={{ background: p.now ? '#27ae73' : '#cfc8dd' }} />
                      {p.avail}
                    </span>
                  </div>
                </div>
              </Popup>
            )}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
