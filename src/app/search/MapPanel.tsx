'use client';

import { useState, useCallback } from 'react';
import Map, { Marker, NavigationControl, Popup } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import styles from './MapPanel.module.css';

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

export interface MapProperty {
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

export default function MapPanel({ properties }: Props) {
  const [hovered, setHovered] = useState<MapProperty | null>(null);

  const onEnter = useCallback((p: MapProperty) => setHovered(p), []);
  const onLeave = useCallback(() => setHovered(null), []);

  /* ── Fallback when no token is configured ── */
  if (!TOKEN) {
    return (
      <div className={styles.fallback}>
        <div className={styles.fallbackGrid} />
        <div className={styles.fallbackWater1} />
        <div className={styles.fallbackWater2} />
        <span className={styles.fallbackLabel}>[ interactive map — Munich ]</span>
        <div className={styles.fallbackNote}>
          Add <code>NEXT_PUBLIC_MAPBOX_TOKEN</code> to <code>.env.local</code> to enable the map
        </div>
        <div className={styles.zoomControls}>
          <button className={styles.zoomBtn} style={{ borderBottom: '1px solid #efecf5' }}>+</button>
          <button className={styles.zoomBtn}>−</button>
        </div>
        {properties.map(p => (
          <span
            key={p.title}
            className={p.featured ? styles.pinFeatured : styles.pin}
            style={{ top: `${24 + Math.random() * 50}%`, left: `${20 + Math.random() * 60}%` }}
          >
            €{fmtN(p.price)}
          </span>
        ))}
      </div>
    );
  }

  return (
    <Map
      mapboxAccessToken={TOKEN}
      initialViewState={{ longitude: 11.582, latitude: 48.137, zoom: 12.2 }}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/light-v11"
    >
      <NavigationControl position="top-right" showCompass={false} />

      {properties.map(p => (
        <Marker key={p.title} longitude={p.lng} latitude={p.lat} anchor="center">
          <button
            className={p.featured ? styles.pinFeatured : styles.pin}
            onMouseEnter={() => onEnter(p)}
            onMouseLeave={onLeave}
          >
            €{fmtN(p.price)}
          </button>
        </Marker>
      ))}

      {hovered && (
        <Popup
          longitude={hovered.lng}
          latitude={hovered.lat}
          anchor="bottom"
          offset={16}
          closeButton={false}
          closeOnClick={false}
          className={styles.popupWrapper}
        >
          <div className={styles.popup}>
            <p className={styles.popupTitle}>{hovered.title}</p>
            <p className={styles.popupAddress}>{hovered.address}</p>
            <div className={styles.popupFooter}>
              <span className={styles.popupPrice}>€{fmtN(hovered.price)}<span className={styles.popupUnit}>/mo</span></span>
              <span className={styles.popupAvail} style={{ color: hovered.now ? '#1f8a5b' : '#9a94a8' }}>
                <span className={styles.popupDot} style={{ background: hovered.now ? '#27ae73' : '#cfc8dd' }} />
                {hovered.avail}
              </span>
            </div>
          </div>
        </Popup>
      )}
    </Map>
  );
}
