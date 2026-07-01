'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Props {
  lat: number;
  lng: number;
  address: string;
  badge: 'CASA' | 'PARTNER' | 'PRIVATE';
}

const PIN_HTML = (color: string) => `<div style="
  width: 28px; height: 28px;
  background: ${color};
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg) translate(-50%, -50%);
  border: 2.5px solid #fff;
  box-shadow: 0 3px 10px rgba(0,0,0,.25);
"></div>`;

function makePinIcon(badge: 'CASA' | 'PARTNER' | 'PRIVATE') {
  const color = badge === 'PRIVATE' ? '#0d7a5f' : badge === 'PARTNER' ? '#1c1530' : '#6d28d9';
  return L.divIcon({
    html: PIN_HTML(color),
    className: '',
    iconSize: [0, 0],
    iconAnchor: [14, 28],
  });
}

function SetView({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    map.setView([lat, lng], 15);
  }, [map, lat, lng]);
  return null;
}

export default function ListingMap({ lat, lng, address, badge }: Props) {
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    lat !== 0 || lng !== 0 ? { lat, lng } : null
  );
  const [mapKey, setMapKey] = useState(0);
  const cleanedUpRef = useRef(false);

  useEffect(() => { setMounted(true); }, []);

  // react-leaflet v5 strict-mode fix
  useEffect(() => {
    if (cleanedUpRef.current) {
      setMapKey(k => k + 1);
      cleanedUpRef.current = false;
    }
    return () => { cleanedUpRef.current = true; };
  }, []);

  // Geocode via Nominatim when lat/lng are unknown
  useEffect(() => {
    if (coords || !address) return;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
    fetch(url, { headers: { 'Accept-Language': 'en' } })
      .then(r => r.json())
      .then((results: { lat: string; lon: string }[]) => {
        if (results[0]) {
          setCoords({ lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) });
        }
      })
      .catch(() => {});
  }, [address, coords]);

  if (!mounted || !coords) return (
    <div style={{
      width: '100%', height: '100%',
      background: '#e9e3f5',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, color: '#9a94a8', borderRadius: 12,
    }}>
      Loading map…
    </div>
  );

  return (
    <MapContainer
      key={mapKey}
      center={[coords.lat, coords.lng]}
      zoom={15}
      style={{ width: '100%', height: '100%', borderRadius: 12 }}
      zoomControl={true}
      scrollWheelZoom={false}
      attributionControl={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <SetView lat={coords.lat} lng={coords.lng} />
      <Marker position={[coords.lat, coords.lng]} icon={makePinIcon(badge)} />
    </MapContainer>
  );
}
